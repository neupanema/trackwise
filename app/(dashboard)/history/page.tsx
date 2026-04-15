"use client";
import { useEffect, useState, useRef } from "react";

interface Habit {
  id:          string;
  title:       string;
  category:    string;
  color:       string;
  streak:      number;
  targetDays:  number;
  createdAt:   string;
}

interface HistoryData {
  habits:      Habit[];
  completions: Record<string, string[]>;
  restDays:    Record<string, string[]>;
  days:        string[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isHabitActive(habit: Habit, dateStr: string): boolean {
  const habitStart = new Date(habit.createdAt);
  habitStart.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + "T00:00:00");
  return date >= habitStart;
}

function isHabitCompleted(habit: Habit): boolean {
  return (habit.streak ?? 0) >= (habit.targetDays ?? 30);
}

export default function HistoryPage() {
  const [data,    setData]    = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const tableRef              = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchHistory() {
      const res  = await fetch("/api/habits/history");
      const json = await res.json();
      setData(json);
      setLoading(false);
    }
    fetchHistory();
  }, []);

  // scroll to bottom (most recent) on load
  useEffect(() => {
    if (data && tableRef.current) {
      tableRef.current.scrollTop = tableRef.current.scrollHeight;
    }
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen"
        style={{ background: "#08080f" }}>
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">⚡</div>
          <div className="text-sm" style={{ color: "#4b5563" }}>
            Loading history...
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.habits.length === 0) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        <div className="mb-7">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
            📊 Habit History
          </h1>
          <p className="text-sm" style={{ color: "#4b5563" }}>
            Your daily habit completion chart.
          </p>
        </div>
        <div className="rounded-2xl p-12 text-center"
          style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-4xl mb-4">🌱</div>
          <div className="text-white font-medium mb-2">No habits yet!</div>
          <div className="text-sm" style={{ color: "#4b5563" }}>
            Add habits and start checking in to see your history
          </div>
        </div>
      </div>
    );
  }

  const { habits, completions, restDays, days } = data;

  // get completion set for fast lookup
  const completionSets: Record<string, Set<string>> = {};
  const restDaySets:    Record<string, Set<string>> = {};

  habits.forEach((h) => {
    completionSets[h.id] = new Set(completions[h.id] ?? []);
    restDaySets[h.id]    = new Set(restDays[h.id]    ?? []);
  });

  // stats
  const totalDays      = days.length;
  const totalPossible  = habits.reduce((sum, h) => {
    const active = days.filter((d) => isHabitActive(h, d)).length;
    return sum + active;
  }, 0);
  const totalCompleted = habits.reduce((sum, h) => {
    return sum + (completions[h.id]?.length ?? 0);
  }, 0);
  const overallRate = totalPossible > 0
    ? Math.round((totalCompleted / totalPossible) * 100)
    : 0;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
          📊 Habit History
        </h1>
        <p className="text-sm" style={{ color: "#4b5563" }}>
          Every day, every habit — your complete journey.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { val: totalDays,       label: "Days Tracked",    color: "#a78bfa" },
          { val: habits.length,   label: "Total Habits",    color: "#34d399" },
          { val: totalCompleted,  label: "Total Check-ins", color: "#60a5fa" },
          { val: `${overallRate}%`, label: "Completion Rate", color: "#fbbf24" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4"
            style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-2xl font-bold mb-0.5"
              style={{ color: s.color }}>{s.val}</div>
            <div className="text-xs" style={{ color: "#4b5563" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {[
          { icon: "✅", label: "Completed"   },
          { icon: "🛌", label: "Rest Day"    },
          { icon: "❌", label: "Missed"      },
          { icon: "—",  label: "Not started" },
          { icon: "👑", label: "Goal reached"},
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span style={{ fontSize: "13px" }}>{l.icon}</span>
            <span className="text-xs" style={{ color: "#4b5563" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Scrollable container */}
        <div
          ref={tableRef}
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight:  "600px",
          }}>
          <table style={{
            borderCollapse: "collapse",
            width: "100%",
            minWidth: `${Math.max(400, habits.length * 90 + 100)}px`,
          }}>

            {/* Header — sticky */}
            <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
              <tr>
                {/* Date column */}
                <th style={{
                  background:  "#0d0d16",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  borderRight:  "1px solid rgba(255,255,255,0.08)",
                  padding:      "10px 14px",
                  textAlign:    "left",
                  fontSize:     "10px",
                  fontWeight:   600,
                  color:        "#4b5563",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  position:     "sticky",
                  left:         0,
                  zIndex:       20,
                }}>
                  Date
                </th>

                {/* Habit columns */}
                {habits.map((habit) => {
                  const completed = isHabitCompleted(habit);
                  return (
                    <th key={habit.id} style={{
                      background:   "#0d0d16",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      borderRight:  "1px solid rgba(255,255,255,0.04)",
                      padding:      "10px 8px",
                      textAlign:    "center",
                      minWidth:     "90px",
                      maxWidth:     "120px",
                    }}>
                      <div style={{
                        fontSize:   "11px",
                        fontWeight:  600,
                        color:       completed ? "#374151" : "#e5e7eb",
                        overflow:    "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace:  "nowrap",
                        maxWidth:    "100px",
                        margin:      "0 auto",
                      }}>
                        {completed ? "👑 " : ""}{habit.title}
                      </div>
                      <div style={{
                        fontSize: "9px",
                        color:    completed ? "#374151" : habit.color,
                        marginTop: "2px",
                      }}>
                        {completed
                          ? `${habit.targetDays}d ✓`
                          : `${habit.streak}/${habit.targetDays}d`}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {days.map((day, dayIndex) => {
                const isToday   = day === new Date().toLocaleDateString("en-CA");
                const isEven    = dayIndex % 2 === 0;

                return (
                  <tr key={day}
                    style={{
                      background: isToday
                        ? "rgba(99,102,241,0.08)"
                        : isEven
                        ? "#0d0d16"
                        : "rgba(255,255,255,0.015)",
                    }}>

                    {/* Date cell — sticky left */}
                    <td style={{
                      padding:     "8px 14px",
                      fontSize:    "11px",
                      fontWeight:  isToday ? 700 : 400,
                      color:       isToday ? "#a5b4fc" : "#6b7280",
                      borderRight: "1px solid rgba(255,255,255,0.06)",
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      whiteSpace:  "nowrap",
                      position:    "sticky",
                      left:         0,
                      background:  isToday
                        ? "rgba(99,102,241,0.08)"
                        : isEven
                        ? "#0d0d16"
                        : "rgba(255,255,255,0.015)",
                      zIndex:       5,
                    }}>
                      {isToday ? "Today" : formatDate(day)}
                    </td>

                    {/* Habit cells */}
                    {habits.map((habit) => {
                      const active    = isHabitActive(habit, day);
                      const done      = completionSets[habit.id]?.has(day);
                      const rested    = restDaySets[habit.id]?.has(day);
                      const completed = isHabitCompleted(habit);

                      let content: string;
                      let bgColor:   string;
                      let opacity =  1;

                      if (!active) {
                        // habit didn't exist yet
                        content = "—";
                        bgColor = "transparent";
                        opacity = 0.3;
                      } else if (done) {
                        content = "✅";
                        bgColor = habit.color + "15";
                      } else if (rested) {
                        content = "🛌";
                        bgColor = "rgba(99,102,241,0.08)";
                      } else {
                        // missed
                        const isPast = day < new Date().toLocaleDateString("en-CA");
                        content = isPast ? "❌" : "·";
                        bgColor = "transparent";
                        opacity = isPast ? 0.5 : 0.3;
                      }

                      if (completed) opacity = Math.min(opacity, 0.4);

                      return (
                        <td key={habit.id} style={{
                          padding:      "6px 4px",
                          textAlign:    "center",
                          fontSize:     "14px",
                          borderRight:  "1px solid rgba(255,255,255,0.03)",
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          background:   bgColor,
                          opacity,
                          transition:   "opacity 0.2s",
                        }}>
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-center text-xs mt-4" style={{ color: "#374151" }}>
        Showing all {totalDays} days from your first habit · Scroll up for older dates
      </p>
    </div>
  );
}