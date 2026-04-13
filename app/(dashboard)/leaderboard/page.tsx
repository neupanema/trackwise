"use client";
import { useEffect, useState } from "react";

// ── Types ──
interface LeaderboardEntry {
  rank:    number;
  userId:  string;
  name:    string;
  image:   string | null;
  streak:  number;
  isYou:   boolean;
}

interface ChallengeRoom {
  id:         string;
  name:       string;
  habitTitle: string;
  inviteCode: string;
  duration:   number;
  startDate:  string;
  endDate:    string;
  createdBy:  string;
}

type Tab = "challenges" | "create" | "join";

const medals = ["🥇", "🥈", "🥉"];

// ── Avatar ──
function Avatar({
  image, name, size = "sm", isYou = false
}: {
  image:   string | null;
  name:    string;
  size?:   "sm" | "lg";
  isYou?:  boolean;
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
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-semibold text-white"
          style={{
            background: isYou
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "rgba(255,255,255,0.08)",
          }}>
          {name?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const [tab,          setTab]          = useState<Tab>("challenges");
  const [rooms,        setRooms]        = useState<ChallengeRoom[]>([]);
  const [activeRoom,   setActiveRoom]   = useState<ChallengeRoom | null>(null);
  const [leaderboard,  setLeaderboard]  = useState<LeaderboardEntry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [boardLoading, setBoardLoading] = useState(false);

  // create form state
  const [createName,     setCreateName]     = useState("");
  const [createHabit,    setCreateHabit]    = useState("");
  const [createDuration, setCreateDuration] = useState(30);
  const [creating,       setCreating]       = useState(false);
  const [createError,    setCreateError]    = useState("");
  const [createSuccess,  setCreateSuccess]  = useState("");

  // join form state
  const [joinCode,    setJoinCode]    = useState("");
  const [joining,     setJoining]     = useState(false);
  const [joinError,   setJoinError]   = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    setLoading(true);
    const res  = await fetch("/api/challenge/rooms");
    const json = await res.json();
    setRooms(json.rooms ?? []);
    setLoading(false);
  }

  async function fetchRoomLeaderboard(room: ChallengeRoom) {
    setActiveRoom(room);
    setBoardLoading(true);
    const res  = await fetch(`/api/challenge/${room.id}/leaderboard`);
    const json = await res.json();
    setLeaderboard(json.leaderboard ?? []);
    setBoardLoading(false);
  }

  async function handleCreate() {
    if (!createName.trim() || !createHabit.trim()) {
      setCreateError("Please fill in all fields");
      return;
    }
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");

    const res  = await fetch("/api/challenge/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:       createName,
        habitTitle: createHabit,
        duration:   createDuration,
      }),
    });
    const json = await res.json();

    if (!res.ok) {
      setCreateError(json.error ?? "Something went wrong");
    } else {
      setCreateSuccess(
        `Challenge created! Invite code: ${json.room.inviteCode}`
      );
      setCreateName("");
      setCreateHabit("");
      setCreateDuration(30);
      fetchRooms();
    }
    setCreating(false);
  }

  async function handleJoin() {
    if (!joinCode.trim()) {
      setJoinError("Please enter an invite code");
      return;
    }
    setJoining(true);
    setJoinError("");
    setJoinSuccess("");

    const res  = await fetch("/api/challenge/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: joinCode }),
    });
    const json = await res.json();

    if (!res.ok) {
      setJoinError(json.error ?? "Something went wrong");
    } else {
      setJoinSuccess(
        json.alreadyMember
          ? "You are already in this challenge!"
          : `Joined "${json.room.name}" successfully!`
      );
      setJoinCode("");
      fetchRooms();
    }
    setJoining(false);
  }

  function daysLeft(endDate: string): number {
    const end   = new Date(endDate);
    const now   = new Date();
    const diff  = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // ── Active room leaderboard view ──
  if (activeRoom) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto">

        {/* Back button */}
        <button
          type="button"
          onClick={() => { setActiveRoom(null); setLeaderboard([]); }}
          className="flex items-center gap-1.5 text-sm mb-6 hover:opacity-70 transition-opacity"
          style={{ color: "#4b5563" }}>
          ← Back to Challenges
        </button>

        {/* Room header */}
        <div className="rounded-2xl p-5 mb-6"
          style={{
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)",
          }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-white mb-1">
                🏆 {activeRoom.name}
              </h1>
              <div className="text-xs" style={{ color: "#6b7280" }}>
                Competing on: <span style={{ color: "#a5b4fc" }}>
                  {activeRoom.habitTitle}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium mb-1"
                style={{ color: "#4b5563" }}>
                Invite Code
              </div>
              <div className="text-lg font-bold tracking-widest"
                style={{ color: "#6366f1" }}>
                {activeRoom.inviteCode}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-xs" style={{ color: "#4b5563" }}>
              Duration: <span style={{ color: "#e5e7eb" }}>
                {activeRoom.duration} days
              </span>
            </div>
            <div className="text-xs" style={{ color: "#4b5563" }}>
              Days left: <span style={{ color: "#34d399" }}>
                {daysLeft(activeRoom.endDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.06)" }}>

          {boardLoading ? (
            <div className="p-12 text-center" style={{ background: "#0d0d16" }}>
              <div className="text-3xl mb-3 animate-pulse">⚡</div>
              <div className="text-sm" style={{ color: "#4b5563" }}>
                Loading rankings...
              </div>
            </div>

          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center" style={{ background: "#0d0d16" }}>
              <div className="text-3xl mb-3">🌱</div>
              <div className="text-white font-medium mb-1">
                No data yet!
              </div>
              <div className="text-sm" style={{ color: "#4b5563" }}>
                Start checking in your {activeRoom.habitTitle} habit
              </div>
            </div>

          ) : (
            leaderboard.map((entry, index) => {
              const isTop3 = entry.rank <= 3;
              const isLast = index === leaderboard.length - 1;

              return (
                <div key={entry.userId}
                  className="flex items-center gap-4 px-5 py-4"
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
                    {isTop3 && (
                      <div className="text-[10px] mt-0.5"
                        style={{ color: "#4b5563" }}>
                        {entry.rank === 1 ? "👑 Leading!" :
                         entry.rank === 2 ? "So close!" :
                         "Top 3!"}
                      </div>
                    )}
                  </div>

                  {/* Streak */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-white">
                      🔥 {entry.streak}
                    </div>
                    <div className="text-[10px]" style={{ color: "#374151" }}>
                      day streak
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "#374151" }}>
          Ranked by {activeRoom.habitTitle} streak · Updates in real time
        </p>
      </div>
    );
  }

  // ── Main leaderboard page ──
  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
          🏆 Challenges
        </h1>
        <p className="text-sm" style={{ color: "#4b5563" }}>
          Compete with friends on specific habits. Private and fair.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 rounded-xl"
        style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { label: "My Challenges", value: "challenges" as Tab },
          { label: "Create New",    value: "create"     as Tab },
          { label: "Join Room",     value: "join"       as Tab },
        ].map((t) => {
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: active ? "rgba(99,102,241,0.2)"  : "transparent",
                border:     active ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                color:      active ? "#a5b4fc" : "#4b5563",
              }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── MY CHALLENGES TAB ── */}
      {tab === "challenges" && (
        <div>
          {loading ? (
            <div className="rounded-2xl p-12 text-center"
              style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-3xl mb-3 animate-pulse">⚡</div>
              <div className="text-sm" style={{ color: "#4b5563" }}>
                Loading challenges...
              </div>
            </div>

          ) : rooms.length === 0 ? (
  <div>
    <div className="rounded-2xl p-12 text-center"
      style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="text-5xl mb-4">🏁</div>
      <div className="text-white font-semibold text-lg mb-2">
        No challenges yet!
      </div>
      <div className="text-sm mb-2" style={{ color: "#4b5563" }}>
        You haven't joined or created any challenges.
      </div>
      <div className="text-sm mb-6" style={{ color: "#4b5563" }}>
        Challenge your friends and compete on streaks — privately.
      </div>
      <div className="rounded-xl p-4 mb-6 text-left"
        style={{
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.15)",
        }}>
        <p className="text-xs font-medium mb-2" style={{ color: "#a5b4fc" }}>
          How challenges work:
        </p>
        {[
          "Create a room and pick a habit to compete on",
          "Share your 6-letter invite code with friends",
          "Friends join and add the same habit",
          "Leaderboard ranks everyone by streak — not check-ins",
          "Only room members can see the leaderboard 🔒",
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-2 mb-1.5">
            <span className="text-xs font-bold flex-shrink-0"
              style={{ color: "#6366f1" }}>
              {i + 1}.
            </span>
            <span className="text-xs" style={{ color: "#6b7280" }}>
              {step}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        <button
          type="button"
          onClick={() => setTab("create")}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          🏁 Create Challenge
        </button>
        <button
          type="button"
          onClick={() => setTab("join")}
          className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#9ca3af",
          }}>
          🚪 Join with Code
        </button>
      </div>
    </div>
  </div>

          ) : (
            <div className="flex flex-col gap-3">
              {rooms.map((room) => {
                const left = daysLeft(room.endDate);
                const pct  = Math.round(
                  ((room.duration - left) / room.duration) * 100
                );

                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => fetchRoomLeaderboard(room)}
                    className="rounded-2xl p-5 text-left transition-all hover:border-indigo-500/30"
                    style={{
                      background: "#0d0d16",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}>

                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">
                          {room.name}
                        </div>
                        <div className="text-xs" style={{ color: "#6b7280" }}>
                          Habit: <span style={{ color: "#a5b4fc" }}>
                            {room.habitTitle}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="text-[10px] font-medium mb-1"
                          style={{ color: "#4b5563" }}>
                          Invite Code
                        </div>
                        <div className="text-sm font-bold tracking-widest"
                          style={{ color: "#6366f1" }}>
                          {room.inviteCode}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-[10px] mb-1"
                        style={{ color: "#4b5563" }}>
                        <span>{room.duration - left} days done</span>
                        <span>{left} days left</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                          }} />
                      </div>
                    </div>

                    <div className="text-xs mt-2" style={{ color: "#374151" }}>
                      Tap to view leaderboard →
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CREATE CHALLENGE TAB ── */}
      {tab === "create" && (
        <div className="rounded-2xl p-6"
          style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>

          <h2 className="text-base font-semibold text-white mb-5">
            Create a Challenge Room
          </h2>

          {createError && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#f87171",
                border: "1px solid rgba(239,68,68,0.2)",
              }}>
              {createError}
            </div>
          )}

          {createSuccess && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm"
              style={{
                background: "rgba(34,197,94,0.1)",
                color: "#4ade80",
                border: "1px solid rgba(34,197,94,0.2)",
              }}>
              🎉 {createSuccess}
            </div>
          )}

          {/* Challenge name */}
          <div className="mb-4">
            <label className="block text-xs font-medium mb-2"
              style={{ color: "#9ca3af" }}>
              Challenge Name
            </label>
            <input
              type="text"
              placeholder="e.g. 30-Day Morning Workout"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e5e7eb",
              }}
            />
          </div>

          {/* Habit title */}
          <div className="mb-4">
            <label className="block text-xs font-medium mb-2"
              style={{ color: "#9ca3af" }}>
              Habit to Compete On
            </label>
            <input
              type="text"
              placeholder="e.g. Morning Workout"
              value={createHabit}
              onChange={(e) => setCreateHabit(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e5e7eb",
              }}
            />
            <p className="text-xs mt-1.5" style={{ color: "#4b5563" }}>
              Must match a habit title you and your friends have added
            </p>
          </div>

          {/* Duration */}
          <div className="mb-6">
            <label className="block text-xs font-medium mb-2"
              style={{ color: "#9ca3af" }}>
              Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[7, 14, 30, 90].map((d) => {
                const active = createDuration === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setCreateDuration(d)}
                    className="py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: active
                        ? "rgba(99,102,241,0.15)"
                        : "rgba(255,255,255,0.03)",
                      border: active
                        ? "1px solid rgba(99,102,241,0.35)"
                        : "1px solid rgba(255,255,255,0.07)",
                      color: active ? "#a5b4fc" : "#6b7280",
                    }}>
                    {d} days
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            {creating ? "Creating..." : "🏁 Create Challenge"}
          </button>
        </div>
      )}

      {/* ── JOIN CHALLENGE TAB ── */}
      {tab === "join" && (
        <div className="rounded-2xl p-6"
          style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>

          <h2 className="text-base font-semibold text-white mb-2">
            Join a Challenge
          </h2>
          <p className="text-sm mb-6" style={{ color: "#4b5563" }}>
            Enter the 6-letter invite code your friend shared with you.
          </p>

          {joinError && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#f87171",
                border: "1px solid rgba(239,68,68,0.2)",
              }}>
              {joinError}
            </div>
          )}

          {joinSuccess && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm"
              style={{
                background: "rgba(34,197,94,0.1)",
                color: "#4ade80",
                border: "1px solid rgba(34,197,94,0.2)",
              }}>
              🎉 {joinSuccess}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-xs font-medium mb-2"
              style={{ color: "#9ca3af" }}>
              Invite Code
            </label>
            <input
              type="text"
              placeholder="e.g. X7K2AB"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none tracking-widest font-bold text-center"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#6366f1",
                fontSize: "18px",
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleJoin}
            disabled={joining || joinCode.length < 6}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            {joining ? "Joining..." : "🚪 Join Challenge"}
          </button>

          <div className="mt-6 rounded-xl p-4"
            style={{
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.15)",
            }}>
            <p className="text-xs font-medium mb-2" style={{ color: "#a5b4fc" }}>
              How it works:
            </p>
            {[
              "Get a 6-letter code from your friend",
              "Enter it above and click Join",
              "Make sure you have the same habit added",
              "Compete on streak — highest wins!",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2 mb-1">
                <span className="text-xs font-bold flex-shrink-0"
                  style={{ color: "#6366f1" }}>
                  {i + 1}.
                </span>
                <span className="text-xs" style={{ color: "#6b7280" }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}