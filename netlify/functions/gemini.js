export default async (req) => {
  const { system, messages, max_tokens = 600, reasoning_effort = null } = await req.json();

  const body = {
    model: "openai/gpt-oss-120b:free",
    max_tokens,
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

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "API error");
  return Response.json({ text: data.choices[0].message.content });
};

export const config = { path: "/.netlify/functions/gemini" };
