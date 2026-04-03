import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// converts any date to YYYY-MM-DD string
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// calculate streak by looking at logs
async function calculateStreak(habitId: string): Promise<number> {
  const { data: logs } = await supabase
    .from("HabitLog")
    .select("completedAt")
    .eq("habitId", habitId)
    .order("completedAt", { ascending: false });

  if (!logs || logs.length === 0) return 0;

  // get all unique dates from logs
  const logDates = new Set(
    logs.map((log) => {
      const d = new Date(log.completedAt);
      return toDateString(d);
    })
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
      // day 0 = today, if not checked yet that's OK
      // don't break streak just because today isn't done yet
      if (i === 0) continue;
      break;
    }
  }

  return streak;
}

// get today's date range in UTC that covers the full local day
function getTodayRange() {
  const now   = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// POST = check in habit for today
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id }  = await params;

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

  // save check in with current timestamp
  const { error: insertError } = await supabase
    .from("HabitLog")
    .insert([{
      habitId:     id,
      completedAt: new Date().toISOString(),
    }]);

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  // calculate new streak
  const streak = await calculateStreak(id);

  // get current streak to make sure we never go backwards
  const { data: habit } = await supabase
    .from("Habit")
    .select("streak")
    .eq("id", id)
    .maybeSingle();

  // use whichever is higher
  const currentStreak = habit?.streak ?? 0;
  const newStreak     = Math.max(streak, currentStreak + 1);

  // update habit streak
  await supabase
    .from("Habit")
    .update({ streak: newStreak })
    .eq("id", id);

  return NextResponse.json({ success: true, streak: newStreak });
}

// DELETE = undo today's check in
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

  // get current streak
  const { data: habit } = await supabase
    .from("Habit")
    .select("streak")
    .eq("id", id)
    .maybeSingle();

  // subtract 1 but never below 0
  const newStreak = Math.max((habit?.streak ?? 1) - 1, 0);

  await supabase
    .from("Habit")
    .update({ streak: newStreak })
    .eq("id", id);

  return NextResponse.json({ success: true, streak: newStreak });
}