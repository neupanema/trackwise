import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// ── Helper: get date string YYYY-MM-DD ignoring timezone ──
function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
  // "2026-03-29T14:30:00.000Z" → "2026-03-29"
}

// ── Helper: calculate streak from logs ──
async function calculateStreak(habitId: string): Promise<number> {
  const { data: logs } = await supabase
    .from("HabitLog")
    .select("completedAt")
    .eq("habitId", habitId)
    .order("completedAt", { ascending: false });

  if (!logs || logs.length === 0) return 0;

  // convert all logs to simple date strings
  // "2026-03-29T14:30:00.000Z" → "2026-03-29"
  const logDates = new Set(
    logs.map((log) => toDateString(new Date(log.completedAt)))
  );

  let streak = 0;
  const today = new Date();

  // check each day going backwards from today
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = toDateString(checkDate);

    if (logDates.has(dateStr)) {
      streak++; // this day exists → count it
    } else {
      break; // gap found → stop
    }
  }

  return streak;
}

// ── GET today's start and end ──
function getTodayRange() {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ── POST = check in habit for today ──
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { start, end } = getTodayRange();

  // check if already checked in today
  const { data: existing } = await supabase
    .from("HabitLog")
    .select("id")
    .eq("habitId", id)
    .gte("completedAt", start.toISOString())
    .lte("completedAt", end.toISOString())
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Already checked in today" },
      { status: 400 }
    );
  }

  // save today's check in
  const { error: insertError } = await supabase
    .from("HabitLog")
    .insert([{
      habitId: id,
      completedAt: new Date().toISOString(),
    }]);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // recalculate streak
  const streak = await calculateStreak(id);

  // update streak on the habit
  await supabase
    .from("Habit")
    .update({ streak })
    .eq("id", id);

  return NextResponse.json({ success: true, streak });
}

// ── DELETE = undo today's check in ──
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { start, end } = getTodayRange();

  // find today's log
  const { data: existing } = await supabase
    .from("HabitLog")
    .select("id")
    .eq("habitId", id)
    .gte("completedAt", start.toISOString())
    .lte("completedAt", end.toISOString())
    .maybeSingle();

  if (!existing) {
    return NextResponse.json(
      { error: "No check in found for today" },
      { status: 404 }
    );
  }

  // delete today's log
  await supabase
    .from("HabitLog")
    .delete()
    .eq("id", existing.id);

  // recalculate streak
  const streak = await calculateStreak(id);

  // update streak on the habit
  await supabase
    .from("Habit")
    .update({ streak })
    .eq("id", id);

  return NextResponse.json({ success: true, streak });
}