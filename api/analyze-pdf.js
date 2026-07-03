// Vercel serverless function — proxies PDF to Anthropic API
// API key stays server-side, never exposed to browser

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', 'https://realtytaxtools.com');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'API key not configured. Add ANTHROPIC_API_KEY to Vercel environment variables.'
    });
  }

  try {
    const { base64, mediaType } = req.body;
    if (!base64) {
      return res.status(400).json({ error: 'No PDF data provided' });
    }

    const prompt = `You are a CPA expert in IRS real estate tax rules (Publication 551). Analyze this Closing Disclosure (CD) or HUD-1 Settlement Statement and categorize every line item per IRS rules.

CRITICAL: The CD uses its own sections (A,B,C,D,E,F,G,H) that have NOTHING to do with IRS tax buckets:
- CD Section A "Origination Charges" → IRS Loan Cost (sectionC)
- CD Section B "Services Did NOT Shop For" → IRS Loan Cost (sectionC), except appraisal in "Before Closing" column → poc
- CD Section C "Services DID Shop For" → IRS Property Basis (sectionB) — all "Title -" items go here
- CD Section E "Taxes/Gov Fees" → IRS Property Basis (sectionB) — recording fees always basis
- CD Section F "Prepaids" → IRS Currently Deductible (sectionD)
- CD Section G "Escrow" → IRS Escrow (sectionE)
- CD Section H "Other" → IRS Property Basis (sectionB) — Owner's title insurance always sectionB

IRS CLASSIFICATION RULES:

sectionB — Property Cost Basis (capitalized):
- titleInsuranceLender: "Title - Lender's Title Insurance" or "Lender's Title Policy"
- titleInsuranceOwner: "Title - Owner's Title Insurance" (often in CD Section H)
- otherTitleFees: "Title - Endorsement Fee", "Title - Courier Fee", "Title - Texas Policy Guaranty Fee", "Title - Recording Service Fee", any "Title -" fee not listed above
- settlementFee: "Title - Settlement Fee", "Closing Fee", "Escrow Fee"
- recordingCharges: ALL recording fees from CD Section E (combine Deed + Mortgage recording)
- surveyFee: Survey fee
- inspections: Home inspection (buyer's choice, not lender required)
- appraisalBasis: Appraisal that is buyer's own choice (not lender required) — rare
- otherBasis: HOA transfer fee, home warranty, other non-loan closing costs

sectionC — Loan Cost Basis (amortize over loan term):
- originationFee: "Originator Compensation", "Loan Origination Fee"
- discountPoints: "Discount Points", "Loan Discount"
- appraisalLender: Appraisal in "At Closing" column of CD Section B (paid AT closing, not POC)
- creditReport: "Credit Report"
- underwritingFee: "Underwriting Fee", "Processing Fee"
- attorneyFeeLoan: "Attorney Review Fee" under loan costs (CD Section B)
- lenderOther: Flood cert, tax service fee, wire fee
- lenderCredit: Lender Credits (enter as positive number)

sectionD — Currently Deductible:
- prepaidInterest: "Prepaid Interest", "Per Diem Interest" — always deductible
- insuranceMIP: Homeowners insurance premium at closing, upfront MIP
- propertyTaxClosing: ONLY if buyer is PAYING taxes as a charge (not an adjustment for seller unpaid taxes)
  WARNING: "County Taxes [date] to [date]" under "Adjustments for Items Unpaid by Seller" → goes to sectionF.taxAdjSeller NOT here

sectionE — Escrow Deposits:
- escrowInsurance, escrowTax, escrowMortgageIns, aggregateAdj (as positive)

sectionF — Credits to Buyer:
- earnestMoney: Deposit, Earnest Money
- loanFunds: Loan Amount
- sellerCredit: "Seller Credits", "Seller Concession"
- taxAdjSeller: "County Taxes [date] to [date]" or "City/Town Taxes [date] to [date]" listed as ADJUSTMENTS FOR ITEMS UNPAID BY SELLER. This is a credit FROM seller that reduces property basis. NEVER put this in sectionD.
- optionFee: "Option Fee", "Option Period" adjustment
- proratedHOA: HOA proration, other basis-reducing credits

poc — Paid Outside Closing (excluded from cash-to-close):
- pocAppraisal: Appraisal in "Before Closing" column, or marked "(POC)"
- pocDestination: "Loan Cost (C)" if lender-required; "Property Basis (B)" if buyer's choice

ABSOLUTE RULES:
1. Any "Title -" line → ALWAYS sectionB, never sectionC
2. "Adjustments for Items Unpaid by Seller" taxes → ALWAYS taxAdjSeller (sectionF), NEVER sectionD
3. Appraisal in "Before Closing" column → ALWAYS poc
4. Recording fees → ALWAYS sectionB.recordingCharges
5. Owner's Title Insurance → ALWAYS sectionB.titleInsuranceOwner
6. Your response must start with { and end with } — no text before or after

Return ONLY this JSON:
{"documentType":"CD","hasloan":true,"purchasePrice":null,"sectionB":{"titleInsuranceLender":null,"titleInsuranceOwner":null,"titleSearch":null,"otherTitleFees":null,"settlementFee":null,"recordingCharges":null,"taxStamps":null,"transferTaxes":null,"attorneyFeesBasis":null,"surveyFee":null,"inspections":null,"appraisalBasis":null,"otherBasis":null},"sectionC":{"originationFee":null,"discountPoints":null,"appraisalLender":null,"creditReport":null,"mortgageInsurancePMI":null,"assumptionFee":null,"underwritingFee":null,"attorneyFeeLoan":null,"lenderOther":null,"lenderCredit":null},"sectionD":{"propertyTaxClosing":null,"prepaidInterest":null,"insuranceMIP":null,"proratedRent":null},"sectionE":{"escrowInsurance":null,"escrowTax":null,"escrowMortgageIns":null,"aggregateAdj":null},"sectionF":{"earnestMoney":null,"loanFunds":null,"sellerCredit":null,"taxAdjSeller":null,"optionFee":null,"proratedHOA":null},"poc":{"pocAppraisal":null,"pocDestination":"Loan Cost (C)"},"flags":[]}`;

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: mediaType || 'application/pdf', data: base64 }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    if (!anthropicResponse.ok) {
      const errData = await anthropicResponse.json().catch(() => ({}));
      return res.status(anthropicResponse.status).json({
        error: errData.error?.message || 'Anthropic API error ' + anthropicResponse.status
      });
    }

    const data = await anthropicResponse.json();
    const rawText = data.content
      .map(block => block.type === 'text' ? block.text : '')
      .join('');

    // Strip any text before { and after }
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      return res.status(500).json({ error: 'AI did not return valid JSON. Please try again or enter values manually.' });
    }
    const text = rawText.slice(firstBrace, lastBrace + 1);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr.message);
      return res.status(500).json({ error: 'Could not parse AI response. Please try again or enter values manually.' });
    }

    // Default pocDestination if not set
    if (parsed.poc && !parsed.poc.pocDestination) {
      parsed.poc.pocDestination = 'Loan Cost (C)';
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error('analyze-pdf error:', err);
    return res.status(500).json({ error: err.message || 'Failed to analyze PDF' });
  }
}
