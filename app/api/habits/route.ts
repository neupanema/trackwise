import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { data: habits, error } = await supabase
    .from("Habit")
    .select("*")
    .eq("userId", session.user.id)
    .order("createdAt", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ habits });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { title, category, color, targetDays, note, restDaysPerWeek } =
    await req.json();

  if (!title || !category || !color) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const userId = session.user.id;

  const { data, error } = await supabase
    .from("Habit")
    .insert([{
      title,
      category,
      color,
      targetDays:      targetDays      ?? 30,
      note:            note            ?? "",
      restDaysPerWeek: restDaysPerWeek ?? 0,
      userId,
      streak: 0,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ habit: data }, { status: 201 });
}