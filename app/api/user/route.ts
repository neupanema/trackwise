import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { name, email } = await req.json();

  if (!name?.trim() && !email?.trim()) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (name?.trim())  updates.name  = name.trim();
  if (email?.trim()) updates.email = email.trim();

  const { error } = await supabase
    .from("User")
    .update(updates)
    .eq("id", session.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const userId = session.user.id;

  // Step 1 — get all habits for this user
  const { data: habits } = await supabase
    .from("Habit")
    .select("id")
    .eq("userId", userId);

  // Step 2 — delete all HabitLogs for each habit
  if (habits && habits.length > 0) {
    const habitIds = habits.map((h) => h.id);
    await supabase
      .from("HabitLog")
      .delete()
      .in("habitId", habitIds);
  }

  // Step 3 — delete all habits
  await supabase
    .from("Habit")
    .delete()
    .eq("userId", userId);

  // Step 4 — delete the user
  await supabase
    .from("User")
    .delete()
    .eq("id", userId);

  return NextResponse.json({ success: true });
}