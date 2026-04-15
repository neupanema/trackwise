"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  CheckSquare,
  Plus,
  User,
  LogOut,
  Trophy,
  BarChart2,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",   href: "/dashboard",   icon: LayoutDashboard },
  { label: "Habits",      href: "/habits",      icon: CheckSquare },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "History",     href: "/history",     icon: BarChart2 },
  { label: "Profile",     href: "/profile",     icon: User },
];

const allSidebarItems = [
  { label: "Dashboard",   href: "/dashboard",   icon: LayoutDashboard },
  { label: "Habits",      href: "/habits",      icon: CheckSquare },
  { label: "Add Habit",   href: "/add",         icon: Plus },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Profile",     href: "/profile",     icon: User },
  { label: "History",     href: "/history",     icon: BarChart2 },
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
          {allSidebarItems.map(({ label, href, icon: Icon }) => {
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{ background: "rgba(13,13,22,0.97)", borderTop: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-end justify-around px-1 pb-safe">
          {navItems.slice(0, 2).map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className="flex flex-col items-center gap-1 pt-3 pb-3 px-3 relative"
                style={{ minWidth: "56px" }}>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                    style={{ background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }} />
                )}
                <Icon size={19} color={active ? "#a5b4fc" : "#374151"} strokeWidth={active ? 2 : 1.75} />
                <span className="text-[10px] font-medium"
                  style={{ color: active ? "#a5b4fc" : "#374151" }}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Center FAB */}
          <Link href="/add"
            className="flex flex-col items-center -mt-4 pb-2"
            style={{ minWidth: "64px" }}>
            <span className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 4px 20px rgba(99,102,241,0.45)",
              }}>
              <Plus size={22} color="white" strokeWidth={2.5} />
            </span>
            <span className="text-[10px] font-medium mt-1"
              style={{ color: pathname === "/add" ? "#a5b4fc" : "#374151" }}>
              Add
            </span>
          </Link>

          {navItems.slice(2).map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className="flex flex-col items-center gap-1 pt-3 pb-3 px-3 relative"
                style={{ minWidth: "56px" }}>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                    style={{ background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }} />
                )}
                <Icon size={19} color={active ? "#a5b4fc" : "#374151"} strokeWidth={active ? 2 : 1.75} />
                <span className="text-[10px] font-medium"
                  style={{ color: active ? "#a5b4fc" : "#374151" }}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}