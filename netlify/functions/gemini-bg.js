export default async (req) => {
  const { system, messages, max_tokens = 600 } = await req.json();
  
  const body = {
    model: "anthropic/claude-haiku-3-5",
    max_tokens,
    messages: system
      ? [{ role: "system", content: system }, ...messages]
      : messages
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json();
    return Response.json({ error: err.error?.message || "API error" }, { status: 500 });
  }

  const data = await response.json();
  return Response.json({ text: data.choices[0].message.content });
};

export const config = { 
  path: "/.netlify/functions/gemini-bg",
  timeout: 900
};
