import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // get only this user's habit IDs first
  const { data: habits } = await supabase
    .from("Habit")
    .select("id")
    .eq("userId", session.user.id);

  if (!habits || habits.length === 0) {
    return NextResponse.json({ logs: [] });
  }

  const habitIds = habits.map((h) => h.id);

  const { data: logs, error } = await supabase
    .from("HabitLog")
    .select("id, habitId, completedAt, isRestDay")
    .in("habitId", habitIds)
    .gte("completedAt", today.toISOString())
    .lt("completedAt", tomorrow.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs });
}