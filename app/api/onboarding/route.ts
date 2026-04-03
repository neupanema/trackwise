import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // get session on SERVER side (more reliable than client)
  const session = await auth();

  // log to check what we get
  console.log("Onboarding session user:", session?.user);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Not logged in" },
      { status: 401 }
    );
  }

  const { habits, targetDays } = await req.json();

  // save habits only if user selected some
  if (habits && habits.length > 0) {
    const habitRows = habits.map((h: any) => ({
      title:      h.title,
      category:   h.category,
      color:      h.color,
      targetDays: targetDays ?? 21,
      note:       "",
      streak:     0,
      userId:     session.user.id,   // ← uses SERVER session
    }));

    const { error } = await supabase
      .from("Habit")
      .insert(habitRows);

    if (error) {
      console.log("Insert error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }

  // mark user as onboarded
  const { error: updateError } = await supabase
    .from("User")
    .update({ onboarded: true })
    .eq("id", session.user.id);

  if (updateError) {
    console.log("Update error:", updateError);
  }

  return NextResponse.json({ success: true });
}