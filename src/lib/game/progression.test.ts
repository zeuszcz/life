import { describe, it, expect } from "vitest";
import {
  costForLevel,
  xpToReachLevel,
  levelFromTotalXp,
  progress,
  applyXp,
} from "./progression";

describe("progression math", () => {
  it("level 1 starts at 0 xp", () => {
    expect(xpToReachLevel(1)).toBe(0);
    expect(levelFromTotalXp(0)).toBe(1);
  });

  it("cost increases monotonically with level", () => {
    for (let l = 1; l < 30; l++) {
      expect(costForLevel(l + 1)).toBeGreaterThan(costForLevel(l));
    }
  });

  it("xpToReachLevel is the cumulative sum of costs", () => {
    let sum = 0;
    for (let l = 1; l < 10; l++) {
      expect(xpToReachLevel(l)).toBe(sum);
      sum += costForLevel(l);
    }
    expect(xpToReachLevel(10)).toBe(sum);
  });

  it("levelFromTotalXp matches the thresholds", () => {
    expect(levelFromTotalXp(xpToReachLevel(5))).toBe(5);
    expect(levelFromTotalXp(xpToReachLevel(5) - 1)).toBe(4);
    expect(levelFromTotalXp(xpToReachLevel(5) + 1)).toBe(5);
  });

  it("progress reports a 0..1 fraction within the level", () => {
    const p = progress(xpToReachLevel(3));
    expect(p.level).toBe(3);
    expect(p.current).toBe(0);
    expect(p.fraction).toBe(0);
    expect(p.needed).toBe(costForLevel(3));
  });

  it("applyXp detects level ups", () => {
    const start = xpToReachLevel(2) - 1; // one XP short of level 2
    const res = applyXp(start, 5);
    expect(res.leveledUp).toBe(true);
    expect(res.level).toBe(2);
    expect(res.levelsGained).toBe(1);

    const flat = applyXp(0, 0);
    expect(flat.leveledUp).toBe(false);
    expect(flat.level).toBe(1);
  });

  it("never goes below level 1 or negative xp", () => {
    const res = applyXp(0, -100);
    expect(res.totalXp).toBe(0);
    expect(res.level).toBe(1);
  });
});
