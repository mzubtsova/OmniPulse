// Gemini API integrations for OmniPulse

const SYSTEM_INSTRUCTION = "You are a senior MarTech growth analyst. Your goal is to write highly concise, actionable, and executive-ready post-mortem summaries for CRM campaign managers based on performance metrics.";

// Live Gemini API request
async function callGeminiApi(prompt, apiKey) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${prompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 600
        }
      })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Gemini API Error');
    }
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

// Generate campaign post-mortems
export const generateCampaignPostMortem = async (campaign, apiKey) => {
  if (!apiKey) {
    // Keyless Mock mode fallback summaries
    return getMockSummary(campaign.id);
  }

  const prompt = `
Write a Campaign Performance Post-Mortem and Optimization report for:
Campaign Name: "${campaign.name}"
Channel: "${campaign.channel}"
Metrics Summary:
- Total Sent: ${campaign.sent}
- Open Rate: ${((campaign.opens / campaign.sent) * 100).toFixed(2)}% (${campaign.opens} opens)
- Click-Through Rate: ${((campaign.clicks / campaign.sent) * 100).toFixed(2)}% (${campaign.clicks} clicks)
- Conversion Rate: ${((campaign.conversions / campaign.sent) * 100).toFixed(2)}% (${campaign.conversions} conversions)
- Unsubscribe Rate: ${((campaign.unsubscribes / campaign.sent) * 100).toFixed(2)}% (${campaign.unsubscribes} unsubscribes)

A/B Test Variant Performance:
- Variant A (Baseline): ${campaign.variants?.a ? `${campaign.variants.a.subject} -> CTR: ${campaign.variants.a.ctr}%` : 'N/A'}
- Variant B (Challenger): ${campaign.variants?.b ? `${campaign.variants.b.subject} -> CTR: ${campaign.variants.b.ctr}%` : 'N/A'}

Liquid Personalization Branch Results:
${campaign.branches?.map(b => `- Branch Name: "${b.name}" -> Clicks: ${b.clicks}, Conversions: ${b.conversions}, CTR: ${b.ctr}%, Conv. Rate: ${b.cvr}%`).join('\n')}

Structure your response into 3 concise bulleted sections:
1. **🏆 Key Findings**: Who won the A/B test and what cohort drove the most conversions.
2. **⚠️ Performance Red Flags**: What failed (e.g. branch drop-offs, list fatigue, or unsubs).
3. **🎯 Recommended Adjustments**: Concrete code or segment changes for next deploy.
`;

  return callGeminiApi(prompt, apiKey);
};

// Explain deliverability anomalies
export const generateAnomalyExplanation = async (clientName, rate, overallRate, apiKey) => {
  if (!apiKey) {
    return `**AI Anomaly Insight**: The open rate for **${clientName}** (${rate}%) is significantly lower than your campaign's average open rate. This deviation indicates a high likelihood of ISP inbox sorting issues. Recommend checking that your email template uses correct HTML syntax, avoids empty links, and is fully responsive to prevent dark mode rendering problems or layout truncation that triggers automatic spam filtering.`;
  }

  const prompt = `
Analyze the following email campaign deliverability anomaly:
- Email Client: "${clientName}"
- Client Specific Open Rate: ${rate}%
- Overall Campaign Average Open Rate: ${overallRate}%

Write a short 2-sentence explanation of what could be causing this difference (e.g. dark mode CSS bug, link filtering, or spam folder placement) and a recommendation on how to debug it. Keep it brief.
`;

  return callGeminiApi(prompt, apiKey);
};

// Seeds for mock fallback mode
function getMockSummary(id) {
  const summaries = {
    'dq-welcome-email': `### 🏆 Key Findings
* **Variant A Won**: The subject line **"Get a FREE Blizzard Ice Cream! 🍦 Alert"** significantly outperformed Variant B with a **12.0% CTR** versus 10.0%, reaching statistical significance (98.6% confidence).
* **VIP Gold Cohort Lead**: The **VIP Gold segment** (Z-Score: 4.8) drove **6,013 conversions** with a massive **25.0% click-through rate**, confirming high offer affinity for loyal segments.

### ⚠️ Performance Red Flags
* **Fallback Segment Collapse**: The **Default Fallback segment** underperformed drastically with only a **2.3% CTR** and a tiny **0.47% conversion rate** (217 conversions), indicating that the default welcome experience fails to motivate new signups.
* **Unsubscribe Spike**: We registered 308 unsubscribes, concentrated primarily in the mobile client segments.

### 🎯 Recommended Adjustments
* **Promote Gold Logic**: Scale the Gold tier template layout to active Silver tier accounts as a points-accelerator promo.
* **Fix Default Experience**: Redesign the generic fallback copy by inserting localized city parameters and adding an secondary app onboarding checklist to reduce unsubscribe rates.`,
    
    'dq-points-boost-push': `### 🏆 Key Findings
* **Variant A Won**: The copy variant **"Get double points on all Blizzards today! 🍦"** drove a **16.0% open rate** compared to 14.0% for the high-friction Variant B, capturing 96.6% statistical significance.
* **Segment Affinity**: High Engagement segment (score > 80) drove a strong **23.0% CTR** and a **4.0% conversion rate**.

### ⚠️ Performance Red Flags
* **Deliverability Degradation**: Android pushes recorded a 20% higher bounce rate than iOS, suggesting token expiration or notification channel blocking on newer Android versions.
* **Low Engagement Dropoff**: The low-engagement segment (score <= 80) responded poorly, converting at just **0.8%**, indicating promotion fatigue.

### 🎯 Recommended Adjustments
* **Cap Frequency**: Implement a push frequency limit (frequency capping) of 1 promo push per 48 hours for the low-engagement cohort.
* **Android Token Audit**: Trigger automatic token validation cleanup actions on Android app launch to fix push delivery drops.`,
    
    'dq-app-download-iam': `### 🏆 Key Findings
* **Variant A Won**: **"Get App & Unlock Free Ice Cream 🍦"** secured a **30.0% CTR**, proving that direct incentive messaging beats feature-driven copy ("Faster Rewards") by an 8% margin.
* **Mobile Web Dominance**: Mobile web referrals drove a massive **34.0% click-through rate** and **18.0% app conversion rate**, showing high landing-page alignment.

### ⚠️ Performance Red Flags
* **Desktop Conversion Drop**: Desktop web referrals recorded a low **7.3% app conversion rate** due to cross-device friction (users having to scan a QR code or search the App Store manually on phone).
* **Dismissal Spike**: The close icon clicked on 5% of sessions, indicating intrusive sizing on tablet screens.

### 🎯 Recommended Adjustments
* **Implement SMS Link-Out**: Add a "text me a link" form input for desktop visitors instead of a generic QR code to ease mobile transitions.
* **Responsive resizing**: Shrink modal layout sizes by 15% on iPad viewports to prevent banner fatigue.`
  };

  return summaries[id] || `### 🏆 Key Findings
* **Primary Variant Lead**: The baseline copy drove a higher click-through rate, outperforming secondary variants.
* **Engagement High**: High-value subscriber cohorts drove the bulk of product purchases.

### ⚠️ Performance Red Flags
* **Low Interest**: Unpersonalized default fallback copies showed negligible conversion rates.
* **Unsubscribe Count**: Registered standard churn rate across segments.

### 🎯 Recommended Adjustments
* **Implement Personalization**: Audit templates to replace static fallback blocks with dynamic Liquid variables.`;
}
