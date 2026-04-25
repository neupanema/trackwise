"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";


export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex bg-[#0a0a0f]">

      {/* LEFT SIDE */}
      <div className="hidden lg:flex w-[45%] bg-[#0f0f1a] flex-col justify-between p-14 relative overflow-hidden border-r border-white/5">
        <div className="absolute w-72 h-72 rounded-full top-[-80px] left-[-80px]"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />
        <div className="absolute w-48 h-48 rounded-full bottom-10 right-[-40px]"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)" }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            ⚡
          </div>
          <span className="text-white font-bold text-xl tracking-tight">TrackWise</span>
        </div>

        {/* Middle content */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4 tracking-tight">
            Build habits that{" "}
            <span style={{
              background: "linear-gradient(90deg, #6366f1, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              actually stick.
            </span>
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Track your daily progress, earn streaks, and become
            the best version of yourself.
          </p>

          {/* Streak tier cards */}
          <div className="flex flex-col gap-3">
            {[
              { icon: "🔥", name: "On Fire",      days: "5–7 day streak",   badge: "Active",  bg: "rgba(251,146,60,0.15)",  text: "#fb923c" },
              { icon: "💎", name: "Diamond",      days: "10–14 day streak", badge: "Rare",    bg: "rgba(99,102,241,0.15)",  text: "#818cf8" },
              { icon: "👑", name: "Legend",       days: "30–59 day streak", badge: "Elite",   bg: "rgba(250,204,21,0.15)",  text: "#fbbf24" },
            ].map((s) => (
              <div key={s.name}
                className="flex items-center gap-3 rounded-xl p-3 border border-white/5"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: s.bg }}>
                  {s.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-200">{s.name}</div>
                  <div className="text-xs text-gray-600">{s.days}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ background: s.bg, color: s.text }}>
                  {s.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-700 relative z-10">
          © 2026 TrackWise. All rights reserved.
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0d0d14]">
        <div className="w-full max-w-md">

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Welcome back 👋
            </h1>
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link href="/signup"
                className="text-indigo-400 font-medium hover:text-indigo-300">
                Sign up
              </Link>
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm text-gray-200 placeholder-gray-700 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm text-gray-200 placeholder-gray-700 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                required
              />
            </div>

            <div className="text-right">
              <a href="#"
                className="text-xs text-indigo-400 hover:text-indigo-300">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-medium text-sm transition-opacity disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              {loading ? "Logging in..." : "Login to TrackWise"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-gray-700">or continue with</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <button
  type="button"
  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
  className="w-full py-3 rounded-xl text-sm text-gray-400 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
  style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
  Continue with Google
</button>
          <p className="text-center text-xs text-gray-700 mt-6 leading-relaxed">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}