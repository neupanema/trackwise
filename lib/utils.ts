import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStreakTier(days: number) {
  if (days >= 90) return { name: "Immortal",     emoji: "💀" };
  if (days >= 75) return { name: "Supreme",      emoji: "🔱" };
  if (days >= 60) return { name: "Elite",        emoji: "🌟" };
  if (days >= 45) return { name: "Legendary",    emoji: "👑" };
  if (days >= 30) return { name: "Champion",     emoji: "🏆" };
  if (days >= 21) return { name: "Habit Master", emoji: "🚀" };
  if (days >= 15) return { name: "Unstoppable",  emoji: "💎" };
  if (days >= 10) return { name: "God Level",    emoji: "⚡" };
  if (days >= 5)  return { name: "Great",        emoji: "🔥" };
  return           { name: "Seedling",           emoji: "🌱" };
}