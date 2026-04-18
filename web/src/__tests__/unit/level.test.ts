import { describe, it, expect } from "vitest";
import { getLevel, LEVELS } from "@/lib/levels";

describe("getLevel", () => {
  it("returns Rookie for 0 points with 0% progress", () => {
    const { level, next, progressPct } = getLevel(0);
    expect(level.name).toBe("Rookie");
    expect(next?.name).toBe("Explorer");
    expect(progressPct).toBe(0);
  });

  it("returns Rookie for 99 points at 99% progress", () => {
    const { level, progressPct } = getLevel(99);
    expect(level.name).toBe("Rookie");
    expect(progressPct).toBe(99);
  });

  it("returns Explorer at exactly 100 points with 0% progress", () => {
    const { level, next, progressPct } = getLevel(100);
    expect(level.name).toBe("Explorer");
    expect(next?.name).toBe("Achiever");
    expect(progressPct).toBe(0);
  });

  it("returns Explorer midway at 175 points (50% to Achiever)", () => {
    const { level, progressPct } = getLevel(175);
    expect(level.name).toBe("Explorer");
    expect(progressPct).toBeCloseTo(50);
  });

  it("returns Achiever at exactly 250 points", () => {
    const { level } = getLevel(250);
    expect(level.name).toBe("Achiever");
  });

  it("returns Champion at exactly 500 points", () => {
    const { level } = getLevel(500);
    expect(level.name).toBe("Champion");
  });

  it("returns Legend at exactly 1000 points with no next level", () => {
    const { level, next, progressPct } = getLevel(1000);
    expect(level.name).toBe("Legend");
    expect(next).toBeNull();
    expect(progressPct).toBe(100);
  });

  it("caps progressPct at 100 even for huge totals", () => {
    const { level, progressPct } = getLevel(99999);
    expect(level.name).toBe("Legend");
    expect(progressPct).toBe(100);
  });

  it("each LEVELS entry has the expected emoji", () => {
    expect(LEVELS[0].emoji).toBe("⭐");
    expect(LEVELS[4].emoji).toBe("👑");
  });
});
