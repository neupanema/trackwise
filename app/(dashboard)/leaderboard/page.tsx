"use client";
import { useEffect, useState } from "react";

type Period = "weekly" | "monthly" | "alltime";

interface LeaderboardEntry {
  rank:     number;
  userId:   string;
  name:     string;
  image:    string | null;
  checkins: number;
  isYou:    boolean;
}

const tabs: { label: string; value: Period }[] = [
  { label: "This Week",  value: "weekly"  },
  { label: "This Month", value: "monthly" },
  { label: "All Time",   value: "alltime" },
];

const medals = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [period,   setPeriod]   = useState<Period>("weekly");
  const [data,     setData]     = useState<LeaderboardEntry[]>([]);
  const [yourRank, setYourRank] = useState<LeaderboardEntry | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetchLeaderboard(period);
  }, [period]);

  async function fetchLeaderboard(p: Period) {
    setLoading(true);
    const res  = await fetch(`/api/leaderboard?period=${p}`);
    const json = await res.json();
    setData(json.leaderboard ?? []);
    setYourRank(json.yourRank ?? null);
    setLoading(false);
  }

  const periodLabel = {
    weekly:  "this week",
    monthly: "this month",
    alltime: "all time",
  }[period];

  // ── Avatar component used for each user ──
  function Avatar({
    image, name, size = "sm", isYou = false
  }: {
    image: string | null;
    name: string;
    size?: "sm" | "lg";
    isYou?: boolean;
  }) {
    const dim = size === "lg" ? "w-12 h-12 text-base" : "w-9 h-9 text-sm";

    return (
      <div className={`${dim} rounded-full overflow-hidden flex-shrink-0`}
        style={{
          border: isYou
            ? "2px solid #6366f1"
            : "1px solid rgba(255,255,255,0.08)",
        }}>
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-semibold text-white"
            style={{ background: isYou
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "rgba(255,255,255,0.08)" }}>
            {name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
          🏆 Leaderboard
        </h1>
        <p className="text-sm" style={{ color: "#4b5563" }}>
          See who is crushing their habits.
        </p>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 mb-6 p-1 rounded-xl"
        style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>
        {tabs.map((tab) => {
          const active = period === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setPeriod(tab.value)}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: active ? "rgba(99,102,241,0.2)" : "transparent",
                border: active
                  ? "1px solid rgba(99,102,241,0.3)"
                  : "1px solid transparent",
                color: active ? "#a5b4fc" : "#4b5563",
              }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Your rank card */}
      {yourRank && (
        <div className="rounded-2xl p-4 mb-6 flex items-center gap-4"
          style={{
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.25)",
          }}>
          <Avatar
            image={yourRank.image}
            name={yourRank.name}
            size="lg"
            isYou={true}
          />
          <div className="flex-1">
            <div className="text-sm font-semibold text-white mb-0.5">
              Your Rank {periodLabel}
            </div>
            <div className="text-xs" style={{ color: "#6b7280" }}>
              {yourRank.checkins} check-ins
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: "#a5b4fc" }}>
              #{yourRank.rank}
            </div>
            <div className="text-lg">
              {yourRank.rank === 1 ? "🥇" :
               yourRank.rank === 2 ? "🥈" :
               yourRank.rank === 3 ? "🥉" : "🏅"}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard list */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.06)" }}>

        {loading ? (
          <div className="p-12 text-center" style={{ background: "#0d0d16" }}>
            <div className="text-3xl mb-3">⚡</div>
            <div className="text-sm" style={{ color: "#4b5563" }}>
              Loading leaderboard...
            </div>
          </div>

        ) : data.length === 0 ? (
          <div className="p-12 text-center" style={{ background: "#0d0d16" }}>
            <div className="text-3xl mb-3">🌱</div>
            <div className="text-white font-medium mb-1">No data yet!</div>
            <div className="text-sm" style={{ color: "#4b5563" }}>
              Start checking in habits to appear here
            </div>
          </div>

        ) : (
          data.map((entry, index) => {
            const isTop3 = entry.rank <= 3;
            const isLast = index === data.length - 1;

            return (
              <div key={entry.userId}
                className="flex items-center gap-4 px-5 py-4 transition-all"
                style={{
                  background: entry.isYou
                    ? "rgba(99,102,241,0.08)"
                    : index % 2 === 0
                    ? "#0d0d16"
                    : "rgba(255,255,255,0.01)",
                  borderBottom: isLast
                    ? "none"
                    : "1px solid rgba(255,255,255,0.04)",
                }}>

                {/* Rank */}
                <div className="w-8 text-center flex-shrink-0">
                  {isTop3 ? (
                    <span className="text-xl">{medals[entry.rank - 1]}</span>
                  ) : (
                    <span className="text-sm font-medium"
                      style={{ color: "#374151" }}>
                      #{entry.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar
                  image={entry.image}
                  name={entry.name}
                  isYou={entry.isYou}
                />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate"
                    style={{ color: entry.isYou ? "#a5b4fc" : "#e5e7eb" }}>
                    {entry.name}
                    {entry.isYou && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "rgba(99,102,241,0.2)",
                          color: "#a5b4fc",
                        }}>
                        you
                      </span>
                    )}
                  </div>
                  {/* Show rank badge for top 3 */}
                  {isTop3 && (
                    <div className="text-[10px] mt-0.5" style={{ color: "#4b5563" }}>
                      {entry.rank === 1 ? "👑 Leading the pack" :
                       entry.rank === 2 ? "Almost there!" :
                       "Top 3!"}
                    </div>
                  )}
                </div>

                {/* Check-ins */}
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-white">
                    {entry.checkins}
                  </div>
                  <div className="text-[10px]" style={{ color: "#374151" }}>
                    check-ins
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      <p className="text-center text-xs mt-4" style={{ color: "#374151" }}>
        Showing top 10 users · Resets{" "}
        {period === "weekly"
          ? "every Monday"
          : period === "monthly"
          ? "every 1st of month"
          : "never"}
      </p>

    </div>
  );
}