"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface ChatImage {
  base64: string;
  mimeType: string;
  preview: string;
}

interface ChatMessage {
  role: string;
  content: string;
  images?: ChatImage[];
}

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
  {
    label: "Vibe Check",
    icon: "📸",
    description: "Send a fit pic, get songs + captions",
    prompt: "",
  },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function processFile(file: File): Promise<ChatImage> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      reject(new Error(`${file.type} not supported. Use JPG, PNG, GIF, or WebP.`));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error("File too big. Keep it under 10MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve({ base64, mimeType: file.type, preview: dataUrl });
    };
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}

// Styles
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingImages, setPendingImages] = useState<ChatImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved messages (text only — images not persisted)
  useEffect(() => {
    const saved = localStorage.getItem("km-messages");
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  // Save messages (strip images to avoid localStorage overflow)
  useEffect(() => {
    if (messages.length > 0) {
      const lite = messages.map(({ role, content }) => ({ role, content }));
      localStorage.setItem("km-messages", JSON.stringify(lite));
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleFiles(files: FileList | File[]) {
    const fileArray = Array.from(files).slice(0, 5);
    try {
      const processed = await Promise.all(fileArray.map(processFile));
      setPendingImages((prev) => [...prev, ...processed].slice(0, 5));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Couldn't process that file.");
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter((item) => item.type.startsWith("image/"));
    if (imageItems.length > 0) {
      e.preventDefault();
      const files = imageItems.map((item) => item.getAsFile()).filter(Boolean) as File[];
      handleFiles(files);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  async function sendMessage(text?: string) {
    const userText = text || input.trim();
    if ((!userText && pendingImages.length === 0) || loading) return;
    setInput("");

    const newMessage: ChatMessage = {
      role: "user",
      content: userText,
      images: pendingImages.length > 0 ? [...pendingImages] : undefined,
    };
    setPendingImages([]);

    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Strip preview URLs before sending to API
      const apiMessages = newMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        images: msg.images?.map(({ base64, mimeType }) => ({ base64, mimeType })),
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
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
    setPendingImages([]);
    localStorage.removeItem("km-messages");
  }

  const sendDisabled = loading || (!input.trim() && pendingImages.length === 0);

  return (
    <div
      style={styles.container}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Bebas+Neue&display=swap" rel="stylesheet" />

      {/* Drag overlay */}
      {isDragging && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "3px dashed #ff1493",
          pointerEvents: "none",
        }}>
          <div style={{
            color: "#ff1493", fontSize: "24px",
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: "3px",
          }}>
            DROP YOUR PHOTO
          </div>
        </div>
      )}

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
            <div style={{ textAlign: "center", padding: "20px 0 30px" }}>
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
                <button
                  key={i}
                  onClick={() => {
                    if (mode.label === "Vibe Check") {
                      fileInputRef.current?.click();
                    } else {
                      sendMessage(mode.prompt);
                    }
                  }}
                  style={{
                    background: mode.label === "Vibe Check"
                      ? "rgba(255,20,147,0.12)"
                      : "rgba(255,20,147,0.06)",
                    border: mode.label === "Vibe Check"
                      ? "1px solid rgba(255,20,147,0.5)"
                      : "1px solid rgba(255,20,147,0.2)",
                    borderRadius: "12px",
                    padding: "16px 14px",
                    color: "#ccc",
                    fontSize: "13px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    ...(i === MODES.length - 1 && MODES.length % 2 !== 0
                      ? { gridColumn: "1 / -1" }
                      : {}),
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,20,147,0.12)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,20,147,0.5)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background =
                      mode.label === "Vibe Check" ? "rgba(255,20,147,0.12)" : "rgba(255,20,147,0.06)";
                    (e.currentTarget as HTMLElement).style.borderColor =
                      mode.label === "Vibe Check" ? "rgba(255,20,147,0.5)" : "rgba(255,20,147,0.2)";
                  }}
                >
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
              {/* Uploaded images */}
              {msg.images && msg.images.length > 0 && (
                <div style={{
                  display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap",
                }}>
                  {msg.images.map((img, j) => (
                    <img
                      key={j}
                      src={img.preview}
                      alt={`Upload ${j + 1}`}
                      style={{
                        maxWidth: "200px", maxHeight: "200px",
                        borderRadius: "10px", objectFit: "cover",
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Text content */}
              {msg.role === "assistant" ? (
                <div className="md-content"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
              ) : msg.content.length > 100 ? (
                <em style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>
                  Started: {MODES.find(m => m.prompt === msg.content)?.label || "Custom question"}
                </em>
              ) : msg.content ? (
                msg.content
              ) : msg.images && msg.images.length > 0 ? (
                <em style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>Sent a photo</em>
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
        {/* Pending image previews */}
        {pendingImages.length > 0 && (
          <div style={{
            display: "flex", gap: "8px", padding: "10px 14px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "12px 12px 0 0",
            border: "1px solid rgba(255,20,147,0.2)",
            borderBottom: "none",
          }}>
            {pendingImages.map((img, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img
                  src={img.preview}
                  alt={`Upload ${i + 1}`}
                  style={{
                    width: "56px", height: "56px", objectFit: "cover",
                    borderRadius: "8px", border: "1px solid rgba(255,20,147,0.4)",
                  }}
                />
                <button
                  onClick={() => setPendingImages((prev) => prev.filter((_, j) => j !== i))}
                  style={{
                    position: "absolute", top: "-6px", right: "-6px",
                    width: "18px", height: "18px", borderRadius: "50%",
                    background: "#ff1493", border: "none", color: "#fff",
                    fontSize: "10px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    lineHeight: 1,
                  }}
                >x</button>
              </div>
            ))}
          </div>
        )}

        <div style={{
          ...styles.inputBox,
          ...(pendingImages.length > 0 ? { borderRadius: "0 0 14px 14px" } : {}),
        }}>
          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "18px", color: "#ff1493", flexShrink: 0,
              padding: "0", width: "34px", height: "34px",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 0.7, transition: "opacity 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; }}
            title="Upload photo"
          >
            📎
          </button>

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            onPaste={handlePaste}
            placeholder={pendingImages.length > 0 ? "Add a message or just hit send..." : "What's your move?"}
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        capture="environment"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

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
