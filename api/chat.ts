// api/chat.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  try {
    // 프론트가 간단히 보낸 입력만 받아도 동작하게 설계
    // body: { input?: string, context?: string, messages?: OpenAI.ChatCompletionMessageParam[], model?, temperature? }
    const { input, context, messages, model = 'gpt-4o-mini', temperature = 0.7 } = req.body ?? {};

    // 사용자가 JSON을 모를 전제: input만 왔다면 서버가 messages를 구성
    const sys = context ? [{ role: 'system', content: context }] : [];
    const msgs = Array.isArray(messages) && messages.length
      ? messages
      : [...sys, { role: 'user', content: String(input ?? '') }];

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const completion = await client.chat.completions.create({
      model,
      temperature,
      messages: msgs as any,
    });

    res.status(200).json({
      content: completion.choices?.[0]?.message?.content ?? '',
    });
  } catch (err: any) {
    // ★ 항상 JSON으로 에러 응답
    res.status(500).json({ error: err?.message ?? String(err) });
  }
}
