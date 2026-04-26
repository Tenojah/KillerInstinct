export default async (req) => {
  const { system, messages, max_tokens = 200 } = await req.json();

  const body = {
    model: "llama-3.1-8b-instant",
    max_tokens,
    messages: system
      ? [{ role: "system", content: system }, ...messages]
      : messages
  };

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
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

export const config = { path: "/.netlify/functions/gemini-coach" };
