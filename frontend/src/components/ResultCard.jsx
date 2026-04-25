import { useState, useRef, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Maps classCode -> short code used by backend
const CLASS_CODE_MAP = {
  "Actinic keratoses / Intraepithelial carcinoma": "akiec",
  "Basal cell carcinoma": "bcc",
  "Benign keratosis-like lesions": "bkl",
  "Dermatofibroma": "df",
  "Melanoma": "mel",
  "Melanocytic nevi": "nv",
  "Vascular lesions": "vasc"
};

function ResultCard({ result }) {
  const confidenceValue = Number(result.confidence ?? 0);
  const normalizedConfidence = confidenceValue > 1 ? confidenceValue / 100 : confidenceValue;
  const confidencePercent = (Math.max(0, Math.min(1, normalizedConfidence)) * 100).toFixed(2);
  const barWidth = Math.max(0, Math.min(100, Number(confidencePercent)));
  const risk = String(result.risk || "low").toLowerCase();
  const diseaseName =
    result.diseaseName || result.disease || result.prediction || "Skin Condition (Screening Result)";

  const classCode =
    result.classCode ||
    CLASS_CODE_MAP[diseaseName] ||
    (result.disease ? CLASS_CODE_MAP[result.disease] : null) ||
    "nv";

  const riskStyles = {
    high: "text-red-600 bg-gradient-to-r from-red-50 to-red-100/50 border-red-200/60",
    moderate: "text-amber-600 bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200/60",
    low: "text-emerald-600 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200/60"
  };
  const progressStyles = {
    high: "bg-gradient-to-r from-red-500 to-red-400",
    moderate: "bg-gradient-to-r from-amber-500 to-amber-400",
    low: "bg-gradient-to-r from-emerald-500 to-emerald-400"
  };
  const iconBgStyles = {
    high: "from-red-500 to-red-600",
    moderate: "from-amber-500 to-amber-600",
    low: "from-emerald-500 to-emerald-600"
  };
  const recommendationByRisk = {
    high: "Seek dermatology consultation as soon as possible for detailed evaluation.",
    moderate: "Schedule a clinical skin check and monitor this area for visible changes.",
    low: "Maintain routine skin care and continue periodic self-monitoring."
  };
  const riskLabelByValue = { high: "High", moderate: "Moderate", low: "Low" };
  const safeRisk = risk.includes("high")
    ? "high"
    : risk.includes("moderate")
    ? "moderate"
    : "low";

  // ── Chat state ──
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);   // [{role, content}]
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const chatBottomRef = useRef(null);

  // Auto-open chat and get first explanation when card mounts
  useEffect(() => {
    setChatOpen(true);
    sendMessage(null);          // null = trigger first AI explanation
  }, []);                       // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatOpen]);

  async function sendMessage(userText) {
    const isFirstMessage = userText === null;
    setChatError("");

    // Build history to send
    const newMessages = isFirstMessage
      ? [{ role: "user", content: "__explain__" }]
      : [...messages, { role: "user", content: userText }];

    if (!isFirstMessage) {
      setMessages(newMessages);
      setInput("");
    }

    setChatLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classCode,
          diseaseName,
          confidence: confidencePercent,
          history: newMessages
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chat request failed.");

      const replyMsg = { role: "assistant", content: data.reply };
      setMessages(isFirstMessage ? [replyMsg] : [...newMessages, replyMsg]);
    } catch (err) {
      setChatError(err.message || "Could not reach DermAI. Please try again.");
    } finally {
      setChatLoading(false);
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text || chatLoading) return;
    sendMessage(text);
  }

  return (
    <div className="animate-scale-in space-y-5 rounded-2xl border border-slate-200/60 bg-white/90 p-6 text-center shadow-xl backdrop-blur-sm">

      {/* ── Diagnosis header ── */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Screening Result
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Predicted Condition</p>
        <p className="text-2xl font-bold text-slate-900">{diseaseName}</p>
      </div>

      {/* ── Confidence bar ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Confidence</span>
          <span className="font-bold text-slate-900">{confidencePercent}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${progressStyles[safeRisk]}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* ── Risk level ── */}
      <div className="relative rounded-xl border border-slate-100 bg-slate-50/50 p-4">
        <div className={`absolute inset-x-0 top-0 h-1 rounded-t-xl ${progressStyles[safeRisk]}`} />
        <p className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">Risk Level</p>
        <div className="relative inline-flex flex-col items-center">
          <div className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${iconBgStyles[safeRisk]} text-white shadow-lg mb-3`}>
            <span className="text-2xl font-extrabold">
              {safeRisk === "high" ? "!" : safeRisk === "moderate" ? "~" : "✓"}
            </span>
          </div>
          <p className={`text-3xl font-extrabold ${safeRisk === "high" ? "text-red-600" : safeRisk === "moderate" ? "text-amber-600" : "text-emerald-600"}`}>
            {riskLabelByValue[safeRisk]}
          </p>
          <div className={`mt-2 inline-flex rounded-full border px-4 py-1 text-sm font-semibold ${riskStyles[safeRisk]}`}>
            {riskLabelByValue[safeRisk]} Risk
          </div>
        </div>
      </div>

      {/* ── Recommendation ── */}
      <div className="rounded-xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-indigo-100/50 px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-left text-sm text-slate-700 leading-relaxed">
            {result.recommendation || recommendationByRisk[safeRisk]}
          </p>
        </div>
      </div>

      {result.riskReason && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3.5 text-left">
          <div className="flex items-start gap-3">
            <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              {result.based_on && (
                <p className="mb-1 text-xs font-semibold text-slate-500">
                  Why this risk:{" "}
                  <span className="font-normal capitalize text-slate-600">
                    {String(result.based_on).replace(/_/g, " ")}
                  </span>
                </p>
              )}
              <p className="text-xs text-slate-600 leading-relaxed">{result.riskReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── DermAI Chat ── */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/40 to-white overflow-hidden">

        {/* Chat header */}
        <button
          onClick={() => setChatOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-50/60 transition"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
              AI
            </div>
            <span className="text-sm font-semibold text-slate-800">Ask DermAI</span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-600 font-medium">
              Powered by Mistral AI
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${chatOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Chat body */}
        {chatOpen && (
          <div className="px-4 pb-4 space-y-3">

            {/* Messages */}
            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {messages.length === 0 && chatLoading && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  DermAI is preparing your explanation...
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold mt-0.5">
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-sm text-left ml-auto"
                        : "bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm text-left"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Loading dots while waiting for reply to follow-up */}
              {chatLoading && messages.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                    AI
                  </div>
                  <div className="flex gap-1 bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-3.5 py-3 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              {chatError && (
                <p className="text-xs text-red-500 text-center">{chatError}</p>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Suggested questions (shown before user types) */}
            {messages.length === 1 && !chatLoading && (
              <div className="flex flex-wrap gap-2">
                {["Is this serious?", "What causes this?", "What should I do next?"].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); sendMessage(q); }}
                    className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask a follow-up question..."
                disabled={chatLoading}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || chatLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>

            <p className="text-center text-xs text-slate-400">
              ⚕️ AI explanations are for educational purposes only
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

export default ResultCard;
