import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { name, habitTitle, duration } = await req.json();

  if (!name || !habitTitle || !duration) {
    return NextResponse.json(
      { error: "Name, habit and duration required" },
      { status: 400 }
    );
  }

  const userId = session.user.id;

  // generate unique invite code
  let inviteCode = generateCode();
  let attempts   = 0;

  while (attempts < 10) {
    const { data: existing } = await supabase
      .from("ChallengeRoom")
      .select("id")
      .eq("inviteCode", inviteCode)
      .maybeSingle();

    if (!existing) break;
    inviteCode = generateCode();
    attempts++;
  }

  // calculate end date
  const startDate = new Date();
  const endDate   = new Date();
  endDate.setDate(endDate.getDate() + duration);

  // create room
  const { data: room, error } = await supabase
    .from("ChallengeRoom")
    .insert([{
      name,
      habitTitle,
      inviteCode,
      createdBy: userId,
      duration,
      startDate:  startDate.toISOString(),
      endDate:    endDate.toISOString(),
      isActive:   true,
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // auto-join creator as member
  // find their habit that matches habitTitle
  const { data: habit } = await supabase
    .from("Habit")
    .select("id")
    .eq("userId", userId)
    .ilike("title", `%${habitTitle}%`)
    .maybeSingle();

  await supabase
    .from("RoomMember")
    .insert([{
      roomId:  room.id,
      userId,
      habitId: habit?.id ?? null,
    }]);

  return NextResponse.json({ room }, { status: 201 });
}