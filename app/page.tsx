"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

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

const MODES = [
  {
    label: "Audit My Hustle",
    icon: "🔍",
    description: "Find what's actually holding you back",
    prompt: "I want you to audit my hustle. Ask me 3 sharp questions to figure out where I'm stuck, then tell me my #1 bottleneck and the highest-leverage move I should make.",
  },
  {
    label: "Scale My Content",
    icon: "📱",
    description: "Turn posts into a real system",
    prompt: "I'm creating content but it's not turning into real growth or money. Help me build a content system that compounds. Ask me what I'm posting and where, then give me a strategy.",
  },
  {
    label: "Event Money",
    icon: "🎤",
    description: "Make live events actually profitable",
    prompt: "I want to throw events that actually make money — not just look cool. Walk me through how to structure, price, and monetize a live event in my niche.",
  },
  {
    label: "Monetize This",
    icon: "💰",
    description: "Turn your thing into income",
    prompt: "I have skills and a following but I'm not making real money from it yet. Help me figure out the fastest path to monetization. Ask me what I've got to work with.",
  },
];

// Styles extracted to reduce JSX clutter
const styles = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0a",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    padding: "0 0 40px",
  },
  header: {
    width: "100%",
    background: "linear-gradient(180deg, #0a0a0a 0%, transparent 100%)",
    padding: "32px 24px 16px",
    textAlign: "center" as const,
    position: "sticky" as const,
    top: 0,
    zIndex: 10,
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,20,147,0.15)",
  },
  brandTag: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "11px",
    letterSpacing: "4px",
    color: "#ff1493",
    marginBottom: "6px",
    opacity: 0.8,
  },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "clamp(28px, 6vw, 42px)",
    color: "#fff",
    margin: 0,
    letterSpacing: "2px",
  },
  subtitle: { color: "#666", fontSize: "13px", margin: "6px 0 0", letterSpacing: "0.5px" },
  chatArea: {
    width: "100%",
    maxWidth: "680px",
    flex: 1,
    padding: "24px 16px",
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: "16px",
  },
  avatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #ff1493, #ff69b4)",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    fontSize: "12px",
    marginRight: "10px",
    flexShrink: 0,
    marginTop: "2px",
  },
  inputArea: {
    width: "100%",
    maxWidth: "680px",
    padding: "0 16px",
    position: "sticky" as const,
    bottom: 0,
  },
  inputBox: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,20,147,0.3)",
    borderRadius: "14px",
    display: "flex" as const,
    alignItems: "flex-end" as const,
    gap: "10px",
    padding: "12px 14px",
    backdropFilter: "blur(20px)",
  },
  textarea: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: "14px",
    resize: "none" as const,
    lineHeight: 1.5,
    maxHeight: "120px",
    overflow: "auto" as const,
    fontFamily: "'DM Sans', sans-serif",
  },
};

export default function KingMakerAI() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Persist last conversation in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("km-messages");
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("km-messages", JSON.stringify(messages));
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Connection dropped. Reload and try again." }]);
    }
    setLoading(false);
  }

  function clearChat() {
    setMessages([]);
    localStorage.removeItem("km-messages");
  }

  const sendDisabled = loading || !input.trim();

  return (
    <div style={styles.container}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Bebas+Neue&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.brandTag}>BAD B*TCHES ONLY</div>
        <h1 style={styles.title}>KING MAKER AI</h1>
        <p style={styles.subtitle}>Your strategic coach. No fluff. Just moves.</p>
        {messages.length > 0 && (
          <button onClick={clearChat} style={{
            background: "none", border: "1px solid rgba(255,20,147,0.3)",
            borderRadius: "6px", color: "#666", fontSize: "11px",
            padding: "4px 12px", cursor: "pointer", marginTop: "8px",
          }}>New Session</button>
        )}
      </div>

      {/* Chat */}
      <div style={styles.chatArea}>
        {messages.length === 0 && (
          <div style={{ animation: "fadeIn 0.6s ease" }}>
            {/* Welcome */}
            <div style={{
              textAlign: "center", padding: "20px 0 30px",
            }}>
              <p style={{ color: "#888", fontSize: "15px", lineHeight: 1.7, maxWidth: "480px", margin: "0 auto" }}>
                I help creators and entrepreneurs find their highest-leverage move.
                Pick a mode or ask me anything.
              </p>
            </div>

            {/* Mode buttons */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "16px",
            }}>
              {MODES.map((mode, i) => (
                <button key={i} onClick={() => sendMessage(mode.prompt)} style={{
                  background: "rgba(255,20,147,0.06)",
                  border: "1px solid rgba(255,20,147,0.2)",
                  borderRadius: "12px",
                  padding: "16px 14px",
                  color: "#ccc",
                  fontSize: "13px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,20,147,0.12)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,20,147,0.5)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,20,147,0.06)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,20,147,0.2)";
                  }}>
                  <div style={{ fontSize: "22px", marginBottom: "6px" }}>{mode.icon}</div>
                  <div style={{ fontWeight: 700, color: "#fff", marginBottom: "4px" }}>{mode.label}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>{mode.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            animation: "slideUp 0.3s ease",
          }}>
            {msg.role === "assistant" && <div style={styles.avatar}>👑</div>}
            <div style={{
              maxWidth: "82%",
              padding: "12px 16px",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #ff1493, #c2185b)"
                : "rgba(255,255,255,0.06)",
              border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: "14px",
              lineHeight: 1.65,
            }}>
              {msg.role === "assistant" ? (
                <div className="md-content"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
              ) : msg.content.length > 100 ? (
                <em style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>Started: {MODES.find(m => m.prompt === msg.content)?.label || "Custom question"}</em>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", animation: "slideUp 0.3s ease" }}>
            <div style={styles.avatar}>👑</div>
            <div style={{
              padding: "12px 18px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px 16px 16px 4px",
              display: "flex", gap: "5px", alignItems: "center",
            }}>
              {[0, 1, 2].map(j => (
                <div key={j} style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: "#ff1493",
                  animation: `pulse 1.2s ease-in-out ${j * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <div style={styles.inputBox}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="What's your move?"
            rows={1}
            style={styles.textarea}
          />
          <button onClick={() => sendMessage()} disabled={sendDisabled} style={{
            background: sendDisabled ? "rgba(255,20,147,0.2)" : "linear-gradient(135deg, #ff1493, #c2185b)",
            border: "none",
            borderRadius: "8px",
            width: "34px",
            height: "34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: sendDisabled ? "not-allowed" : "pointer",
            flexShrink: 0,
            transition: "all 0.2s",
            fontSize: "15px",
            color: "#fff",
          }}>↑</button>
        </div>
        <p style={{ color: "#333", fontSize: "11px", textAlign: "center", marginTop: "8px" }}>
          @DABBOSHOW · BBO Universe
        </p>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.1); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,20,147,0.3); border-radius: 2px; }
        textarea::placeholder { color: #444; }
        .md-content p { margin: 0 0 8px; }
        .md-content p:last-child { margin: 0; }
        .md-content ul, .md-content ol { margin: 4px 0; padding-left: 20px; }
        .md-content li { margin: 2px 0; }
        .md-content strong { color: #ff69b4; }
      `}</style>
    </div>
  );
}
