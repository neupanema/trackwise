import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const userId = session.user.id;

  const { data: memberships } = await supabase
    .from("RoomMember")
    .select("roomid")
    .eq("userid", userId);

  if (!memberships || memberships.length === 0) {
    return NextResponse.json({ rooms: [] });
  }

  const roomIds = memberships.map((m) => m.roomid);

  const { data: rooms } = await supabase
    .from("ChallengeRoom")
    .select("*")
    .in("id", roomIds)
    .eq("isactive", true)
    .order("createdat", { ascending: false });

  // normalize to camelCase for frontend
  const normalized = (rooms ?? []).map((r) => ({
    ...r,
    habitTitle: r.habittitle,
    inviteCode: r.invitecode,
    createdBy:  r.createdby,
    startDate:  r.startdate,
    endDate:    r.enddate,
    isActive:   r.isactive,
    createdAt:  r.createdat,
  }));

  return NextResponse.json({ rooms: normalized });
}