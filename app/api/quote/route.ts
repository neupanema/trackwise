import { NextResponse } from "next/server";

// backup quotes if all APIs fail
const FALLBACK_QUOTES = [
  { content: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { content: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { content: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { content: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { content: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { content: "Great things never come from comfort zones.", author: "Unknown" },
  { content: "Dream it. Wish it. Do it.", author: "Unknown" },
  { content: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
  { content: "The key to success is to focus on goals, not obstacles.", author: "Unknown" },
  { content: "Small daily improvements are the key to staggering long-term results.", author: "Unknown" },
  { content: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { content: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { content: "What you get by achieving your goals is not as important as what you become.", author: "Thoreau" },
  { content: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { content: "Act as if what you do makes a difference. It does.", author: "William James" },
];

function getRandomFallback() {
  return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
}

export async function GET() {
  // Try API 1 — quotable.io
  try {
    const res = await fetch(
      "https://api.quotable.io/quotes/random?tags=success,inspirational&limit=1",
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(3000), // timeout after 3 seconds
      }
    );

    if (res.ok) {
      const data = await res.json();
      // quotable returns an array
      const quote = Array.isArray(data) ? data[0] : data;
      if (quote?.content && quote?.author) {
        return NextResponse.json({
          content: quote.content,
          author:  quote.author,
        });
      }
    }
  } catch {
    // API 1 failed, try next
  }

  // Try API 2 — zenquotes.io
  try {
    const res = await fetch(
      "https://zenquotes.io/api/random",
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(3000),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const quote = Array.isArray(data) ? data[0] : data;
      if (quote?.q && quote?.a) {
        return NextResponse.json({
          content: quote.q,  // zenquotes uses "q" for quote
          author:  quote.a,  // zenquotes uses "a" for author
        });
      }
    }
  } catch {
    // API 2 failed too, use fallback
  }

  // Both APIs failed → use random fallback from our list
  return NextResponse.json(getRandomFallback());
}