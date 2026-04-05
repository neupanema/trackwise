"use client";

const TOTAL_DAYS = 365;

function getDayOfYear(): number {
  const now       = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now.getTime() - yearStart.getTime()) / 86400000) + 1;
}

export default function YearProgress() {
  const currentYear = new Date().getFullYear();
  const passed      = getDayOfYear();
  const left        = TOTAL_DAYS - passed;
  const pct         = Math.round((passed / TOTAL_DAYS) * 100);

  return (
    <div className="rounded-2xl p-5 mb-5"
      style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold text-white">
          📅 {currentYear} — Year Progress
        </div>
        <div className="text-sm font-bold" style={{ color: "#6366f1" }}>
          {pct}% complete
        </div>
      </div>

      {/* Dots grid — 365 circles */}
      <div className="flex flex-wrap gap-[3px] mb-4">
        {Array.from({ length: TOTAL_DAYS }).map((_, i) => {
          const dayNum  = i + 1;
          const isPast  = dayNum < passed;
          const isToday = dayNum === passed;
          const isFuture = dayNum > passed;

          return (
            <div
              key={i}
              title={`Day ${dayNum} of ${currentYear}`}
              className="w-[9px] h-[9px] rounded-full transition-all"
              style={{
                background: isPast
                  ? "#6366f1"
                  : isToday
                  ? "#a78bfa"
                  : "rgba(255,255,255,0.07)",
                boxShadow: isToday
                  ? "0 0 0 2px #6366f1, 0 0 0 3px #0d0d16"
                  : "none",
              }}
            />
          );
        })}
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <div className="text-xs" style={{ color: "#4b5563" }}>
            Passed:{" "}
            <span className="font-semibold" style={{ color: "#e5e7eb" }}>
              {passed} days
            </span>
          </div>
          <div className="text-xs" style={{ color: "#4b5563" }}>
            Remaining:{" "}
            <span className="font-semibold" style={{ color: "#e5e7eb" }}>
              {left} days
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
            <span className="text-[10px]" style={{ color: "#4b5563" }}>Passed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
            <span className="text-[10px]" style={{ color: "#4b5563" }}>Remaining</span>
          </div>
        </div>
      </div>
    </div>
  );
}