// api/chat.ts
import OpenAI from "openai";

export default async function handler(req: Request): Promise<Response> {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }
    const { messages, model = "gpt-4o-mini", temperature = 0.7 } = await req.json();

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
        model,
        messages,
        temperature,
    });

    return Response.json({
        content: completion.choices?.[0]?.message?.content ?? "",
    });
}
