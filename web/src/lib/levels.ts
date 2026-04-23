export const LEVELS = [
  { level: 1, name: "Rookie",   emoji: "⭐", min: 0,    max: 100,  color: "#8899cc" },
  { level: 2, name: "Explorer", emoji: "🔥", min: 100,  max: 250,  color: "#44cc88" },
  { level: 3, name: "Achiever", emoji: "⚡", min: 250,  max: 500,  color: "#4488ff" },
  { level: 4, name: "Champion", emoji: "🏆", min: 500,  max: 1000, color: "#ff8844" },
  { level: 5, name: "Legend",   emoji: "👑", min: 1000, max: Infinity, color: "#ff44dd" },
] as const;

export type Level = typeof LEVELS[number];

export function getLevel(total: number) {
  let level: Level = LEVELS[0];
  for (const l of LEVELS) {
    if (total >= l.min) level = l;
  }
  const next = LEVELS.find((l) => l.level === level.level + 1) ?? null;
  const progressPct = next
    ? Math.min(100, ((total - level.min) / (next.min - level.min)) * 100)
    : 100;
  return { level, next, progressPct };
}
