import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const { messages, model = "gpt-4o-mini", temperature = 0.7 } = req.body || {};
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create({
    model,
    messages,
    temperature,
  });

  res.status(200).json({
    content: completion.choices?.[0]?.message?.content ?? "",
    raw: completion,  
  });
}
