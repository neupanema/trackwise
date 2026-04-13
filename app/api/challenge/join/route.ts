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

  // find the room
  const { data: room } = await supabase
    .from("ChallengeRoom")
    .select("*")
    .eq("inviteCode", inviteCode.toUpperCase().trim())
    .eq("isActive", true)
    .maybeSingle();

  if (!room) {
    return NextResponse.json(
      { error: "Invalid or expired invite code" },
      { status: 404 }
    );
  }

  // check if already a member
  const { data: existing } = await supabase
    .from("RoomMember")
    .select("id")
    .eq("roomId", room.id)
    .eq("userId", userId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ room, alreadyMember: true });
  }

  // find their matching habit
  const { data: habit } = await supabase
    .from("Habit")
    .select("id")
    .eq("userId", userId)
    .ilike("title", `%${room.habitTitle}%`)
    .maybeSingle();

  // join the room
  await supabase
    .from("RoomMember")
    .insert([{
      roomId:  room.id,
      userId,
      habitId: habit?.id ?? null,
    }]);

  return NextResponse.json({ room, alreadyMember: false });
}