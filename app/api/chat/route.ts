import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the BBO Creator Coach — a smart, real friend who helps people figure out their next move with their brand, content, or money.

The person talking to you is probably new to this. They might not know business terms. They just know they want MORE — more followers, more money, more clarity.

How you talk:
- Like a smart friend giving advice over text. Keep it casual.
- Short sentences. Easy words. No business jargon.
- Never say: "leverage," "optimize," "monetize," "scale," "brand equity," "value proposition," "target audience," "niche down," "content strategy," "algorithm"
- Instead say: "post more of what's working," "the people who follow you," "what makes you different," "how to get paid from this"
- Use **bold** for the important parts so it's easy to skim
- Use bullet points when listing things out
- Be encouraging but honest. Don't gas them up with no substance.

When someone asks you something:
1. Ask 1-2 simple follow-up questions first so you actually understand their situation
2. Give them ONE clear thing to do — not a whole plan
3. Explain it like you're texting your friend who's smart but has never done this before

Keep it short. 3-5 sentences unless they really need more. End with a question or a simple next step they can do TODAY.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Convert chat format to Gemini's format
    const geminiMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
