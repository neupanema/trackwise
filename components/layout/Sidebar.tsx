"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  CheckSquare,
  PlusCircle,
  User,
  LogOut,
  Trophy, // ← add this
} from "lucide-react";

const navItems = [
  { label: "Dashboard",   href: "/dashboard",   icon: LayoutDashboard },
  { label: "Habits",      href: "/habits",      icon: CheckSquare },
  { label: "Add Habit",   href: "/add",         icon: PlusCircle },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy }, // ← added
  { label: "Profile",     href: "/profile",     icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex w-[240px] flex-shrink-0 flex-col h-screen sticky top-0"
        style={{ background: "#0d0d16", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="w-8 h-8 rounded-[9px] flex items-center justify-center text-base flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>⚡</div>
          <span className="text-white font-bold text-lg tracking-tight">TrackWise</span>
        </div>

        <div className="px-6 mb-2 text-[10px] font-medium tracking-widest uppercase"
          style={{ color: "#374151" }}>Menu</div>

        <nav className="flex flex-col gap-0.5 px-3">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-all"
                style={{
                  background: active ? "rgba(99,102,241,0.15)" : "transparent",
                  border: active ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
                }}>
                <Icon size={17} color={active ? "#a5b4fc" : "#4b5563"} />
                <span className="text-sm"
                  style={{ color: active ? "#a5b4fc" : "#6b7280", fontWeight: active ? 500 : 400 }}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom user card */}
        <div className="mt-auto px-3 pb-6">
          <div className="flex items-center gap-2.5 p-3 rounded-[10px]"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
  style={{ border: "1px solid rgba(99,102,241,0.3)" }}>
  {session?.user?.image ? (
    <img
      src={session.user.image}
      alt="avatar"
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white"
      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
      {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
    </div>
  )}
</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: "#e5e7eb" }}>
                {session?.user?.name ?? "User"}
              </div>
              <div className="text-[11px]" style={{ color: "#4b5563" }}>🔥 On Fire</div>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex-shrink-0 opacity-40 hover:opacity-70 transition-opacity cursor-pointer">
              <LogOut size={15} color="#9ca3af" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
        style={{ background: "#0d0d16", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
              style={{ minWidth: "60px" }}>
              <Icon size={20} color={active ? "#a5b4fc" : "#4b5563"} />
              <span className="text-[10px]"
                style={{ color: active ? "#a5b4fc" : "#4b5563", fontWeight: active ? 500 : 400 }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}