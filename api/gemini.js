const MODEL = 'gemini-2.5-flash';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return response.status(501).json({
      error: 'GEMINI_API_KEY is not configured on the server.'
    });
  }

  try {
    const { prompt, systemInstruction, generationConfig } = request.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return response.status(400).json({ error: 'Missing prompt.' });
    }

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction || ''}\n\n${prompt}`.trim() }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000,
            ...(generationConfig || {})
          }
        })
      }
    );

    const data = await upstream.json();
    if (!upstream.ok) {
      return response.status(upstream.status).json({
        error: data.error?.message || 'Gemini API request failed.'
      });
    }

    return response.status(200).json({
      text: data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    });
  } catch (error) {
    return response.status(500).json({ error: error.message || 'Gemini proxy failed.' });
  }
}
