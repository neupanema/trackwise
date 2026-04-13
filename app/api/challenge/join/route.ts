import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { inviteCode } = await req.json();

  if (!inviteCode) {
    return NextResponse.json({ error: "Invite code required" }, { status: 400 });
  }

  const userId = session.user.id;

  const { data: room } = await supabase
    .from("ChallengeRoom")
    .select("*")
    .eq("invitecode", inviteCode.toUpperCase().trim())
    .eq("isactive", true)
    .maybeSingle();

  if (!room) {
    return NextResponse.json(
      { error: "Invalid or expired invite code" },
      { status: 404 }
    );
  }

  const { data: existing } = await supabase
    .from("RoomMember")
    .select("id")
    .eq("roomid", room.id)
    .eq("userid", userId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      room: {
        ...room,
        habitTitle: room.habittitle,
        inviteCode: room.invitecode,
        endDate:    room.enddate,
      },
      alreadyMember: true
    });
  }

  let { data: habit } = await supabase
    .from("Habit")
    .select("id")
    .eq("userId", userId)
    .ilike("title", `%${room.habittitle}%`)
    .maybeSingle();

  if (!habit) {
    const { data: newHabit } = await supabase
      .from("Habit")
      .insert([{
        title:           room.habittitle,
        category:        "Fitness",
        color:           "#6366f1",
        targetDays:      room.duration ?? 30,
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

  return NextResponse.json({
    room: {
      ...room,
      habitTitle: room.habittitle,
      inviteCode: room.invitecode,
      endDate:    room.enddate,
    },
    alreadyMember: false
  });
}