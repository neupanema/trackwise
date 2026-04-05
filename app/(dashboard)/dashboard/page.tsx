"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getStreakTier } from "@/lib/utils";
import QuoteCard from "@/components/ui/QuoteCard";
import YearProgress from "@/components/ui/YearProgress";

const tiers = [
  { name: "Seedling",     emoji: "🌱", days: 1  },
  { name: "Great",        emoji: "🔥", days: 5  },
  { name: "God Level",    emoji: "⚡", days: 10 },
  { name: "Unstoppable",  emoji: "💎", days: 15 },
  { name: "Habit Master", emoji: "🚀", days: 21 },
  { name: "Champion",     emoji: "🔒", days: 30 },
  { name: "Legendary",    emoji: "🔒", days: 45 },
  { name: "Elite",        emoji: "🔒", days: 60 },
  { name: "Supreme",      emoji: "🔒", days: 75 },
  { name: "Immortal",     emoji: "🔒", days: 90 },
];

interface Habit {
  id: string;
  title: string;
  category: string;
  color: string;
  streak: number;
  targetDays: number;
  note: string;
}

interface HabitLog {
  id: string;
  habitId: string;
  completedAt: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [habits,  setHabits]  = useState<Habit[]>([]);
  const [logs,    setLogs]    = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchData();
  }, []);

  const totalHabits = habits.length;

  const completedToday = habits.filter((h) =>
    logs.some((log) => log.habitId === h.id)
  ).length;

  const pct = totalHabits > 0
    ? Math.round((completedToday / totalHabits) * 100)
    : 0;

  const bestStreak     = habits.length > 0
    ? Math.max(...habits.map((h) => h.streak ?? 0))
    : 0;
  const totalStreakDays = habits.reduce((sum, h) => sum + (h.streak ?? 0), 0);

  const avgProgress = habits.length > 0
    ? Math.round(
        habits.reduce((sum, h) =>
          sum + Math.min(((h.streak ?? 0) / (h.targetDays || 30)) * 100, 100), 0
        ) / habits.length
      )
    : 0;

  const circumference = 2 * Math.PI * 40;
  const offset        = circumference - (pct / 100) * circumference;
  const currentTier   = getStreakTier(bestStreak);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen"
        style={{ background: "#08080f" }}>
        <div className="text-center">
          <div className="text-3xl mb-3">⚡</div>
          <div className="text-sm" style={{ color: "#4b5563" }}>
            Loading your habits...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
          Welcome back, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm" style={{ color: "#4b5563" }}>
          Track your habits and stay motivated every day.
        </p>
      </div>

      {/* Quote */}
      <QuoteCard />

      {/* Year Progress */}
    
      {/* Empty state */}
      {totalHabits === 0 ? (
        <div className="rounded-2xl p-12 text-center"
          style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-4xl mb-4">🌱</div>
          <div className="text-white font-medium mb-2">No habits yet!</div>
          <div className="text-sm mb-6" style={{ color: "#4b5563" }}>
            Start by adding your first habit
          </div>
          <a href="/add"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white inline-block"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            + Add First Habit
          </a>
        </div>
      ) : (
        <>
          {/* Progress card */}
          <div className="rounded-2xl p-5 mb-5 flex flex-col sm:flex-row items-center gap-6"
            style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg width="96" height="96" viewBox="0 0 100 100"
                style={{ transform: "rotate(-90deg)" }}>
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke="#6366f1" strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-white">{pct}%</span>
                <span className="text-[10px]" style={{ color: "#4b5563" }}>today</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full sm:flex-1">
              {[
                { val: completedToday,               label: "Completed Today", color: "#34d399" },
                { val: totalHabits - completedToday, label: "Remaining",       color: "#fb923c" },
                { val: `${avgProgress}%`,            label: "Avg Progress",    color: "#60a5fa" },
                { val: bestStreak,                   label: "Best Streak",     color: "#a78bfa" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold mb-0.5" style={{ color: s.color }}>
                    {s.val}
                  </div>
                  <div className="text-xs" style={{ color: "#4b5563" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { icon: "🎯", val: totalHabits,                        label: "Total Habits",      bg: "rgba(20,184,166,0.12)"  },
              { icon: "📈", val: `${completedToday}/${totalHabits}`,  label: "Completed Today",   bg: "rgba(99,102,241,0.12)", badge: `${pct}%`,        badgeColor: "#34d399" },
              { icon: "🏆", val: `${bestStreak} days`,               label: "Best Streak",       bg: "rgba(251,191,36,0.12)", badge: currentTier.name, badgeColor: "#a5b4fc" },
              { icon: "🔥", val: totalStreakDays,                    label: "Total Streak Days", bg: "rgba(236,72,153,0.12)" },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl p-4"
                style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-9 h-9 rounded-[9px] flex items-center justify-center text-base mb-3"
                  style={{ background: c.bg }}>{c.icon}</div>
                <div className="text-xl font-bold text-white mb-0.5">{c.val}</div>
                <div className="text-xs" style={{ color: "#4b5563" }}>{c.label}</div>
                {c.badge && (
                  <div className="text-[10px] px-2 py-0.5 rounded-full mt-2 inline-block"
                    style={{ background: "rgba(255,255,255,0.06)", color: c.badgeColor }}>
                    {c.badge}
                  </div>
                )}
              </div>
            ))}
          </div>

<YearProgress />
          {/* Achievements */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🏅</span>
            <span className="text-sm font-medium" style={{ color: "#e5e7eb" }}>
              Your Achievements
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
            {tiers.map((tier) => {
              const unlocked = bestStreak >= tier.days;
              return (
                <div key={tier.name} className="rounded-xl p-3 text-center transition-all"
                  style={{
                    background: "#0d0d16",
                    border: `1px solid ${unlocked
                      ? "rgba(99,102,241,0.2)"
                      : "rgba(255,255,255,0.04)"}`,
                    opacity: unlocked ? 1 : 0.35,
                  }}>
                  <div className="text-xl mb-1.5">
                    {unlocked ? tier.emoji : "🔒"}
                  </div>
                  <div className="text-[11px] font-medium mb-0.5"
                    style={{ color: unlocked ? "#e5e7eb" : "#4b5563" }}>
                    {tier.name}
                  </div>
                  <div className="text-[10px]" style={{ color: "#374151" }}>
                    {tier.days} days
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}