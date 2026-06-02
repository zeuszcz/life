import type { RoadmapResult } from "@/lib/zod-schemas";
import type { Domain } from "@/lib/game/constants";

export interface RoadmapGoal {
  domain: Domain;
  title: string;
  description: string;
  motivation: string;
  currentState: string;
  hoursPerWeek: number;
  targetDate?: string | null;
}

export interface RoadmapInput {
  characterName: string;
  goals: RoadmapGoal[];
}

/** A pluggable roadmap generator. Implemented by Claude, OpenAI and a mock. */
export interface AIProvider {
  readonly name: string;
  readonly model: string;
  generateRoadmap(input: RoadmapInput): Promise<RoadmapResult>;
}
