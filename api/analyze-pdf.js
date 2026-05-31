// Vercel serverless function — proxies PDF to Anthropic API
// API key stays server-side, never exposed to browser

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers so the frontend can call this
  res.setHeader('Access-Control-Allow-Origin', '*');
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

    const prompt = `You are a CPA expert in IRS real estate tax rules. Analyze this closing statement (HUD-1 Settlement Statement or Closing Disclosure) and categorize every line item per IRS Publication 551 (Basis of Assets).

CRITICAL WARNING — HUD-1 SECTION LETTERS ARE NOT IRS TAX CATEGORIES:
The HUD-1 form uses its own section labels (A, B, C, D, E, F, G, H, J) that have NOTHING to do with IRS tax classification.
- HUD-1 "Section A" = loan information
- HUD-1 "Section B" = loan amounts  
- HUD-1 "Section C" = "Services Borrower Did Shop For" → these are CLOSING COSTS that add to property basis
- HUD-1 "Section E" = "Services Borrower Did NOT Shop For" → mostly loan costs
- HUD-1 "Section F" = pre-paids → deductible items
- HUD-1 "Section G" = escrow reserves
- HUD-1 "Section H" = other costs

YOU MUST classify by IRS rules, NOT by the HUD-1's own section letters.

IRS TAX CLASSIFICATION RULES:

SECTIONB — Property Cost Basis (capitalized, depreciated over 27.5 years):
Anything titled "Title -" goes here UNLESS it's clearly a loan origination fee.
- titleInsuranceLender: Any "Lender's Title Insurance" or "Title Insurance - Lender"
- titleInsuranceOwner: Any "Owner's Title Insurance" or "Title Insurance - Owner"
- titleSearch: Title search, title exam, title abstract
- otherTitleFees: Title endorsement fees, title courier fee, title policy guaranty fee, title binder, Texas Policy Guaranty Fee, any other "Title -" fees
- settlementFee: Settlement fee, closing fee, escrow fee, closing attorney fee (when in settlement section)
- recordingCharges: Recording fee, recording service fee, government recording charges, deed recording
- taxStamps: Documentary stamps, deed tax stamps
- transferTaxes: Transfer tax, conveyance tax
- surveyFee: Survey, survey fee
- inspections: Home inspection, termite inspection, well inspection (buyer's choice, not lender-required)
- appraisalBasis: Appraisal marked as buyer's choice or not required by lender
- otherBasis: Courier fee, HOA transfer fee, home warranty (buyer purchased), buyer agent commission, notary fee

SECTIONC — Loan Cost Basis (amortized over loan term, NOT property basis):
ONLY items clearly related to the loan origination itself:
- originationFee: Loan origination fee, origination charge (NOT title fees)
- discountPoints: Loan discount, points, discount points
- appraisalLender: Appraisal clearly marked as "required by lender" and NOT marked POC
- creditReport: Credit report fee
- mortgageInsurancePMI: Upfront PMI or MIP financed into loan
- assumptionFee: Assumption fee, application fee, loan application fee
- underwritingFee: Underwriting fee, processing fee, loan processing fee
- attorneyFeeLoan: Attorney fee listed specifically under loan origination section
- lenderOther: Flood certification, tax service fee, wire transfer fee, lender inspection fee
- lenderCredit: Any credit FROM the lender to borrower (enter as positive)

SECTIOND — Currently Deductible (deduct in year of closing on Schedule E):
- propertyTaxClosing: Prorated property taxes that BUYER PAYS at closing (charge to buyer). Look for "County Taxes", "City Taxes", "Property Taxes" listed as a CHARGE. NOT a credit.
- prepaidInterest: Prepaid interest, per diem interest, daily interest charge
- insuranceMIP: Homeowners insurance premium paid at closing, upfront MIP
- proratedRent: Rent collected from seller (income to buyer)

SECTIONE — Escrow Deposits (deductible only when paid out):
- escrowInsurance: Homeowners insurance escrow/impound
- escrowTax: Property tax escrow/impound  
- escrowMortgageIns: Mortgage insurance escrow
- aggregateAdj: Aggregate adjustment (always a credit — enter as positive)

SECTIONF — Credits and Reductions (enter all as positive numbers):
- earnestMoney: Earnest money deposit
- loanFunds: Loan amount, mortgage proceeds
- sellerCredit: Seller concession, seller credit, seller contribution
- taxAdjSeller: ONLY if taxes appear as a CREDIT TO BUYER from seller — meaning seller is giving buyer money for their share of unpaid taxes. Look for "Tax Proration" or "County Tax Proration" listed on the CREDIT side of the HUD-1. If it reduces amount due from buyer, it goes here. DO NOT duplicate — if tax proration is a charge, it goes in sectionD; if it's a credit, it goes here. NEVER BOTH.
- optionFee: Option fee, option period fee
- proratedHOA: HOA proration credit, other seller credits that reduce buyer's basis

POC — Paid Outside Closing:
- pocAppraisal: Appraisal marked "POC" (paid outside closing). 
  pocDestination: Use "Property Basis (B)" if buyer paid independently; "Loan Cost (C)" only if clearly lender-required AND marked POC

ADDITIONAL RULES:
1. "Title -" prefix on any line item = ALWAYS sectionB, never sectionC
2. Tax proration: determine if it's a CHARGE (sectionD) or CREDIT (sectionF.taxAdjSeller) — NEVER both
3. Recording fees = always sectionB
4. Settlement/closing fee = always sectionB  
5. Do NOT let HUD-1 section letters influence your IRS classification
6. All values are positive numbers (no $ or commas)
7. Use null for items not found

CRITICAL: Your response must start with { and end with }. 
Do not write ANY text before or after the JSON.
Do not write "I'll analyze..." or any explanation.
Do not use markdown code blocks.
Your ENTIRE response must be valid JSON starting with {:
{"documentType":"HUD-1","hasloan":true,"purchasePrice":null,"sectionB":{"titleInsuranceLender":null,"titleInsuranceOwner":null,"titleSearch":null,"otherTitleFees":null,"settlementFee":null,"recordingCharges":null,"taxStamps":null,"transferTaxes":null,"attorneyFeesBasis":null,"surveyFee":null,"inspections":null,"appraisalBasis":null,"otherBasis":null},"sectionC":{"originationFee":null,"discountPoints":null,"appraisalLender":null,"creditReport":null,"mortgageInsurancePMI":null,"assumptionFee":null,"underwritingFee":null,"attorneyFeeLoan":null,"lenderOther":null,"lenderCredit":null},"sectionD":{"propertyTaxClosing":null,"prepaidInterest":null,"insuranceMIP":null,"proratedRent":null},"sectionE":{"escrowInsurance":null,"escrowTax":null,"escrowMortgageIns":null,"aggregateAdj":null},"sectionF":{"earnestMoney":null,"loanFunds":null,"sellerCredit":null,"taxAdjSeller":null,"optionFee":null,"proratedHOA":null},"poc":{"pocAppraisal":null,"pocDestination":"Property Basis (B)"},"flags":[]}`

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
              source: {
                type: 'base64',
                media_type: mediaType || 'application/pdf',
                data: base64
              }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    if (!anthropicResponse.ok) {
      const errData = await anthropicResponse.json();
      return res.status(anthropicResponse.status).json({ 
        error: errData.error?.message || 'Anthropic API error' 
      });
    }

    const data = await anthropicResponse.json();
    const rawText = data.content
      .map(block => block.type === 'text' ? block.text : '')
      .join('');

    // Strip anything before the first { and after the last }
    // This handles cases where the AI adds text like "I'll analyze..." before the JSON
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      return res.status(500).json({ error: 'AI did not return valid JSON. Please try again or enter values manually.' });
    }
    const text = rawText.slice(firstBrace, lastBrace + 1);
    
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch(parseErr) {
      console.error('JSON parse error:', parseErr.message);
      console.error('Raw text:', rawText.slice(0, 500));
      return res.status(500).json({ error: 'Could not parse AI response. Please try again or enter values manually.' });
    }
    return res.status(200).json(parsed);

  } catch (err) {
    console.error('analyze-pdf error:', err);
    return res.status(500).json({ 
      error: err.message || 'Failed to analyze PDF' 
    });
  }
}
