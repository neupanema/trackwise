"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";


const categories = [
  { label: "🧠 Mind",     value: "Mind"     },
  { label: "💪 Fitness",  value: "Fitness"  },
  { label: "❤️ Health",   value: "Health"   },
  { label: "📚 Learning", value: "Learning" },
  { label: "💰 Finance",  value: "Finance"  },
  { label: "✨ Other",    value: "Other"    },
];

const colors = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4",
];

const quickTargets = [7, 21, 30, 90];

interface AISuggestion {
  title:      string;
  category:   string;
  color:      string;
  reason:     string;
  targetDays: number;
}

export default function AddHabitPage() {
  const router = useRouter();

  // form state
  const [title,      setTitle]      = useState("");
  const [category,   setCategory]   = useState("Mind");
  const [color,      setColor]      = useState("#6366f1");
  const [targetDays, setTargetDays] = useState(21);
  const [note,       setNote]       = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  // AI state
  const [goal,        setGoal]        = useState("");
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiError,     setAiError]     = useState("");
  const [showAI,      setShowAI]      = useState(true);

  // ── Get AI suggestions ──
  async function handleGetSuggestions() {
    if (!goal.trim()) {
      setAiError("Please describe your goal first");
      return;
    }
    setAiLoading(true);
    setAiError("");
    setSuggestions([]);

    const res  = await fetch("/api/ai-suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal }),
    });

    const data = await res.json();

    if (!res.ok) {
      setAiError(data.error ?? "Something went wrong");
    } else {
      setSuggestions(data.suggestions ?? []);
    }

    setAiLoading(false);
  }

  // ── Use a suggestion — fills the form ──
  function useSuggestion(s: AISuggestion) {
    setTitle(s.title);
    setCategory(s.category);
    setColor(s.color);
    setTargetDays(s.targetDays ?? 21);
    setShowAI(false); // collapse AI section
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Add suggestion directly without filling form ──
  async function addSuggestionDirectly(s: AISuggestion) {
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:      s.title,
        category:   s.category,
        color:      s.color,
        targetDays: s.targetDays ?? 21,
        note:       s.reason,
      }),
    });
    if (res.ok) router.push("/habits");
  }

  // ── Submit form ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, color, targetDays, note }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }
    router.push("/habits");
  }

  return (
    <div className="p-4 sm:p-8 max-w-xl mx-auto">

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white mb-1">Add New Habit ✨</h1>
        <p className="text-sm" style={{ color: "#4b5563" }}>
          Build a new habit and start your streak today.
        </p>
      </div>

      {/* ── AI SUGGESTIONS SECTION ── */}
      <div className="rounded-2xl p-5 mb-4"
        style={{ background: "#0d0d16", border: "1px solid rgba(99,102,241,0.2)" }}>

        {/* AI header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm"
              style={{ background: "rgba(99,102,241,0.15)" }}>🤖</div>
            <span className="text-sm font-semibold text-white">AI Habit Coach</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>
              Powered by Groq AI 
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAI(!showAI)}
            className="text-xs"
            style={{ color: "#4b5563" }}>
            {showAI ? "Hide ↑" : "Show ↓"}
          </button>
        </div>

        {showAI && (
          <>
            <p className="text-xs mb-3" style={{ color: "#4b5563" }}>
              Describe your goal and AI will suggest the best habits for you.
            </p>

            {/* Goal input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="e.g. I want to get healthier, study better..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGetSuggestions()}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e5e7eb",
                }}
              />
              <button
                type="button"
                onClick={handleGetSuggestions}
                disabled={aiLoading}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                {aiLoading ? "..." : "✨ Ask AI"}
              </button>
            </div>

            {/* AI Error */}
            {aiError && (
              <div className="text-xs px-3 py-2 rounded-xl mb-3"
                style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
                {aiError}
              </div>
            )}

            {/* Loading state */}
            {aiLoading && (
              <div className="text-center py-6">
                <div className="text-2xl mb-2 animate-pulse">🤖</div>
                <div className="text-xs" style={{ color: "#4b5563" }}>
                  AI is thinking of habits for you...
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="text-[10px] font-medium mb-1"
                  style={{ color: "#4b5563" }}>
                  AI SUGGESTIONS — click to add or use in form
                </div>
                {suggestions.map((s, i) => (
                  <div key={i} className="rounded-xl p-3 flex items-start gap-3"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${s.color}33`,
                    }}>

                    {/* Color dot */}
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                      style={{ background: s.color }} />

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white mb-0.5">
                        {s.title}
                      </div>
                      <div className="text-[10px] mb-1" style={{ color: s.color }}>
                        {s.category} · {s.targetDays} days
                      </div>
                      <div className="text-xs" style={{ color: "#4b5563" }}>
                        {s.reason}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => addSuggestionDirectly(s)}
                        className="text-[10px] px-2.5 py-1 rounded-lg font-medium text-white"
                        style={{ background: s.color }}>
                        + Add
                      </button>
                      <button
                        type="button"
                        onClick={() => useSuggestion(s)}
                        className="text-[10px] px-2.5 py-1 rounded-lg font-medium"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          color: "#9ca3af",
                        }}>
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── MANUAL FORM ── */}
      <div className="rounded-2xl p-6 sm:p-7"
        style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <span className="text-xs" style={{ color: "#374151" }}>or add manually</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Live preview */}
        <div className="mb-5">
          <div className="text-[11px] font-medium mb-2" style={{ color: "#4b5563" }}>
            PREVIEW
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{ background: color + "22", color }}>
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            {title || "My Habit"} • {category} • {targetDays} days
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "#f87171",
              border: "1px solid rgba(239,68,68,0.2)",
            }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Title */}
          <div className="mb-5">
            <label className="block text-xs font-medium mb-2"
              style={{ color: "#9ca3af" }}>
              Habit Title
            </label>
            <input
              type="text"
              placeholder="e.g. Morning Meditation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e5e7eb",
              }}
              required
            />
          </div>

          {/* Category */}
          <div className="mb-5">
            <label className="block text-xs font-medium mb-2"
              style={{ color: "#9ca3af" }}>
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const active = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className="py-2.5 px-3 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: active
                        ? "rgba(99,102,241,0.15)"
                        : "rgba(255,255,255,0.03)",
                      border: active
                        ? "1px solid rgba(99,102,241,0.35)"
                        : "1px solid rgba(255,255,255,0.07)",
                      color: active ? "#a5b4fc" : "#6b7280",
                    }}>
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color */}
          <div className="mb-5">
            <label className="block text-xs font-medium mb-2"
              style={{ color: "#9ca3af" }}>
              Color
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{
                    background: c,
                    transform: color === c ? "scale(1.25)" : "scale(1)",
                    border: color === c
                      ? "2px solid #fff"
                      : "2px solid transparent",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Target Days */}
          <div className="mb-5">
            <label className="block text-xs font-medium mb-2"
              style={{ color: "#9ca3af" }}>
              Target Days
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {quickTargets.map((d) => {
                const active = targetDays === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTargetDays(d)}
                    className="py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: active
                        ? "rgba(99,102,241,0.15)"
                        : "rgba(255,255,255,0.03)",
                      border: active
                        ? "1px solid rgba(99,102,241,0.35)"
                        : "1px solid rgba(255,255,255,0.07)",
                      color: active ? "#a5b4fc" : "#6b7280",
                    }}>
                    {d} days
                  </button>
                );
              })}
            </div>
            <input
              type="number"
              min={1}
              max={365}
              value={targetDays}
              onChange={(e) => setTargetDays(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e5e7eb",
              }}
            />
          </div>

          {/* Note */}
          <div className="mb-7">
            <label className="block text-xs font-medium mb-2"
              style={{ color: "#9ca3af" }}>
              Note — optional
            </label>
            <textarea
              placeholder="e.g. Wake up at 6am and meditate"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e5e7eb",
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            {loading ? "Adding..." : "+ Add Habit"}
          </button>

        </form>
      </div>
    </div>
  );
}