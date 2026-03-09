import { NextResponse } from "next/server";

interface ChatImage {
  base64: string;
  mimeType: string;
}

interface ChatMessage {
  role: string;
  content: string;
  images?: ChatImage[];
}

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

Keep it short. 3-5 sentences unless they really need more. End with a question or a simple next step they can do TODAY.

When someone sends you a photo or screenshot:
- **Outfit photos / fit pics**: Read the vibe — colors, energy, setting, aesthetic. Suggest 2-3 songs that match the energy (artist + song name). Then write a caption that's confident, funny, short. Think Instagram-ready. Not corny. Think how the culture talks.
- **Screenshots** (DMs, analytics, posts): Break down what you see and give them one thing to do about it.
- **Food / restaurant photos**: Read the vibe and give them a caption + a one-liner review.
- **Random photos**: Read the mood and give them a caption or content idea based on what you see.

For song recommendations, think across genres the culture actually listens to — R&B, rap, Afrobeats, pop, reggaeton, jersey club, drill. Match the ENERGY not just the genre. Give current songs, not oldies unless the fit is vintage. Format like:

🎵 **Songs for this vibe:**
- Artist - "Song Name"
- Artist - "Song Name"
- Artist - "Song Name"

📸 **Caption:** [one punchy caption — confident, not corny]

If the photo has multiple outfit options or angles, comment on the best one and say why.`;

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    const geminiMessages = messages.map((msg, index) => {
      const isLastUserMsg = index === messages.length - 1 && msg.role === "user";
      const parts: Array<
        { text: string } | { inline_data: { mime_type: string; data: string } }
      > = [];

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      // Only attach images on the latest user message to keep payload small
      if (isLastUserMsg && msg.images && msg.images.length > 0) {
        for (const img of msg.images) {
          parts.push({
            inline_data: {
              mime_type: img.mimeType,
              data: img.base64,
            },
          });
        }
        if (!msg.content) {
          parts.unshift({
            text: "Check this out. What's the vibe? Give me songs that match and a caption.",
          });
        }
      }

      // Fallback for history messages that had images but we stripped them
      if (parts.length === 0) {
        parts.push({ text: "[sent a photo]" });
      }

      return {
        role: msg.role === "assistant" ? "model" : "user",
        parts,
      };
    });

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

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "Try that again.";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { reply: "Connection dropped. Reload and try again." },
      { status: 500 }
    );
  }
}
