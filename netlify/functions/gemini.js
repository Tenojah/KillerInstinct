exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key present:', !!apiKey, 'Length:', apiKey ? apiKey.length : 0);
  if(!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { system, messages, max_tokens } = body;

  // Convert messages to Gemini format
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const geminiBody = {
    system_instruction: system ? { parts: [{ text: system }] } : undefined,
    contents,
    generationConfig: {
      maxOutputTokens: max_tokens || 600,
      temperature: 0.9,
    }
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody)
      }
    );

    const data = await response.json();
    console.log('Gemini status:', response.status, 'Response:', JSON.stringify(data).slice(0, 200));

    if(!response.ok) {
      const msg = data?.error?.message || 'Gemini API error';
      const status = response.status;
      if(status === 429 || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource exhausted')) {
        return { statusCode: 429, body: JSON.stringify({ error: msg }) };
      }
      return { statusCode: status, body: JSON.stringify({ error: msg }) };
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    };

  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
