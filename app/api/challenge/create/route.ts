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

  if (!Number.isInteger(duration) || duration < 1 || duration > 365) {
    return NextResponse.json(
      { error: "Duration must be between 1 and 365 days" },
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
      .eq("invitecode", inviteCode)
      .maybeSingle();

    if (!existing) break;
    inviteCode = generateCode();
    attempts++;
  }

  const startDate = new Date();
  const endDate   = new Date();
  endDate.setDate(endDate.getDate() + duration);

  const { data: room, error } = await supabase
    .from("ChallengeRoom")
    .insert([{
      name,
      habittitle:  habitTitle,
      invitecode:  inviteCode,
      createdby:   userId,
      duration,
      startdate:   startDate.toISOString(),
      enddate:     endDate.toISOString(),
      isactive:    true,
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // auto-join creator — find or create the habit
  let { data: habit } = await supabase
    .from("Habit")
    .select("id")
    .eq("userId", userId)
    .ilike("title", `%${habitTitle}%`)
    .maybeSingle();

  if (!habit) {
    const { data: newHabit } = await supabase
      .from("Habit")
      .insert([{
        title:           habitTitle,
        category:        "Fitness",
        color:           "#6366f1",
        targetDays:      duration,
        note:            "",
        restDaysPerWeek: 0,
        userId,
        streak:          0,
      }])
      .select()
      .single();
    habit = newHabit;
  }

  await supabase
    .from("RoomMember")
    .insert([{
      roomid:  room.id,
      userid:  userId,
      habitid: habit?.id ?? null,
    }]);

  // return with camelCase for frontend
  return NextResponse.json({
    room: {
      ...room,
      habitTitle:  room.habittitle,
      inviteCode:  room.invitecode,
      createdBy:   room.createdby,
      startDate:   room.startdate,
      endDate:     room.enddate,
      isActive:    room.isactive,
      createdAt:   room.createdat,
    }
  }, { status: 201 });
}