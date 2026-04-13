import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function getHabitStreak(habitId: string): Promise<number> {
  const { data: logs } = await supabase
    .from("HabitLog")
    .select("completedAt")
    .eq("habitId", habitId)
    .order("completedAt", { ascending: false });

  if (!logs || logs.length === 0) return 0;

  const logDates = new Set(
    logs.map((log) => toDateString(new Date(log.completedAt)))
  );

  let streak  = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = toDateString(checkDate);
    if (logDates.has(dateStr)) {
      streak++;
    } else {
      if (i === 0) continue;
      break;
    }
  }

  return streak;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session    = await auth();
  const { roomId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const userId = session.user.id;

  // verify membership
  const { data: membership } = await supabase
    .from("RoomMember")
    .select("id")
    .eq("roomid", roomId)
    .eq("userid", userId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: "You are not a member of this room" },
      { status: 403 }
    );
  }

  // get room
  const { data: room } = await supabase
    .from("ChallengeRoom")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // normalize room
  const normalizedRoom = {
    ...room,
    habitTitle: room.habittitle,
    inviteCode: room.invitecode,
    createdBy:  room.createdby,
    startDate:  room.startdate,
    endDate:    room.enddate,
    isActive:   room.isactive,
    createdAt:  room.createdat,
  };

  // get members
  const { data: members } = await supabase
    .from("RoomMember")
    .select("userid, habitid, joinedat")
    .eq("roomid", roomId);

  if (!members || members.length === 0) {
    return NextResponse.json({ room: normalizedRoom, leaderboard: [] });
  }

  const userIds = members.map((m) => m.userid);

  const { data: users } = await supabase
    .from("User")
    .select("id, name, image")
    .in("id", userIds);

  if (!users) {
    return NextResponse.json({ room: normalizedRoom, leaderboard: [] });
  }

  // build leaderboard
  const leaderboard = await Promise.all(
    members.map(async (member) => {
      const user  = users.find((u) => u.id === member.userid);
      let streak  = 0;

      if (member.habitid) {
        streak = await getHabitStreak(member.habitid);
      } else {
        const { data: habit } = await supabase
          .from("Habit")
          .select("id, streak")
          .eq("userId", member.userid)
          .ilike("title", `%${room.habittitle}%`)
          .maybeSingle();

        streak = habit?.streak ?? 0;
      }

      return {
        userId:   member.userid,
        name:     user?.name  ?? "Unknown",
        image:    user?.image ?? null,
        streak,
        isYou:    member.userid === userId,
        joinedAt: member.joinedat,
      };
    })
  );

  const sorted = leaderboard
    .sort((a, b) => b.streak - a.streak)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return NextResponse.json({ room: normalizedRoom, leaderboard: sorted });
}