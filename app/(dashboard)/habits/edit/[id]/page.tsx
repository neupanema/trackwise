"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

// same as add page
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

export default function EditHabitPage() {
  const router   = useRouter();
  const params   = useParams();   // reads the [id] from the URL
  const id       = params.id as string;

  // form state — starts empty, gets filled when habit loads
  const [title,      setTitle]      = useState("");
  const [category,   setCategory]   = useState("Mind");
  const [color,      setColor]      = useState("#6366f1");
  const [targetDays, setTargetDays] = useState(30);
  const [note,       setNote]       = useState("");

  // page state
  const [loading,  setLoading]  = useState(true);  // loading habit data
  const [saving,   setSaving]   = useState(false); // saving changes
  const [error,    setError]    = useState("");

  // ── Load existing habit when page opens ──
  useEffect(() => {
    async function loadHabit() {
      const res  = await fetch(`/api/habits/${id}`); // GET /api/habits/abc123
      const data = await res.json();

      if (!res.ok) {
        setError("Habit not found");
        setLoading(false);
        return;
      }

      // pre-fill form with existing values
      const h = data.habit;
      setTitle(h.title);
      setCategory(h.category);
      setColor(h.color);
      setTargetDays(h.targetDays ?? 30);
      setNote(h.note ?? "");
      setLoading(false);
    }

    loadHabit();
  }, [id]); // runs when id changes (when page first loads)

  // ── Save changes ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch(`/api/habits/${id}`, {
      method: "PUT",  // PUT = update existing
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, color, targetDays, note }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setSaving(false);
      return;
    }

    router.push("/habits"); // success → go back to habits list
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen"
        style={{ background: "#08080f" }}>
        <div className="text-center">
          <div className="text-3xl mb-3">⚡</div>
          <div className="text-sm" style={{ color: "#4b5563" }}>
            Loading habit...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-xl mx-auto">

      {/* Header */}
      <div className="mb-7">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm mb-4 transition-opacity hover:opacity-70"
          style={{ color: "#4b5563" }}>
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-white mb-1">Edit Habit ✏️</h1>
        <p className="text-sm" style={{ color: "#4b5563" }}>
          Update your habit details below.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl p-6 sm:p-7"
        style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Live preview */}
        <div className="mb-6">
          <div className="text-[11px] font-medium mb-2" style={{ color: "#4b5563" }}>
            PREVIEW
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{ background: color + "22", color }}>
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            {title || "My Habit"} • {category} • {targetDays} days
          </div>
        </div>

        {/* Error */}
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

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#6b7280",
              }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
