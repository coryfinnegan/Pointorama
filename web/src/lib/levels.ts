export const LEVELS = [
  { level: 1, name: "ROOKIE",     min: 0,    max: 150,      color: "#8899cc" },
  { level: 2, name: "ADVENTURER", min: 150,  max: 400,      color: "#44cc88" },
  { level: 3, name: "HERO",       min: 400,  max: 900,      color: "#4488ff" },
  { level: 4, name: "CHAMPION",   min: 900,  max: 2000,     color: "#ff8844" },
  { level: 5, name: "LEGEND",     min: 2000, max: 4500,     color: "#ff44dd" },
  { level: 6, name: "MYTHIC",     min: 4500, max: Infinity, color: "#ffd700" },
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
