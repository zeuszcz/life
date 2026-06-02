import type { Domain } from "@/lib/game/constants";

export interface DomainStat {
  value: number;
  level: number;
}

/** Serializable snapshot of a character's progression, shared by server + client. */
export interface PlayState {
  characterName: string;
  level: number;
  xp: number; // total accumulated
  xpInLevel: number;
  xpForLevel: number;
  gold: number;
  stats: Record<Domain, DomainStat>;
  tasksCompleted: number;
}
