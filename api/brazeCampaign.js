export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.BRAZE_API_KEY;
  const endpoint = (process.env.BRAZE_REST_ENDPOINT || 'https://rest.iad-01.braze.com').replace(/\/$/, '');

  if (!apiKey) {
    return response.status(501).json({
      error: 'BRAZE_API_KEY is not configured on the server.'
    });
  }

  const { campaignId } = request.body || {};
  if (!campaignId || typeof campaignId !== 'string') {
    return response.status(400).json({ error: 'Missing campaignId.' });
  }

  try {
    const upstream = await fetch(`${endpoint}/campaigns/details?campaign_id=${encodeURIComponent(campaignId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      }
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return response.status(upstream.status).json({
        error: data.message || data.error || `Braze API returned ${upstream.status}.`
      });
    }

    return response.status(200).json(data);
  } catch (error) {
    return response.status(500).json({ error: error.message || 'Braze proxy failed.' });
  }
}
