import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const userId = session.user.id;

  // get all rooms user is a member of
  const { data: memberships } = await supabase
    .from("RoomMember")
    .select("roomId")
    .eq("userId", userId);

  if (!memberships || memberships.length === 0) {
    return NextResponse.json({ rooms: [] });
  }

  const roomIds = memberships.map((m) => m.roomId);

  const { data: rooms } = await supabase
    .from("ChallengeRoom")
    .select("*")
    .in("id", roomIds)
    .eq("isActive", true)
    .order("createdAt", { ascending: false });

  return NextResponse.json({ rooms: rooms ?? [] });
}