import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDaysBetween(start: Date, end: Date): string[] {
  const days: string[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    days.push(toDateString(new Date(current)));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const userId = session.user.id;

  // get all habits
  const { data: habits, error } = await supabase
    .from("Habit")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: true });

  if (error || !habits) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  if (habits.length === 0) {
    return NextResponse.json({ habits: [], logs: {}, days: [] });
  }

  // get all logs for this user's habits
  const habitIds = habits.map((h) => h.id);

  const { data: logs } = await supabase
    .from("HabitLog")
    .select("habitId, completedAt, isRestDay")
    .in("habitId", habitIds)
    .order("completedAt", { ascending: true });

  // find the earliest habit start date
  const earliest = habits.reduce((min, h) => {
    const d = new Date(h.createdAt);
    return d < min ? d : min;
  }, new Date(habits[0].createdAt));

  const today = new Date();

  // generate all days from earliest habit to today
  const allDays = getDaysBetween(earliest, today);

  // build a map: habitId → Set of completed date strings
  const completionMap: Record<string, Set<string>> = {};
  const restDayMap:    Record<string, Set<string>> = {};

  habits.forEach((h) => {
    completionMap[h.id] = new Set();
    restDayMap[h.id]    = new Set();
  });

  (logs ?? []).forEach((log) => {
    const dateStr = toDateString(new Date(log.completedAt));
    if (log.isRestDay) {
      restDayMap[log.habitId]?.add(dateStr);
    } else {
      completionMap[log.habitId]?.add(dateStr);
    }
  });

  // convert sets to plain objects for JSON serialization
  const completions: Record<string, string[]> = {};
  const restDays:    Record<string, string[]> = {};

  Object.entries(completionMap).forEach(([id, set]) => {
    completions[id] = Array.from(set);
  });
  Object.entries(restDayMap).forEach(([id, set]) => {
    restDays[id] = Array.from(set);
  });

  return NextResponse.json({
    habits,
    completions,
    restDays,
    days: allDays,
  });
}