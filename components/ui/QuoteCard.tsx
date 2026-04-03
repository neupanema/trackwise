"use client";
import { useEffect, useState } from "react";

interface Quote {
  content: string;
  author:  string;
}

export default function QuoteCard() {
  const [quote,   setQuote]   = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchQuote() {
    setLoading(true);
    try {
      // add timestamp to bypass cache and get fresh quote
      const res  = await fetch(`/api/quote?t=${Date.now()}`);
      const data = await res.json();
      setQuote(data);
    } catch {
      setQuote({
        content: "Small daily improvements are the key to staggering long-term results.",
        author:  "Robin Sharma",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuote();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl p-5 mb-5"
        style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="text-xl animate-pulse">💭</div>
          <div className="flex-1">
            <div className="h-3 rounded-full mb-2 w-3/4 animate-pulse"
              style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-2 rounded-full w-1/4 animate-pulse"
              style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="rounded-2xl p-5 mb-5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
        border: "1px solid rgba(99,102,241,0.2)",
      }}>

      {/* Decorative quote mark */}
      <div className="absolute top-3 right-4 text-6xl font-serif leading-none select-none"
        style={{ color: "rgba(99,102,241,0.1)" }}>
        "
      </div>

      <div className="flex items-start gap-3 relative z-10">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "rgba(99,102,241,0.15)" }}>
          <span style={{ fontSize: "16px" }}>✨</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed mb-2 italic"
            style={{ color: "#d1d5db" }}>
            "{quote.content}"
          </p>
          <p className="text-xs font-medium" style={{ color: "#6366f1" }}>
            — {quote.author}
          </p>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={fetchQuote}
          className="flex-shrink-0 opacity-40 hover:opacity-80 transition-opacity mt-0.5"
          title="Get new quote">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M8 16H3v5"/>
          </svg>
        </button>
      </div>
    </div>
  );
}