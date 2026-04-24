import { describe, it, expect } from "vitest";
import { getLevel, thresholdForLevel } from "@/lib/levels";

describe("thresholdForLevel", () => {
  it("level 1 starts at 0", () => expect(thresholdForLevel(1)).toBe(0));
  it("level 2 starts at 100", () => expect(thresholdForLevel(2)).toBe(100));
  it("level 3 starts at 250", () => expect(thresholdForLevel(3)).toBe(250));
  it("level 4 starts at 500", () => expect(thresholdForLevel(4)).toBe(500));
  it("level 5 starts at 1000", () => expect(thresholdForLevel(5)).toBe(1000));
  it("each level beyond 5 requires more points than the last", () => {
    for (let n = 6; n <= 20; n++) {
      expect(thresholdForLevel(n)).toBeGreaterThan(thresholdForLevel(n - 1));
    }
  });
});

describe("getLevel", () => {
  it("returns Rookie at 0 pts", () => {
    const { level, progressPct } = getLevel(0);
    expect(level.name).toBe("Rookie");
    expect(level.level).toBe(1);
    expect(progressPct).toBe(0);
  });

  it("returns Rookie at 99 pts (just before Explorer)", () => {
    const { level } = getLevel(99);
    expect(level.name).toBe("Rookie");
  });

  it("returns Explorer at exactly 100 pts", () => {
    const { level, next } = getLevel(100);
    expect(level.name).toBe("Explorer");
    expect(level.level).toBe(2);
    expect(next.name).toBe("Achiever");
  });

  it("returns Achiever at 250 pts", () => {
    const { level } = getLevel(250);
    expect(level.name).toBe("Achiever");
    expect(level.level).toBe(3);
  });

  it("returns Champion at 500 pts", () => {
    const { level } = getLevel(500);
    expect(level.name).toBe("Champion");
  });

  it("returns Legend at 1000 pts", () => {
    const { level } = getLevel(1000);
    expect(level.name).toBe("Legend");
    expect(level.level).toBe(5);
  });

  it("always returns a next level (no level cap)", () => {
    for (const pts of [0, 500, 1000, 5000, 50000, 999999]) {
      const { level, next } = getLevel(pts);
      expect(next).toBeTruthy();
      expect(next.level).toBeGreaterThan(level.level);
    }
  });

  it("progressPct is always between 0 and 100", () => {
    for (const pts of [0, 1, 99, 100, 999, 1000, 50000]) {
      const { progressPct } = getLevel(pts);
      expect(progressPct).toBeGreaterThanOrEqual(0);
      expect(progressPct).toBeLessThanOrEqual(100);
    }
  });

  it("level number increases as points grow", () => {
    const milestones = [0, 100, 250, 500, 1000, 1800, 5000, 20000];
    for (let i = 1; i < milestones.length; i++) {
      const prev = getLevel(milestones[i - 1]);
      const curr = getLevel(milestones[i]);
      expect(curr.level.level).toBeGreaterThanOrEqual(prev.level.level);
    }
  });

  it("levels beyond 20 get a tier suffix (✦)", () => {
    let pts = 0;
    for (let n = 1; n <= 21; n++) pts = thresholdForLevel(n);
    const { level } = getLevel(pts);
    expect(level.level).toBeGreaterThanOrEqual(21);
    expect(level.name).toContain("✦");
  });

  it("each level has emoji and color fields", () => {
    for (const pts of [0, 500, 1000, 5000]) {
      const { level, next } = getLevel(pts);
      expect(typeof level.emoji).toBe("string");
      expect(typeof level.color).toBe("string");
      expect(typeof next.emoji).toBe("string");
    }
  });
});
