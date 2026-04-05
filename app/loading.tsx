export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "#08080f" }}>
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">⚡</div>
        <div className="text-sm" style={{ color: "#4b5563" }}>
          Loading...
        </div>
      </div>
    </div>
  );
}