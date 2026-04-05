import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Not logged in" },
      { status: 401 }
    );
  }

  const userId = session.user.id; // ← extract here so TypeScript is happy

  const { habits, targetDays } = await req.json();

  if (habits && habits.length > 0) {
    const habitRows = habits.map((h: any) => ({
      title:      h.title,
      category:   h.category,
      color:      h.color,
      targetDays: targetDays ?? 21,
      note:       "",
      streak:     0,
      userId:     userId,           // ← use extracted variable
    }));

    const { error } = await supabase
      .from("Habit")
      .insert(habitRows);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }

  await supabase
    .from("User")
    .update({ onboarded: true })
    .eq("id", userId);              // ← use extracted variable

  return NextResponse.json({ success: true });
}