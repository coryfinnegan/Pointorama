export const LEVELS = [
  { name: "Rookie",   emoji: "⭐",  min: 0    },
  { name: "Explorer", emoji: "🌟",  min: 100  },
  { name: "Achiever", emoji: "🏅",  min: 250  },
  { name: "Champion", emoji: "🏆",  min: 500  },
  { name: "Legend",   emoji: "👑",  min: 1000 },
] as const;

export type Level = typeof LEVELS[number];

export function getLevel(total: number) {
  let level: Level = LEVELS[0];
  for (const l of LEVELS) {
    if (total >= l.min) level = l;
  }
  const idx = LEVELS.indexOf(level);
  const next = LEVELS[idx + 1] ?? null;
  const progressPct = next
    ? Math.min(100, ((total - level.min) / (next.min - level.min)) * 100)
    : 100;
  return { level, next, progressPct };
}
