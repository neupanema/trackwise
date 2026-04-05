import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { goal } = await req.json();

  if (!goal || goal.trim().length < 3) {
    return NextResponse.json(
      { error: "Please describe your goal" },
      { status: 400 }
    );
  }

  const prompt = `You are an expert habit coach helping someone build better habits.

The user's goal is: "${goal}"

Suggest exactly 4 specific, actionable daily habits that will help them achieve this goal.

Respond ONLY with a valid JSON array. No explanation, no markdown, no extra text.
Just the raw JSON array like this:

[
  {
    "title": "Habit name (max 5 words)",
    "category": "one of: Mind, Fitness, Health, Learning, Finance, Other",
    "color": "one of: #6366f1, #22c55e, #06b6d4, #f97316, #ec4899, #eab308, #8b5cf6, #14b8a6",
    "reason": "one sentence why this helps their goal",
    "targetDays": 21
  }
]

Make habits specific not generic.
Bad: "Exercise more"
Good: "Walk 10,000 steps daily"`;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model:       "llama-3.3-70b-versatile",
          messages:    [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens:  500,
        }),
      }
    );

    if (!response.ok) throw new Error("Groq API failed");

    const data    = await response.json();
    const rawText = data.choices?.[0]?.message?.content ?? "";
    const cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const suggestions = JSON.parse(cleaned);
    return NextResponse.json({ suggestions });

  } catch {
    const goalLower = goal.toLowerCase();

    if (goalLower.includes("fit") || goalLower.includes("weight") || goalLower.includes("gym")) {
      return NextResponse.json({
        suggestions: [
          { title: "Walk 10,000 steps",     category: "Fitness", color: "#22c55e", reason: "Daily walking burns calories and boosts mood",      targetDays: 30 },
          { title: "Drink 8 glasses water",  category: "Health",  color: "#06b6d4", reason: "Hydration improves energy and metabolism",         targetDays: 21 },
          { title: "Sleep by 10:30pm",       category: "Health",  color: "#8b5cf6", reason: "Quality sleep speeds up recovery and fat loss",    targetDays: 21 },
          { title: "No junk food after 8pm", category: "Health",  color: "#f97316", reason: "Cutting late snacks reduces daily calorie intake", targetDays: 30 },
        ],
      });
    }

    if (goalLower.includes("study") || goalLower.includes("learn") || goalLower.includes("code")) {
      return NextResponse.json({
        suggestions: [
          { title: "Study 2 hours daily",     category: "Learning", color: "#6366f1", reason: "Consistent study beats cramming every time",       targetDays: 30 },
          { title: "Read 20 pages",           category: "Learning", color: "#f97316", reason: "Daily reading expands knowledge and vocabulary",   targetDays: 21 },
          { title: "No phone while studying", category: "Mind",     color: "#ec4899", reason: "Distraction-free focus doubles retention",         targetDays: 21 },
          { title: "Review notes before bed", category: "Learning", color: "#eab308", reason: "Night review locks info into long term memory",    targetDays: 21 },
        ],
      });
    }

    if (goalLower.includes("money") || goalLower.includes("save") || goalLower.includes("finance")) {
      return NextResponse.json({
        suggestions: [
          { title: "Track daily expenses", category: "Finance", color: "#22c55e", reason: "Awareness of spending is first step to saving",    targetDays: 30 },
          { title: "No impulse purchases", category: "Finance", color: "#6366f1", reason: "Wait 24hrs before any unplanned purchase",         targetDays: 21 },
          { title: "Cook meals at home",   category: "Health",  color: "#f97316", reason: "Home cooking saves hundreds per month",            targetDays: 30 },
          { title: "Save $5 daily",        category: "Finance", color: "#14b8a6", reason: "Small daily savings add up to thousands per year", targetDays: 90 },
        ],
      });
    }

    return NextResponse.json({
      suggestions: [
        { title: "Wake up at 7am",      category: "Mind",     color: "#eab308", reason: "Early rising gives more productive hours daily",     targetDays: 21 },
        { title: "Meditate 10 minutes", category: "Mind",     color: "#8b5cf6", reason: "Daily meditation reduces stress and improves focus", targetDays: 21 },
        { title: "Journal before bed",  category: "Mind",     color: "#6366f1", reason: "Writing clears your mind and tracks progress",       targetDays: 30 },
        { title: "Read 20 pages daily", category: "Learning", color: "#f97316", reason: "Reading builds knowledge and vocabulary every day",  targetDays: 21 },
      ],
    });
  }
}