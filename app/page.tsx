"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

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

const MODES = [
  {
    label: "I'm Lost",
    icon: "😩",
    description: "I don't know where to start",
    prompt: "I want to do something with my page or my brand but I honestly don't know where to start. Can you ask me a couple questions and help me figure out my next step?",
  },
  {
    label: "More Followers",
    icon: "📱",
    description: "How do I grow my page?",
    prompt: "I want more followers but I don't know what I'm doing wrong. Can you ask me what I post and help me figure out what to do differently?",
  },
  {
    label: "Get Paid",
    icon: "💰",
    description: "How do I make money from this?",
    prompt: "I have a page and I post content but I'm not making any money from it. Can you help me figure out how to start getting paid? Ask me what I do first.",
  },
  {
    label: "Check My Page",
    icon: "👀",
    description: "Is my stuff good?",
    prompt: "Can you give me honest feedback on my page and content? Ask me about what I post and how my page looks, then tell me what I should change.",
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
        <h1 style={styles.title}>BBO CREATOR APP</h1>
        <p style={styles.subtitle}>Ask me anything about growing your page or getting paid.</p>
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
                Like having a smart friend who knows about content and money.
                Tap a button or type your question.
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
