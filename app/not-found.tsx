import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "#08080f" }}>
      <div className="text-center">
        <div className="text-6xl mb-4">🌱</div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Page not found
        </h1>
        <p className="text-sm mb-6" style={{ color: "#4b5563" }}>
          This page doesn't exist or was moved.
        </p>
        <Link href="/dashboard"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white inline-block"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}