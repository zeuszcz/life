import { DIFFICULTY_REWARDS, type Difficulty } from "@/lib/game/constants";
import { RoadmapResultSchema, type RoadmapResult } from "@/lib/zod-schemas";
import type { AIProvider, RoadmapInput } from "./types";

// Deterministic, offline roadmap generator. Lets the whole app run end-to-end
// with no API keys. Output mirrors the shape real providers must return.
export class MockProvider implements AIProvider {
  readonly name = "mock";
  readonly model = "mock-v1";

  async generateRoadmap(input: RoadmapInput): Promise<RoadmapResult> {
    const milestones = input.goals.flatMap((goal) => {
      const stages = [
        { suffix: "— старт", weeks: 2, diff: "easy" as Difficulty },
        { suffix: "— набор формы", weeks: 4, diff: "medium" as Difficulty },
        { suffix: "— рывок", weeks: 6, diff: "hard" as Difficulty },
      ];
      return stages.map((stage, idx) => ({
        domain: goal.domain,
        title: `${goal.title} ${stage.suffix}`,
        description:
          idx === 0
            ? `Заложи фундамент для цели «${goal.title}». Маленькие регулярные шаги.`
            : `Продолжай двигаться к цели «${goal.title}». Повышай нагрузку.`,
        targetWeeks: stage.weeks,
        xpReward: 80 + idx * 60,
        quests: buildQuests(goal.title, stage.diff, goal.hoursPerWeek),
      }));
    });

    const result: RoadmapResult = {
      summary:
        `${input.characterName}, твой путь разбит на этапы. Выполняй квесты в локациях, ` +
        `качай статы и двигайся к целям — шаг за шагом. Удачи!`,
      milestones,
    };
    return RoadmapResultSchema.parse(result);
  }
}

function buildQuests(goalTitle: string, difficulty: Difficulty, hoursPerWeek: number) {
  const reward = DIFFICULTY_REWARDS[difficulty];
  const weeklyTarget = Math.max(2, Math.min(6, Math.round(hoursPerWeek / 2)));
  return [
    {
      title: `Сделать первый шаг к «${goalTitle}»`,
      description: "Разовое действие, чтобы сдвинуться с места.",
      type: "oneoff" as const,
      difficulty,
      xpReward: reward.xp,
      goldReward: reward.gold,
    },
    {
      title: `Ежедневная привычка ради «${goalTitle}»`,
      description: "Небольшое действие каждый день. Главное — регулярность.",
      type: "daily" as const,
      difficulty: "easy" as Difficulty,
      xpReward: DIFFICULTY_REWARDS.easy.xp,
      goldReward: DIFFICULTY_REWARDS.easy.gold,
    },
    {
      title: `Недельный челлендж: ${weeklyTarget} подхода`,
      description: `Сделай ${weeklyTarget} целевых действий за неделю.`,
      type: "weekly" as const,
      difficulty: "medium" as Difficulty,
      xpReward: DIFFICULTY_REWARDS.medium.xp,
      goldReward: DIFFICULTY_REWARDS.medium.gold,
    },
  ];
}
