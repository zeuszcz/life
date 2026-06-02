// Pure progression math. No I/O, fully unit-testable (see progression.test.ts).

/** XP required to advance FROM `level` to `level + 1`. */
export function costForLevel(level: number): number {
  if (level < 1) return 0;
  return Math.floor(60 * Math.pow(level, 1.5));
}

/** Total cumulative XP required to *reach* a given level (level 1 = 0 XP). */
export function xpToReachLevel(level: number): number {
  let total = 0;
  for (let k = 1; k < level; k++) total += costForLevel(k);
  return total;
}

/** The level implied by a total XP amount. */
export function levelFromTotalXp(totalXp: number): number {
  let level = 1;
  // Guard against pathological inputs with an upper bound.
  while (level < 999 && totalXp >= xpToReachLevel(level + 1)) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  /** XP earned inside the current level. */
  current: number;
  /** XP needed to clear the current level. */
  needed: number;
  /** Total XP overall. */
  total: number;
  /** 0..1 fraction toward the next level. */
  fraction: number;
}

export function progress(totalXp: number): LevelProgress {
  const xp = Math.max(0, Math.floor(totalXp));
  const level = levelFromTotalXp(xp);
  const base = xpToReachLevel(level);
  const next = xpToReachLevel(level + 1);
  const needed = next - base;
  const current = xp - base;
  return {
    level,
    current,
    needed,
    total: xp,
    fraction: needed > 0 ? Math.min(1, current / needed) : 0,
  };
}

/**
 * Apply an XP gain to a running total and report whether (and how far) the
 * entity leveled up.
 */
export function applyXp(
  totalXp: number,
  gain: number,
): { totalXp: number; level: number; leveledUp: boolean; levelsGained: number } {
  const before = levelFromTotalXp(totalXp);
  const next = Math.max(0, totalXp + Math.max(0, Math.floor(gain)));
  const after = levelFromTotalXp(next);
  return {
    totalXp: next,
    level: after,
    leveledUp: after > before,
    levelsGained: after - before,
  };
}
