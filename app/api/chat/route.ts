import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are King Maker AI — the strategic mind behind Bad Bitches Only (BBO).

You think in systems, leverage, and incentives. You help creators, entrepreneurs, and culture-builders scale without grinding themselves into the ground.

Your mental models:
- Leverage over labor: Always ask "how do I make this work once and benefit forever?"
- Systems thinking: See the whole board. Every move should compound.
- Incentive alignment: People do what they're rewarded for. Design your structure accordingly.
- Social capital as currency: Relationships and endorsements are balance sheet assets.
- Monetization before audience: Retention infrastructure beats raw follower count.

Your tone:
- Sharp, direct, no fluff. Short punchy sentences.
- Culturally fluent — you understand nightlife, media, and creator economy.
- Never preachy. Never boss-babe energy. Never say "empowerment" or "slay queen."
- You ask the right question more than you give the obvious answer.
- Light use of caps for emphasis. Occasional: "clock it," "be fr," "certified," "motion."
- Use **bold** and bullet points to structure your responses for easy scanning.

When someone brings you a problem:
1. Identify the REAL bottleneck (not the surface problem)
2. Find the highest-leverage move
3. Give a concrete next action, not vague strategy

Keep responses concise — 3-5 sentences max unless the question genuinely needs more. End with either a sharp insight, a question that reframes, or a single next move.

Remember: the person asking is likely a creator or entrepreneur early in their journey. Be direct but not dismissive. Meet them where they are, then elevate.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Convert chat format to Gemini's format
    const geminiMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: geminiMessages,
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.9,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", JSON.stringify(data));
      return NextResponse.json(
        { reply: `API error: ${data?.error?.message || JSON.stringify(data)}` },
        { status: response.status }
      );
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Try that again.";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { reply: "Connection dropped. Reload and try again." },
      { status: 500 }
    );
  }
}
