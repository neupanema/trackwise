"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Habit {
  id:              string;
  title:           string;
  category:        string;
  color:           string;
  streak:          number;
  targetDays:      number;
  note:            string;
  restDaysPerWeek: number; // ← new
}

interface HabitLog {
  id:          string;
  habitId:     string;
  completedAt: string;
  isRestDay:   boolean; // ← new
}

function getStreakTier(days: number) {
  if (days >= 90) return { name: "Immortal",     emoji: "💀" };
  if (days >= 75) return { name: "Supreme",      emoji: "🔱" };
  if (days >= 60) return { name: "Elite",        emoji: "🌟" };
  if (days >= 45) return { name: "Legendary",    emoji: "👑" };
  if (days >= 30) return { name: "Champion",     emoji: "🏆" };
  if (days >= 21) return { name: "Habit Master", emoji: "🚀" };
  if (days >= 15) return { name: "Unstoppable",  emoji: "💎" };
  if (days >= 10) return { name: "God Level",    emoji: "⚡" };
  if (days >= 5)  return { name: "Great",        emoji: "🔥" };
  return           { name: "Seedling",           emoji: "🌱" };
}

const categories = [
  "All Categories", "Mind", "Fitness",
  "Health", "Learning", "Finance", "Other"
];

export default function HabitsPage() {
  const [habits,   setHabits]   = useState<Habit[]>([]);
  const [logs,     setLogs]     = useState<HabitLog[]>([]); // ← changed from Set to array
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All Categories");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const [resting,  setResting]  = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const [habitsRes, logsRes] = await Promise.all([
      fetch("/api/habits"),
      fetch("/api/habits/logs"),
    ]);

    const habitsData = await habitsRes.json();
    const logsData   = await logsRes.json();

    setHabits(habitsData.habits ?? []);
    setLogs(logsData.logs ?? []);
    setLoading(false);
  }

  // check if habit is logged today (regular or rest)
  function isLoggedToday(habitId: string): boolean {
    return logs.some((l) => l.habitId === habitId);
  }

  // check if habit is resting today specifically
  function isRestingToday(habitId: string): boolean {
    return logs.some((l) => l.habitId === habitId && l.isRestDay);
  }

  // check if habit is done (regular check-in) today
  function isDoneToday(habitId: string): boolean {
    return logs.some((l) => l.habitId === habitId && !l.isRestDay);
  }

  // count rest days used this week for a habit
  function restDaysUsed(habitId: string): number {
    // we only track today's logs here so we fetch from API when needed
    // for display purposes just check today
    return logs.filter((l) => l.habitId === habitId && l.isRestDay).length;
  }

  async function toggleComplete(habit: Habit) {
    if (checking) return;
    setChecking(habit.id);

    const alreadyLogged = isLoggedToday(habit.id);

    if (alreadyLogged) {
      // undo today's log
      const res  = await fetch(`/api/habits/${habit.id}/checkin`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        setLogs((prev) => prev.filter((l) => l.habitId !== habit.id));
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habit.id ? { ...h, streak: data.streak } : h
          )
        );
      }
    } else {
      // regular check-in
      const res  = await fetch(`/api/habits/${habit.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRestDay: false }),
      });
      const data = await res.json();

      if (res.ok) {
        setLogs((prev) => [
          ...prev,
          {
            id:          Date.now().toString(),
            habitId:     habit.id,
            completedAt: new Date().toISOString(),
            isRestDay:   false,
          },
        ]);
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habit.id ? { ...h, streak: data.streak } : h
          )
        );
      }
    }

    setChecking(null);
  }

  async function handleRestDay(habit: Habit) {
    if (resting) return;
    setResting(habit.id);

    const res  = await fetch(`/api/habits/${habit.id}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRestDay: true }),
    });
    const data = await res.json();

    if (res.ok) {
      setLogs((prev) => [
        ...prev,
        {
          id:          Date.now().toString(),
          habitId:     habit.id,
          completedAt: new Date().toISOString(),
          isRestDay:   true,
        },
      ]);
      // streak stays same on rest day — no update needed
    } else {
      alert(data.error ?? "Could not use rest day");
    }

    setResting(null);
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Delete this habit? This cannot be undone."
    );
    if (!confirmed) return;
    setDeleting(id);
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setDeleting(null);
  }

  const filtered = habits.filter((h) => {
    const matchSearch   = h.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All Categories" || h.category === category;
    return matchSearch && matchCategory;
  });

  const totalHabits    = habits.length;
  const completedCount = habits.filter((h) => isDoneToday(h.id)).length;
  const pending        = totalHabits - completedCount;
  const progress       = totalHabits > 0
    ? Math.round((completedCount / totalHabits) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen"
        style={{ background: "#08080f" }}>
        <div className="text-center">
          <div className="text-3xl mb-3">⚡</div>
          <div className="text-sm" style={{ color: "#4b5563" }}>
            Loading habits...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8" style={{ maxWidth: "1100px", margin: "0 auto" }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
            All Habits
          </h1>
          <p className="text-sm" style={{ color: "#4b5563" }}>
            Manage and track all your habits in one place.
          </p>
        </div>
        <Link href="/add"
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          <Plus size={16} />
          <span className="hidden sm:inline">Add Habit</span>
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl"
          style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.08)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="#4b5563" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search habits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#e5e7eb" }}
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            background: "#0d0d16",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#e5e7eb",
            minWidth: "160px",
          }}>
          {categories.map((c) => (
            <option key={c} value={c} style={{ background: "#0d0d16" }}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { val: totalHabits,    label: "Total Habits", color: "#22d3ee" },
          { val: completedCount, label: "Completed",    color: "#4ade80" },
          { val: pending,        label: "Pending",      color: "#fb923c" },
          { val: `${progress}%`, label: "Progress",     color: "#a78bfa" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4 sm:p-5"
            style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-2xl sm:text-3xl font-bold mb-1"
              style={{ color: s.color }}>{s.val}</div>
            <div className="text-xs" style={{ color: "#4b5563" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {habits.length === 0 ? (
        <div className="rounded-2xl p-12 text-center"
          style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-4xl mb-3">🌱</div>
          <div className="text-white font-medium mb-2">No habits yet!</div>
          <div className="text-sm mb-5" style={{ color: "#4b5563" }}>
            Add your first habit to get started
          </div>
          <Link href="/add"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white inline-block"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            + Add First Habit
          </Link>
        </div>

      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-10 text-center"
          style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-3xl mb-3">🔍</div>
          <div className="text-white font-medium mb-1">No habits found</div>
          <div className="text-sm" style={{ color: "#4b5563" }}>
            Try a different search or category
          </div>
        </div>

      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((habit) => {
            const done       = isDoneToday(habit.id);
            const rests      = isRestingToday(habit.id);
            const logged     = isLoggedToday(habit.id);
            const isChecking = checking === habit.id;
            const isResting  = resting  === habit.id;
            const tier       = getStreakTier(habit.streak ?? 0);
            const target     = habit.targetDays || 30;
            const barWidth   = Math.min(
              ((habit.streak ?? 0) / target) * 100,
              100
            );

            return (
              <div key={habit.id} className="rounded-2xl p-5 transition-all"
                style={{
                  background: "#0d0d16",
                  border: `1px solid ${done
                    ? "rgba(99,102,241,0.25)"
                    : rests
                    ? "rgba(99,102,241,0.15)"
                    : "rgba(255,255,255,0.06)"}`,
                }}>

                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">

                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => !rests && toggleComplete(habit)}
                      disabled={isChecking || rests}
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-50"
                      style={{
                        border: done
                          ? "none"
                          : rests
                          ? "2px solid rgba(99,102,241,0.3)"
                          : "2px solid rgba(255,255,255,0.15)",
                        background: done
                          ? habit.color
                          : rests
                          ? "rgba(99,102,241,0.1)"
                          : "transparent",
                      }}>
                      {isChecking ? (
                        <div className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
                      ) : done ? (
                        <svg width="12" height="12" viewBox="0 0 24 24"
                          fill="none" stroke="#fff" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : rests ? (
                        <span style={{ fontSize: "10px" }}>🛌</span>
                      ) : null}
                    </button>

                    <div>
                      <span className="text-base font-semibold"
                        style={{
                          color: done ? "#4b5563" : "#fff",
                          textDecoration: done ? "line-through" : "none",
                        }}>
                        {habit.title}
                      </span>

                      {/* Rest days indicator */}
                      {habit.restDaysPerWeek > 0 && (
                        <div className="text-[10px] mt-0.5"
                          style={{ color: "#4b5563" }}>
                          🛌 {habit.restDaysPerWeek} rest day{habit.restDaysPerWeek > 1 ? "s" : ""}/week
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit + Delete */}
                  <div className="flex items-center gap-2">
                    <Link href={`/habits/edit/${habit.id}`}
                      className="opacity-40 hover:opacity-70 transition-opacity">
                      <Pencil size={15} color="#9ca3af" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(habit.id)}
                      disabled={deleting === habit.id}
                      className="opacity-40 hover:opacity-70 transition-opacity disabled:opacity-20">
                      <Trash2 size={15} color="#f87171" />
                    </button>
                  </div>
                </div>

                {/* Category + Goal */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: habit.color + "22", color: habit.color }}>
                    {habit.category}
                  </span>
                  <span className="text-xs" style={{ color: "#374151" }}>
                    Daily
                  </span>
                  <span className="text-xs ml-auto" style={{ color: "#374151" }}>
                    Goal: {target} days
                  </span>
                </div>

                {/* Note */}
                {habit.note ? (
                  <p className="text-xs mb-3 leading-relaxed"
                    style={{ color: "#4b5563" }}>
                    📝 {habit.note}
                  </p>
                ) : null}

                {/* Streak + Tier */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-sm">
                    🔥 <span className="font-medium text-white">
                      {habit.streak ?? 0} day streak
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: "rgba(99,102,241,0.12)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      color: "#a5b4fc",
                    }}>
                    🏅 {tier.name}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${barWidth}%`,
                        background: `linear-gradient(90deg, ${habit.color}, ${habit.color}99)`,
                      }} />
                  </div>
                  <span className="text-[10px] flex-shrink-0"
                    style={{ color: "#374151" }}>
                    {Math.round(barWidth)}%
                  </span>
                </div>

                {/* ── REST DAY BUTTON ── */}
                {habit.restDaysPerWeek > 0 && !logged && (
                  <button
                    type="button"
                    onClick={() => handleRestDay(habit)}
                    disabled={isResting}
                    className="w-full py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50 mt-1"
                    style={{
                      background: "rgba(99,102,241,0.08)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      color: "#a5b4fc",
                    }}>
                    {isResting ? "Using rest day..." : "🛌 Use Rest Day"}
                  </button>
                )}

                {/* Resting today badge */}
                {rests && (
                  <div className="w-full py-2 rounded-xl text-xs font-medium text-center mt-1"
                    style={{
                      background: "rgba(99,102,241,0.08)",
                      border: "1px solid rgba(99,102,241,0.15)",
                      color: "#a5b4fc",
                    }}>
                    🛌 Resting Today — streak preserved ✨
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}