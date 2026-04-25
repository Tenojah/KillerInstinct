export default async (req) => {
  const { system, messages, max_tokens = 600, reasoning_effort = null, stream = false } = await req.json();
  
  const body = {
    model: "openai/gpt-oss-120b:free",
    max_tokens,
    stream,
    messages: system
      ? [{ role: "system", content: system }, ...messages]
      : messages
  };
  
  if (reasoning_effort) {
    body.reasoning = { effort: reasoning_effort };
  }

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

  if (stream) {
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  const data = await response.json();
  return Response.json({ text: data.choices[0].message.content });
};

export const config = { path: "/.netlify/functions/gemini" };
