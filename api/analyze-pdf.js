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

    const prompt = `You are a CPA analyzing a real estate closing statement (HUD-1 or Closing Disclosure). Extract every dollar amount and categorize per IRS rules. Return ONLY valid JSON — no markdown, no explanation, just the JSON object:

{"documentType":"HUD-1","hasloan":true,"purchasePrice":null,"sectionB":{"titleInsuranceLender":null,"titleInsuranceOwner":null,"titleSearch":null,"otherTitleFees":null,"settlementFee":null,"recordingCharges":null,"taxStamps":null,"transferTaxes":null,"attorneyFeesBasis":null,"surveyFee":null,"inspections":null,"appraisalBasis":null,"otherBasis":null},"sectionC":{"originationFee":null,"discountPoints":null,"appraisalLender":null,"creditReport":null,"mortgageInsurancePMI":null,"assumptionFee":null,"underwritingFee":null,"attorneyFeeLoan":null,"lenderOther":null,"lenderCredit":null},"sectionD":{"propertyTaxClosing":null,"prepaidInterest":null,"insuranceMIP":null,"proratedRent":null},"sectionE":{"escrowInsurance":null,"escrowTax":null,"escrowMortgageIns":null,"aggregateAdj":null},"sectionF":{"earnestMoney":null,"loanFunds":null,"sellerCredit":null,"taxAdjSeller":null,"optionFee":null,"proratedHOA":null},"poc":{"pocAppraisal":null},"flags":["note any unusual items, max 3"]}

Rules:
- All values must be positive numbers (no $ signs, no negatives)
- Use null for any field not found in the document  
- hasloan: true if document shows a mortgage/loan, false for cash purchase
- flags: short notes about unusual items only, empty array if none`;

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
