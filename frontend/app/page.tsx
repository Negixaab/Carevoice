"use client";

import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

interface Message {
  role: "user" | "assistant";
  content: string;
  is_crisis?: boolean;
  mood_score?: number;
  mood_label?: string;
}

interface Location {
  lat: number;
  lng: number;
  city: string;
  country: string;
}

const EMERGENCY_NUMBERS = {
  india: [
    { name: "iCall", number: "9152987821", desc: "Mon–Sat, 8am–10pm" },
    { name: "Vandrevala Foundation", number: "1860-2662-345", desc: "24/7" },
    { name: "AASRA", number: "9820466627", desc: "24/7" },
  ],
  global: [
    { name: "Crisis Text Line", number: "Text HOME to 741741", desc: "US, 24/7" },
    { name: "Samaritans", number: "116 123", desc: "UK, 24/7" },
    { name: "IASP Directory", number: "iasp.info/resources", desc: "Worldwide" },
  ],
};

export default function Home() {
  const [messages, setMessages]           = useState<Message[]>([]);
  const [input, setInput]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [moodHistory, setMoodHistory]     = useState<{score: number, label: string}[]>([]);
  const [showEmergency, setShowEmergency] = useState(false);
  const [activeTab, setActiveTab]         = useState<"india" | "global">("india");
  const [location, setLocation]           = useState<Location | null>(null);
  const [locLoading, setLocLoading]       = useState(false);
  const [showLocPanel, setShowLocPanel]   = useState(false);
  const [darkMode, setDarkMode]           = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [sessionId] = useState(() => {
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem("carevoice_session_id");
      if (existing) return existing;
      const newId = uuidv4();
      localStorage.setItem("carevoice_session_id", newId);
      return newId;
    }
    return uuidv4();
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMessages([{
      role: "assistant",
      content: "Hi, I'm CareVoice.\n\nThis is your quiet space — no judgment, no rush. Just someone to listen.\n\nHow are you feeling today?"
    }]);
  }, []);

  const detectLocation = async () => {
    setLocLoading(true);
    setShowLocPanel(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          setLocation({
            lat: latitude,
            lng: longitude,
            city: data.address?.city || data.address?.town || data.address?.village || "your area",
            country: data.address?.country || "your country"
          });
        } catch {
          setLocation({ lat: latitude, lng: longitude, city: "your area", country: "your country" });
        }
        setLocLoading(false);
      },
      () => {
        setLocLoading(false);
        setLocation(null);
      }
    );
  };

  const openMapsSearch = () => {
    if (!location) return;
    const query = encodeURIComponent("psychologist mental health near me");
    window.open(
      `https://www.google.com/maps/search/${query}/@${location.lat},${location.lng},13z`,
      "_blank"
    );
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("https://carevoice-backend-d8a4.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: userMessage })
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response,
        is_crisis: data.is_crisis,
        mood_score: data.mood_score,
        mood_label: data.mood_label
      }]);
      setMoodHistory(prev => [...prev, {
        score: data.mood_score,
        label: data.mood_label
      }]);
      if (data.is_crisis) setShowEmergency(true);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having a little trouble connecting. Please try again in a moment."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMoodColor = (score: number) => {
    if (score <= 3) return "#e57373";
    if (score <= 6) return "#ffb74d";
    return "#81c784";
  };

  const t = {
    bg:          darkMode ? "linear-gradient(160deg, #0f0c14 0%, #130f1e 50%, #0f0c14 100%)"
                          : "linear-gradient(160deg, #f7f3ee 0%, #ede8f5 50%, #f5eef2 100%)",
    card:        darkMode ? "rgba(20,16,30,0.97)"       : "rgba(253,250,247,0.88)",
    border:      darkMode ? "rgba(255,255,255,0.06)"    : "rgba(200,180,220,0.2)",
    textPrimary: darkMode ? "#e8e0f0"                   : "#4a3f5c",
    textSub:     darkMode ? "#9d8fb0"                   : "#5d4e6d",
    textMuted:   darkMode ? "#6b5f7a"                   : "#b39ddb",
    textFaint:   darkMode ? "#4a4258"                   : "#c5b8d4",
    inputBg:     darkMode ? "rgba(255,255,255,0.04)"    : "rgba(245,235,255,0.4)",
    inputBorder: darkMode ? "rgba(255,255,255,0.07)"    : "rgba(200,180,220,0.3)",
    msgBg:       darkMode ? "rgba(255,255,255,0.03)"    : "rgba(255,255,255,0.7)",
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: t.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      fontFamily: "inherit",
      position: "relative",
      transition: "background 0.3s"
    }}>

      {/* Emergency button */}
      <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 100 }}>
        <button
          onClick={() => setShowEmergency(!showEmergency)}
          style={{
            background: showEmergency ? "#c62828" : darkMode ? "#1a1025" : "#fff",
            color: showEmergency ? "#fff" : "#c62828",
            border: "1.5px solid #c62828",
            borderRadius: "20px",
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 2px 12px rgba(198,40,40,0.2)",
            transition: "all 0.2s"
          }}
        >
          ⚡ Emergency
        </button>

        {showEmergency && (
          <div style={{
            position: "absolute",
            top: "44px",
            right: "0",
            width: "310px",
            background: darkMode ? "#1a1525" : "#fff",
            borderRadius: "16px",
            border: `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "rgba(198,40,40,0.15)"}`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            overflow: "hidden"
          }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "#fce4e4"}` }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#c62828" }}>Crisis Helplines</p>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: t.textMuted }}>Free, confidential support</p>
            </div>

            <div style={{ display: "flex", borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "#fce4e4"}` }}>
              {(["india", "global"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: "8px", fontSize: "12px", border: "none",
                  background: activeTab === tab
                    ? (darkMode ? "rgba(198,40,40,0.15)" : "#fff5f5")
                    : "transparent",
                  color: activeTab === tab ? "#c62828" : t.textMuted,
                  fontWeight: activeTab === tab ? "600" : "400",
                  cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize"
                }}>
                  {tab === "india" ? "🇮🇳 India" : "🌍 Global"}
                </button>
              ))}
            </div>

            <div style={{ padding: "8px 0" }}>
              {EMERGENCY_NUMBERS[activeTab].map((item, i) => (
                <div key={i} style={{
                  padding: "10px 16px",
                  borderBottom: i < EMERGENCY_NUMBERS[activeTab].length - 1
                    ? `1px solid ${darkMode ? "rgba(255,255,255,0.04)" : "#fafafa"}` : "none"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: t.textPrimary }}>{item.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: t.textMuted }}>{item.desc}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "#c62828", fontWeight: "600" }}>{item.number}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: "10px 16px 14px", borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "#fce4e4"}` }}>
              {!showLocPanel ? (
                <button onClick={detectLocation} style={{
                  width: "100%", padding: "10px",
                  background: darkMode ? "rgba(123,31,162,0.2)" : "#f3e8ff",
                  border: "none", borderRadius: "10px",
                  fontSize: "12px", color: "#9c27b0",
                  fontWeight: "600", cursor: "pointer", fontFamily: "inherit"
                }}>
                  📍 Find psychologist near me
                </button>
              ) : locLoading ? (
                <p style={{ margin: 0, fontSize: "12px", color: t.textMuted, textAlign: "center" }}>
                  Detecting your location...
                </p>
              ) : location ? (
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: "12px", color: t.textPrimary }}>
                    📍 {location.city}, {location.country}
                  </p>
                  <button onClick={openMapsSearch} style={{
                    width: "100%", padding: "10px",
                    background: "#7b1fa2", border: "none",
                    borderRadius: "10px", fontSize: "12px",
                    color: "#fff", fontWeight: "600",
                    cursor: "pointer", fontFamily: "inherit"
                  }}>
                    Open in Google Maps →
                  </button>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "12px", color: "#e57373", textAlign: "center" }}>
                  Location access denied. Search manually on Google Maps.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main card */}
      <div style={{
        width: "100%",
        maxWidth: "640px",
        height: "92vh",
        background: t.card,
        backdropFilter: "blur(24px)",
        borderRadius: "28px",
        border: `1px solid ${t.border}`,
        boxShadow: darkMode
          ? "0 8px 40px rgba(0,0,0,0.4)"
          : "0 8px 40px rgba(180,140,200,0.12)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "background 0.3s"
      }}>

        {/* Header */}
        <div style={{
          padding: "20px 28px",
          borderBottom: `1px solid ${t.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: t.textSub, letterSpacing: "-0.3px" }}>
              CareVoice
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: t.textMuted }}>
              a quiet space to breathe
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                background: "none",
                border: `1px solid ${t.border}`,
                borderRadius: "20px",
                padding: "5px 12px",
                fontSize: "12px",
                color: t.textMuted,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s"
              }}
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "#81c784", display: "inline-block"
              }}/>
              <span style={{ fontSize: "11px", color: t.textFaint }}>here for you</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 36px",
          display: "flex",
          flexDirection: "column",
          gap: "32px"
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start"
            }}>
              <p style={{
                margin: "0 0 8px",
                fontSize: "10px",
                fontWeight: "600",
                color: t.textFaint,
                letterSpacing: "1px",
                textTransform: "uppercase"
              }}>
                {msg.role === "user" ? "You" : "CareVoice"}
              </p>
              {msg.is_crisis && (
                <div style={{
                  background: darkMode ? "rgba(198,40,40,0.15)" : "#fff5f5",
                  border: "1px solid #ffcdd2",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  marginBottom: "8px",
                  fontSize: "12px",
                  color: "#c62828"
                }}>
                  ⚠️ Crisis resources have been shown — please reach out
                </div>
              )}
              <p style={{
                margin: 0,
                fontSize: "15.5px",
                color: t.textPrimary,
                lineHeight: "1.8",
                maxWidth: "85%",
                whiteSpace: "pre-wrap",
                textAlign: msg.role === "user" ? "right" : "left"
              }}>
                {msg.content}
              </p>
              {msg.mood_label && msg.role === "assistant" && (
                <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: getMoodColor(msg.mood_score || 5),
                    display: "inline-block"
                  }}/>
                  <span style={{ fontSize: "11px", color: t.textFaint }}>
                    {msg.mood_label} · {msg.mood_score}/10
                  </span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <p style={{
                margin: "0 0 8px", fontSize: "10px", fontWeight: "600",
                color: t.textFaint, letterSpacing: "1px", textTransform: "uppercase"
              }}>CareVoice</p>
              <div style={{ display: "flex", gap: "5px" }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: "#ce93d8", display: "inline-block",
                    animation: `bounce 1.2s ${i * 0.2}s infinite ease-in-out`
                  }}/>
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Mood bar */}
        {moodHistory.length > 0 && (
          <div style={{
            padding: "10px 36px",
            borderTop: `1px solid ${t.border}`
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "10px", color: t.textFaint, whiteSpace: "nowrap" }}>mood</span>
              <div style={{
                flex: 1, height: "3px",
                background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(200,180,220,0.2)",
                borderRadius: "2px", overflow: "hidden",
                display: "flex", gap: "2px"
              }}>
                {moodHistory.map((m, i) => (
                  <div key={i} style={{
                    flex: 1, background: getMoodColor(m.score), opacity: 0.8
                  }}/>
                ))}
              </div>
              <span style={{ fontSize: "10px", color: t.textMuted, whiteSpace: "nowrap" }}>
                {moodHistory[moodHistory.length - 1].label} · {moodHistory[moodHistory.length - 1].score}/10
              </span>
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: "16px 36px 22px",
          borderTop: `1px solid ${t.border}`
        }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "12px" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="speak freely..."
              rows={1}
              style={{
                flex: 1,
                background: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                borderRadius: "14px",
                padding: "12px 16px",
                fontSize: "14.5px",
                color: t.textPrimary,
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                lineHeight: "1.6",
                transition: "all 0.2s"
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: "42px", height: "42px",
                borderRadius: "50%",
                background: loading || !input.trim()
                  ? darkMode ? "rgba(255,255,255,0.06)" : "rgba(200,180,220,0.2)"
                  : "linear-gradient(135deg, #ce93d8, #ba68c8)",
                border: "none",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                boxShadow: loading || !input.trim() ? "none" : "0 4px 14px rgba(186,104,200,0.35)",
                transition: "all 0.2s"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
          <p style={{
            textAlign: "center", fontSize: "11px",
            color: t.textFaint, marginTop: "10px",
            fontFamily: "inherit"
          }}>
            Not a substitute for professional help · Your words are private
          </p>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(200,180,220,0.2); border-radius: 3px; }
        textarea::placeholder { color: ${t.textFaint}; }
      `}</style>
    </main>
  );
}