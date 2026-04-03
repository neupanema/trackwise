"use client";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [darkMode,      setDarkMode]      = useState(false);
  const [reminders,     setReminders]     = useState(false);
  const [streakAlerts,  setStreakAlerts]  = useState(true);
  const [name,          setName]          = useState("");
  const [email,         setEmail]         = useState("");
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [avatar,        setAvatar]        = useState<string | null>(null);
  const [uploading,     setUploading]     = useState(false);
  const [stats,         setStats]         = useState({
    totalHabits: 0, bestStreak: 0, totalDays: 0,
  });

  // ref to hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("darkMode") === "true";
    setDarkMode(stored);
    if (stored) document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? "");
      setEmail(session.user.email ?? "");
      setAvatar(session.user.image ?? null);
    }
  }, [session]);

  useEffect(() => {
    async function fetchStats() {
      const res = await fetch("/api/habits");
      const data = await res.json();
      const habits = data.habits ?? [];
      const bestStreak = habits.length > 0
        ? Math.max(...habits.map((h: any) => h.streak ?? 0)) : 0;
      const totalDays = habits.reduce(
        (s: number, h: any) => s + (h.streak ?? 0), 0
      );
      setStats({ totalHabits: habits.length, bestStreak, totalDays });
    }
    fetchStats();
  }, []);

  // ── Handle image file selected ──
  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2MB");
      return;
    }

    // check file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Only JPG, PNG or WEBP images allowed");
      return;
    }

    setUploading(true);

    // convert file to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;

      // show preview immediately
      setAvatar(base64);

      // upload to server
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          fileType: file.type,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Upload failed: " + data.error);
        setAvatar(session?.user?.image ?? null);
      } else {
        setAvatar(data.imageUrl);
      }

      setUploading(false);
    };

    reader.readAsDataURL(file);
  }

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you sure? This will permanently delete your account and ALL your habits."
    );
    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      "Last chance! Are you 100% sure?"
    );
    if (!doubleConfirm) return;

    setDeleting(true);

    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (!res.ok) {
        alert("Something went wrong. Please try again.");
        setDeleting(false);
        return;
      }
      await signOut({ callbackUrl: "/login" });
    } catch {
      alert("Network error. Please try again.");
      setDeleting(false);
    }
  }

  const getTier = (streak: number) => {
    if (streak >= 90) return { name: "Immortal",     emoji: "💀" };
    if (streak >= 75) return { name: "Supreme",      emoji: "🔱" };
    if (streak >= 60) return { name: "Elite",        emoji: "🌟" };
    if (streak >= 45) return { name: "Legendary",    emoji: "👑" };
    if (streak >= 30) return { name: "Champion",     emoji: "🏆" };
    if (streak >= 21) return { name: "Habit Master", emoji: "🚀" };
    if (streak >= 15) return { name: "Unstoppable",  emoji: "💎" };
    if (streak >= 10) return { name: "God Level",    emoji: "⚡" };
    if (streak >= 5)  return { name: "Great",        emoji: "🔥" };
    return             { name: "Seedling",           emoji: "🌱" };
  };

  const tier = getTier(stats.bestStreak);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen"
        style={{ background: "#08080f" }}>
        <div className="text-center">
          <div className="text-3xl mb-3">⚡</div>
          <div className="text-sm" style={{ color: "#4b5563" }}>
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  const card = "rounded-2xl p-5 sm:p-6 w-full";
  const cardStyle = { background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" };
  const sectionLabel = "text-[10px] font-semibold tracking-widest uppercase mb-4";

  return (
    <div className="p-4 sm:p-8 w-full max-w-3xl mx-auto">

      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
          Profile ⚙️
        </h1>
        <p className="text-sm" style={{ color: "#4b5563" }}>
          Manage your account and preferences.
        </p>
      </div>

      <div className="flex flex-col gap-4">

        {/* ── User card ── */}
        <div className={card} style={cardStyle}>
          <div className={sectionLabel} style={{ color: "#374151" }}>Account</div>

          <div className="flex items-center gap-3 sm:gap-4 mb-4">

            {/* ── AVATAR WITH UPLOAD ── */}
            <div className="relative flex-shrink-0">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                style={{ border: "2px solid rgba(99,102,241,0.3)" }}>

                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                    {name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ background: "rgba(0,0,0,0.5)" }}
                  onClick={() => fileInputRef.current?.click()}>
                  <span style={{ fontSize: "16px" }}>📷</span>
                </div>
              </div>

              {/* Upload spinner */}
              {uploading && (
                <div className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.6)" }}>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm sm:text-base font-semibold text-white mb-0.5 truncate">
                {name || session?.user?.name || "—"}
              </div>
              <div className="text-xs truncate mb-2" style={{ color: "#6b7280" }}>
                {email || session?.user?.email || "—"}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs px-3 py-1 rounded-lg transition-all disabled:opacity-50"
                style={{
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  color: "#a5b4fc",
                }}>
                {uploading ? "Uploading..." : "📷 Change Photo"}
              </button>
            </div>
          </div>

          {/* Tier badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", color: "#a5b4fc" }}>
            {tier.emoji} {tier.name} · {stats.bestStreak} day streak
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: stats.totalHabits, label: "Total Habits" },
              { val: stats.bestStreak,  label: "Best Streak"  },
              { val: stats.totalDays,   label: "Days Tracked" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-2.5 sm:p-3 text-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="text-lg sm:text-xl font-bold text-white mb-0.5">
                  {s.val}
                </div>
                <div className="text-[10px]" style={{ color: "#4b5563" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Edit Profile + Preferences ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className={card} style={cardStyle}>
            <div className={sectionLabel} style={{ color: "#374151" }}>Edit Profile</div>

            <label className="block text-xs mb-1.5" style={{ color: "#6b7280" }}>
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e5e7eb",
              }}
            />

            <label className="block text-xs mb-1.5" style={{ color: "#6b7280" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-4"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e5e7eb",
              }}
            />

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <div className={card} style={cardStyle}>
            <div className={sectionLabel} style={{ color: "#374151" }}>Preferences</div>

            {[
              { label: "Dark Mode",      sub: "Use dark theme",            value: darkMode,     toggle: toggleDarkMode                      },
              { label: "Daily Reminder", sub: "Remind me to check in",     value: reminders,    toggle: () => setReminders(!reminders)      },
              { label: "Streak Alerts",  sub: "Alert when streak at risk",  value: streakAlerts, toggle: () => setStreakAlerts(!streakAlerts) },
            ].map((item) => (
              <div key={item.label}
                className="flex items-center justify-between py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="min-w-0 pr-3">
                  <div className="text-sm font-medium" style={{ color: "#e5e7eb" }}>
                    {item.label}
                  </div>
                  <div className="text-xs" style={{ color: "#4b5563" }}>
                    {item.sub}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={item.toggle}
                  className="relative w-10 h-[22px] rounded-full transition-all flex-shrink-0"
                  style={{ background: item.value ? "#6366f1" : "rgba(255,255,255,0.08)" }}>
                  <div className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: item.value ? "21px" : "3px" }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Danger zone ── */}
        <div className={card} style={cardStyle}>
          <div className={sectionLabel} style={{ color: "#374151" }}>Danger Zone</div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full py-3 px-4 rounded-xl text-sm font-medium text-left transition-all"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#9ca3af",
              }}>
              ↪ Sign Out
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full py-3 px-4 rounded-xl text-sm font-medium text-left transition-all disabled:opacity-50"
              style={{
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#f87171",
              }}>
              {deleting
                ? "Deleting everything..."
                : "🗑 Delete Account — this cannot be undone"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}