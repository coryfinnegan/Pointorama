const TITLES = [
  { name: "Rookie",        emoji: "⭐", color: "#8899cc" },
  { name: "Explorer",      emoji: "🔥", color: "#44cc88" },
  { name: "Achiever",      emoji: "⚡", color: "#4488ff" },
  { name: "Champion",      emoji: "🏆", color: "#ff8844" },
  { name: "Legend",        emoji: "👑", color: "#ff44dd" },
  { name: "Mythic",        emoji: "💫", color: "#aa44ff" },
  { name: "Cosmic",        emoji: "🌌", color: "#44eeff" },
  { name: "Galactic",      emoji: "🚀", color: "#ffd700" },
  { name: "Stellar",       emoji: "💥", color: "#ff0088" },
  { name: "Celestial",     emoji: "🌟", color: "#00ffaa" },
  { name: "Universal",     emoji: "🌈", color: "#ffaa00" },
  { name: "Eternal",       emoji: "♾️",  color: "#cc44ff" },
  { name: "Transcendent",  emoji: "✨", color: "#ddddff" },
  { name: "Omnipotent",    emoji: "🔱", color: "#ff6600" },
  { name: "Infinite",      emoji: "🎆", color: "#44aaff" },
  { name: "Beyond",        emoji: "💎", color: "#00ffff" },
  { name: "Immortal",      emoji: "🛡️",  color: "#ff4444" },
  { name: "Divine",        emoji: "⚜️",  color: "#aaaaff" },
  { name: "Supreme",       emoji: "🌠", color: "#ff8800" },
  { name: "Ultimate",      emoji: "👾", color: "#ff44aa" },
];

export type Level = {
  level: number;
  name: string;
  emoji: string;
  color: string;
  min: number;
  max: number;
};

export type NextLevel = { level: number; name: string; emoji: string; min: number };

// Points needed to START level n (1-indexed).
// Levels 1-5 use fixed thresholds; beyond that, each gap grows ~1.6×.
export function thresholdForLevel(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 100;
  if (n === 3) return 250;
  if (n === 4) return 500;
  if (n === 5) return 1000;
  return thresholdForLevel(n - 1) + Math.floor(800 * Math.pow(1.6, n - 6));
}

function titleForLevel(n: number) {
  const idx = (n - 1) % TITLES.length;
  const tier = Math.floor((n - 1) / TITLES.length);
  const base = TITLES[idx];
  return { ...base, name: tier > 0 ? `${base.name} ${"✦".repeat(tier)}` : base.name };
}

export function getLevel(total: number): { level: Level; next: NextLevel; progressPct: number } {
  let n = 1;
  while (thresholdForLevel(n + 1) <= total) n++;

  const min    = thresholdForLevel(n);
  const nextN  = n + 1;
  const nextMin = thresholdForLevel(nextN);
  const t      = titleForLevel(n);
  const nt     = titleForLevel(nextN);

  return {
    level: { level: n, name: t.name, emoji: t.emoji, color: t.color, min, max: nextMin },
    next:  { level: nextN, name: nt.name, emoji: nt.emoji, min: nextMin },
    progressPct: Math.min(100, ((total - min) / (nextMin - min)) * 100),
  };
}
