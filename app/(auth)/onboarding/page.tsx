"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";        // ← new import
import { supabase } from "@/lib/db";                 // ← new import

const HABIT_TEMPLATES = [
  { title: "Morning Meditation", category: "Mind",     color: "#6366f1", icon: "🧘" },
  { title: "Daily Workout",    category: "Fitness",  color: "#22c55e", icon: "💪" },
  { title: "Read 20 Pages",      category: "Learning", color: "#f97316", icon: "📚" },
  { title: "Drink 8 Glasses",    category: "Health",   color: "#06b6d4", icon: "💧" },
  { title: "Journal",            category: "Mind",     color: "#8b5cf6", icon: "📝" },
  { title: "Sleep by 11pm",      category: "Health",   color: "#ec4899", icon: "🛌" },
  { title: "No Social Media",    category: "Mind",     color: "#eab308", icon: "📵" },
  { title: "Save Money",         category: "Finance",  color: "#14b8a6", icon: "💰" },
];

const TARGET_OPTIONS = [
  { days: 7,  label: "7 days",  icon: "⚡", desc: "Quick start"     },
  { days: 21, label: "21 days", icon: "🔥", desc: "Habit forming"   },
  { days: 30, label: "30 days", icon: "💎", desc: "Solid routine"   },
  { days: 90, label: "90 days", icon: "🏆", desc: "Life changing"   },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step,       setStep]       = useState(1);
  const [selected,   setSelected]   = useState<string[]>([]);
  const [targetDays, setTargetDays] = useState(21);
  const [loading,    setLoading]    = useState(false);


  const { data: session } = useSession();

useEffect(() => {
  async function checkOnboarded() {
    if (!session?.user?.id) return;

    const { data: user } = await supabase
      .from("User")
      .select("onboarded")
      .eq("id", session.user.id)
      .maybeSingle();

    // already onboarded → skip straight to dashboard
    if (user?.onboarded) {
      router.push("/dashboard");
    }
  }
  checkOnboarded();
}, [session]);

  function toggleHabit(title: string) {
    setSelected((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  }

  async function handleFinish() {
    setLoading(true);

    const habits = HABIT_TEMPLATES.filter((h) =>
      selected.includes(h.title)
    );

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habits, targetDays }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Setup failed. Please try again.");
        setLoading(false);
        return;
      }
    } catch {
      alert("Network error. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  const progress = ((step - 1) / 3) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#08080f" }}>
      <div className="w-full max-w-lg">

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="h-1 rounded-full flex-1 transition-all"
              style={{
                background: s <= step
                  ? "#6366f1"
                  : "rgba(255,255,255,0.08)",
              }} />
          ))}
        </div>

        {/* ── STEP 1 — Welcome ── */}
        {step === 1 && (
          <div className="rounded-2xl p-7"
            style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">👋</div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Welcome to TrackWise!
              </h1>
              <p className="text-sm" style={{ color: "#4b5563" }}>
                Let's set up your habits in 3 quick steps.
                <br />It takes less than a minute.
              </p>
            </div>

            <div className="rounded-xl p-4 mb-6"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <div className="text-xs font-semibold mb-2" style={{ color: "#a5b4fc" }}>
                What you'll get:
              </div>
              {[
                "Pre-loaded habits ready to track today",
                "Daily streaks starting from now",
                "Achievements to unlock as you grow",
              ].map((t) => (
                <div key={t} className="text-xs mb-1" style={{ color: "#6b7280" }}>
                  ✅ &nbsp;{t}
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              Let's Go →
            </button>
          </div>
        )}

        {/* ── STEP 2 — Pick Habits ── */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 text-center">
              Pick your habits 🌱
            </h1>
            <p className="text-sm text-center mb-6" style={{ color: "#4b5563" }}>
              Choose the ones you want to build. You can add more later.
            </p>

            <div className="rounded-2xl p-5"
              style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {HABIT_TEMPLATES.map((habit) => {
                  const isSelected = selected.includes(habit.title);
                  return (
                    <button
                      key={habit.title}
                      type="button"
                      onClick={() => toggleHabit(habit.title)}
                      className="relative p-4 rounded-xl text-left transition-all"
                      style={{
                        background: isSelected
                          ? habit.color + "18"
                          : "rgba(255,255,255,0.03)",
                        border: isSelected
                          ? `1px solid ${habit.color}55`
                          : "1px solid rgba(255,255,255,0.07)",
                      }}>
                      <div className="text-2xl mb-2">{habit.icon}</div>
                      <div className="text-sm font-semibold text-white mb-0.5">
                        {habit.title}
                      </div>
                      <div className="text-[10px]" style={{ color: "#4b5563" }}>
                        {habit.category}
                      </div>

                      {/* Checkmark */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: habit.color }}>
                          <svg width="10" height="10" viewBox="0 0 24 24"
                            fill="none" stroke="#fff" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                {selected.length > 0
                  ? `Continue with ${selected.length} habit${selected.length > 1 ? "s" : ""} →`
                  : "Continue →"}
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-full mt-2 py-2 text-xs"
                style={{ color: "#374151" }}>
                Skip — I'll add habits manually
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 — Target Days ── */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 text-center">
              Set your goal 🎯
            </h1>
            <p className="text-sm text-center mb-6" style={{ color: "#4b5563" }}>
              How long do you want to commit to these habits?
            </p>

            <div className="rounded-2xl p-5"
              style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {TARGET_OPTIONS.map((opt) => {
                  const active = targetDays === opt.days;
                  return (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setTargetDays(opt.days)}
                      className="py-4 px-3 rounded-xl text-center transition-all"
                      style={{
                        background: active
                          ? "rgba(99,102,241,0.15)"
                          : "rgba(255,255,255,0.03)",
                        border: active
                          ? "1px solid rgba(99,102,241,0.4)"
                          : "1px solid rgba(255,255,255,0.07)",
                      }}>
                      <div className="text-2xl mb-1">{opt.icon}</div>
                      <div className="text-sm font-semibold"
                        style={{ color: active ? "#a5b4fc" : "#e5e7eb" }}>
                        {opt.label}
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: "#4b5563" }}>
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl p-3 mb-5"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
                <p className="text-xs" style={{ color: "#a5b4fc" }}>
                  💡 Science says 21 days is the minimum to form a habit.
                  90 days makes it truly permanent.
                </p>
              </div>

              <button
                onClick={() => setStep(4)}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                Almost done →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4 — Summary ── */}
        {step === 4 && (
          <div className="rounded-2xl p-7 text-center"
            style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-5xl mb-3">🎉</div>
            <h1 className="text-2xl font-bold text-white mb-2">You're all set!</h1>
            <p className="text-sm mb-6" style={{ color: "#4b5563" }}>
              Your habits have been added. Start checking in today!
            </p>

            {/* Summary of selected habits */}
            {selected.length > 0 && (
              <div className="text-left mb-6">
                {HABIT_TEMPLATES.filter((h) => selected.includes(h.title))
                  .map((habit) => (
                    <div key={habit.title}
                      className="flex items-center gap-3 py-2.5"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="w-9 h-9 rounded-[9px] flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: habit.color + "22" }}>
                        {habit.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-white">
                          {habit.title}
                        </div>
                        <div className="text-xs" style={{ color: "#4b5563" }}>
                          {habit.category} · {targetDays} day goal
                        </div>
                      </div>
                      <div className="text-xs px-2 py-1 rounded-full"
                        style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc" }}>
                        ✓ Added
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <button
              onClick={handleFinish}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              {loading ? "Setting up..." : "Go to Dashboard →"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}