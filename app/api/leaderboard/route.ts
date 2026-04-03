import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

function getDateRange(period: string) {
  const now = new Date();

  if (period === "weekly") {
    const monday = new Date(now);
    const day  = monday.getDay();
    const diff = day === 0 ? 6 : day - 1;
    monday.setDate(monday.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
  }

  if (period === "monthly") {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    firstDay.setHours(0, 0, 0, 0);
    return firstDay.toISOString();
  }

  return new Date("2020-01-01").toISOString();
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period    = searchParams.get("period") ?? "weekly";
  const startDate = getDateRange(period);

  const { data: logs, error } = await supabase
    .from("HabitLog")
    .select("habitId, completedAt")
    .gte("completedAt", startDate);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!logs || logs.length === 0) {
    return NextResponse.json({ leaderboard: [], yourRank: null });
  }

  const { data: habits } = await supabase
    .from("Habit")
    .select("id, userId");

  if (!habits) {
    return NextResponse.json({ leaderboard: [], yourRank: null });
  }

  const habitUserMap: Record<string, string> = {};
  habits.forEach((h) => { habitUserMap[h.id] = h.userId; });

  const checkinsPerUser: Record<string, number> = {};
  logs.forEach((log) => {
    const userId = habitUserMap[log.habitId];
    if (userId) {
      checkinsPerUser[userId] = (checkinsPerUser[userId] ?? 0) + 1;
    }
  });

  if (Object.keys(checkinsPerUser).length === 0) {
    return NextResponse.json({ leaderboard: [], yourRank: null });
  }

  const userIds = Object.keys(checkinsPerUser);

  // ← fetch image too
  const { data: users } = await supabase
    .from("User")
    .select("id, name, image")
    .in("id", userIds);

  if (!users) {
    return NextResponse.json({ leaderboard: [], yourRank: null });
  }

  const leaderboard = users
    .map((user) => ({
      userId:   user.id,
      name:     user.name,
      image:    user.image ?? null,  // ← include image
      checkins: checkinsPerUser[user.id] ?? 0,
      isYou:    user.id === session.user.id,
    }))
    .sort((a, b) => b.checkins - a.checkins)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const yourEntry = leaderboard.find((e) => e.isYou);

  return NextResponse.json({
    leaderboard: leaderboard.slice(0, 10),
    yourRank:    yourEntry ?? null,
  });
}