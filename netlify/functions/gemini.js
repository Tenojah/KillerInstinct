exports.handler = async function(event) {
  if(event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if(!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { system, messages, max_tokens } = body;

  // Build messages array for Groq (OpenAI-compatible format)
  const groqMessages = [];
  if(system) groqMessages.push({ role: 'system', content: system });
  messages.forEach(m => groqMessages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

  const groqBody = {
    model: 'llama-3.1-8b-instant',
    messages: groqMessages,
    max_tokens: max_tokens || 600,
    temperature: 0.9,
    response_format: system && system.includes('JSON') ? { type: 'json_object' } : undefined,
  };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(groqBody)
    });

    const data = await response.json();
    console.log('Groq status:', response.status, 'Response:', JSON.stringify(data).slice(0, 200));

    if(!response.ok) {
      const msg = data?.error?.message || 'Groq API error';
      if(response.status === 429) {
        return { statusCode: 429, body: JSON.stringify({ error: msg }) };
      }
      return { statusCode: response.status, body: JSON.stringify({ error: msg }) };
    }

    const text = data?.choices?.[0]?.message?.content || '';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    };

  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
