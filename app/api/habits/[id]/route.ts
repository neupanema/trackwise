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

  // both regular and rest days count toward streak continuity
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

// ── GET — fetch single habit for edit page ──
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id }  = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { data: habit, error } = await supabase
    .from("Habit")
    .select("*")
    .eq("id", id)
    .eq("userId", session.user.id)
    .maybeSingle();

  if (error || !habit) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  return NextResponse.json({ habit });
}

// ── PUT — update habit ──
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id }  = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { title, category, color, targetDays, note, restDaysPerWeek } =
    await req.json();

  const { data, error } = await supabase
    .from("Habit")
    .update({
      title,
      category,
      color,
      targetDays,
      note:            note            ?? "",
      restDaysPerWeek: restDaysPerWeek ?? 0, // ← new
    })
    .eq("id", id)
    .eq("userId", session.user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ habit: data });
}

// ── DELETE — delete habit and its logs ──
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id }  = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // verify ownership before touching any related rows
  const { data: owned } = await supabase
    .from("Habit")
    .select("id")
    .eq("id", id)
    .eq("userId", session.user.id)
    .maybeSingle();

  if (!owned) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  // clear habitid from any challenge room memberships so leaderboard falls back gracefully
  await supabase.from("RoomMember").update({ habitid: null }).eq("habitid", id);
  // delete logs first then habit
  await supabase.from("HabitLog").delete().eq("habitId", id);
  await supabase.from("Habit").delete().eq("id", id).eq("userId", session.user.id);

  return NextResponse.json({ success: true });
}