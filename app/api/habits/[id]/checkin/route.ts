import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function calculateStreak(habitId: string): Promise<number> {
  const { data: logs } = await supabase
    .from("HabitLog")
    .select("completedAt, isRestDay")
    .eq("habitId", habitId)
    .order("completedAt", { ascending: false });

  if (!logs || logs.length === 0) return 0;

  const logDates = new Set(
    logs.map((log) => toDateString(new Date(log.completedAt)))
  );

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = toDateString(checkDate);

    if (logDates.has(dateStr)) {
      streak++;
    } else {
      if (i === 0) continue;
      break;
    }
  }

  return streak;
}

function getTodayRange() {
  const now   = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getWeekStart(): Date {
  const now  = new Date();
  const day  = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// POST = check in OR use rest day
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id }  = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body      = await req.json();
  const isRestDay = body.isRestDay === true;

  const { start, end } = getTodayRange();

  // check if already logged today
  const { data: existing } = await supabase
    .from("HabitLog")
    .select("id, isRestDay")
    .eq("habitId", id)
    .gte("completedAt", start.toISOString())
    .lte("completedAt", end.toISOString())
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Already logged today" },
      { status: 400 }
    );
  }

  // if rest day — validate allowance
  if (isRestDay) {
    const { data: habit } = await supabase
      .from("Habit")
      .select("restDaysPerWeek")
      .eq("id", id)
      .maybeSingle();

    const allowed = habit?.restDaysPerWeek ?? 0;

    if (allowed === 0) {
      return NextResponse.json(
        { error: "No rest days allowed for this habit" },
        { status: 400 }
      );
    }

    // count rest days used this week
    const weekStart = getWeekStart();
    const { data: restLogs } = await supabase
      .from("HabitLog")
      .select("id")
      .eq("habitId", id)
      .eq("isRestDay", true)
      .gte("completedAt", weekStart.toISOString());

    const usedThisWeek = restLogs?.length ?? 0;

    if (usedThisWeek >= allowed) {
      return NextResponse.json(
        { error: `All ${allowed} rest day(s) already used this week` },
        { status: 400 }
      );
    }
  }

  // save the log
  const { error: insertError } = await supabase
    .from("HabitLog")
    .insert([{
      habitId:     id,
      completedAt: new Date().toISOString(),
      isRestDay:   isRestDay,
    }]);

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  // get current streak
  const { data: habit } = await supabase
    .from("Habit")
    .select("streak")
    .eq("id", id)
    .maybeSingle();

  let newStreak: number;

  if (isRestDay) {
    // rest day → streak stays FROZEN (same value)
    newStreak = habit?.streak ?? 0;
  } else {
    // normal check-in → recalculate from actual logs (source of truth)
    // calculateStreak runs after insertion so today's log is included
    newStreak = await calculateStreak(id);
  }

  await supabase
    .from("Habit")
    .update({ streak: newStreak })
    .eq("id", id);

  return NextResponse.json({ success: true, streak: newStreak, isRestDay });
}

// DELETE = undo today's log
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id }  = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { start, end } = getTodayRange();

  const { data: existing } = await supabase
    .from("HabitLog")
    .select("id, isRestDay")
    .eq("habitId", id)
    .gte("completedAt", start.toISOString())
    .lte("completedAt", end.toISOString())
    .maybeSingle();

  if (!existing) {
    return NextResponse.json(
      { error: "No log found for today" },
      { status: 404 }
    );
  }

  await supabase
    .from("HabitLog")
    .delete()
    .eq("id", existing.id);

  // recalculate streak from remaining logs (source of truth)
  const newStreak = await calculateStreak(id);

  await supabase
    .from("Habit")
    .update({ streak: newStreak })
    .eq("id", id);

  return NextResponse.json({ success: true, streak: newStreak });
}