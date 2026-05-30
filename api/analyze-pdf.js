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

    const prompt = `You are a CPA expert in IRS real estate tax rules analyzing a closing statement (HUD-1 or Closing Disclosure). Categorize every line item per IRS Publication 551 (Basis of Assets) and Treasury Regulation 1.263(a). Return ONLY valid JSON — no markdown, no backticks, just the JSON object.

CRITICAL IRS CLASSIFICATION RULES — follow these exactly:

SECTION B (Property Cost Basis — capitalized, NOT immediately deductible):
- attorneyFeesBasis: Attorney fees for TITLE work only (deed preparation, title exam, closing attorney NOT related to loan). If attorney fee appears in the settlement/title section of HUD-1, put here.
- titleInsuranceLender: Lender's title insurance policy
- titleInsuranceOwner: Owner's title insurance policy  
- titleSearch: Title search, abstract, title exam fees
- settlementFee: Settlement/closing fee paid to settlement agent
- recordingCharges: Government recording charges for deed
- taxStamps: State/city deed tax stamps
- transferTaxes: Transfer taxes, documentary stamps
- surveyFee: Survey fee
- inspections: Home inspections NOT required by lender (buyer's choice)
- appraisalBasis: Appraisal NOT required by lender (buyer's independent appraisal only)
- otherBasis: Buyer's agent commission, home warranty, other title-related costs

SECTION C (Loan Costs — amortize over loan term, NOT basis):
- originationFee: Loan origination fee, loan fee
- discountPoints: Discount points, loan points
- appraisalLender: Appraisal REQUIRED by lender and listed on HUD-1 (not paid outside closing)
- creditReport: Credit report fee
- mortgageInsurancePMI: PMI financed into loan only
- assumptionFee: Assumption fee, application fee
- underwritingFee: Underwriting fee, processing fee
- attorneyFeeLoan: Attorney fees listed under LOAN COSTS section of HUD-1 only
- lenderOther: Other lender fees (flood cert, tax service, wire fee)
- lenderCredit: Lender credit to buyer (enter as positive number)

SECTION D (Currently Deductible in year of closing):
- propertyTaxClosing: Prorated property taxes paid AT closing (seller's share of current year taxes)
- prepaidInterest: Prepaid mortgage interest (per diem interest from closing to month end)
- insuranceMIP: Homeowners insurance premium + upfront MIP/PMI paid at closing
- proratedRent: Prorated rent collected FROM seller (taxable income to buyer — positive)

SECTION E (Escrow/Reserves — deductible when paid out by lender):
- escrowInsurance: Insurance escrow/impound deposit
- escrowTax: Property tax escrow/impound deposit
- escrowMortgageIns: Mortgage insurance escrow deposit
- aggregateAdj: Aggregate adjustment credit (enter as positive)

SECTION F (Reductions to amount due — credits and payments):
- earnestMoney: Earnest money deposit
- loanFunds: Loan amount/mortgage proceeds
- sellerCredit: Seller concession/credit to buyer
- taxAdjSeller: Tax adjustment / prorated taxes UNPAID by seller that buyer will pay later (this is a CREDIT to buyer, reduces basis — enter as positive)
- optionFee: Option fee credit
- proratedHOA: Prorated HOA dues or other seller credits that reduce buyer's basis

POC (Paid Outside Closing — items paid before/outside the closing):
- pocAppraisal: Appraisal paid outside closing (POC). Use "Loan Cost (C)" if required by lender, "Property Basis (B)" if buyer's choice. Include pocDestination field.

Return this exact structure:
{"documentType":"HUD-1","hasloan":true,"purchasePrice":null,"sectionB":{"titleInsuranceLender":null,"titleInsuranceOwner":null,"titleSearch":null,"otherTitleFees":null,"settlementFee":null,"recordingCharges":null,"taxStamps":null,"transferTaxes":null,"attorneyFeesBasis":null,"surveyFee":null,"inspections":null,"appraisalBasis":null,"otherBasis":null},"sectionC":{"originationFee":null,"discountPoints":null,"appraisalLender":null,"creditReport":null,"mortgageInsurancePMI":null,"assumptionFee":null,"underwritingFee":null,"attorneyFeeLoan":null,"lenderOther":null,"lenderCredit":null},"sectionD":{"propertyTaxClosing":null,"prepaidInterest":null,"insuranceMIP":null,"proratedRent":null},"sectionE":{"escrowInsurance":null,"escrowTax":null,"escrowMortgageIns":null,"aggregateAdj":null},"sectionF":{"earnestMoney":null,"loanFunds":null,"sellerCredit":null,"taxAdjSeller":null,"optionFee":null,"proratedHOA":null},"poc":{"pocAppraisal":null,"pocDestination":"Loan Cost (C)"},"flags":[]}

Additional rules:
- All values are positive numbers only (no $ signs, no negatives, no commas)
- null means the item was not found on this document
- taxAdjSeller: ONLY the seller's unpaid tax proration that appears as a credit TO the buyer. Do NOT include property taxes the buyer will pay going forward.
- Do NOT put the same amount in both sectionB and sectionC
- Attorney fees: classify based on which SECTION of the HUD-1 they appear in — title/settlement section → attorneyFeesBasis; loan section → attorneyFeeLoan`;

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
    const text = data.content
      .map(block => block.type === 'text' ? block.text : '')
      .join('')
      .replace(/```json\n?/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);

  } catch (err) {
    console.error('analyze-pdf error:', err);
    return res.status(500).json({ 
      error: err.message || 'Failed to analyze PDF' 
    });
  }
}
