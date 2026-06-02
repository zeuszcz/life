import { DOMAINS, DOMAIN_META } from "@/lib/game/constants";
import type { GoalContext, NextGoalContext } from "./types";

const DOMAIN_LINES = DOMAINS.map(
  (d) => `- ${d} — ${DOMAIN_META[d].label} (${DOMAIN_META[d].icon})`,
).join("\n");

export const TASKS_SYSTEM = `Ты — внутриигровой ИИ-наставник в игре про саморазвитие "Life".
Игрок ставит реальную жизненную цель. Разбей ОДНУ цель на 4-7 КОНКРЕТНЫХ,
выполнимых мини-заданий — коротких шагов, которые реально приближают к цели.

Правила:
- Каждое задание — отдельная короткая строка (действие), напр.: "Сделать 3 тренировки на этой неделе".
- Плохо: абстракции вроде "стать лучше". Хорошо: измеримые шаги.
- Двигайся по нарастанию: от простого старта к более сложному.
- Учитывай, сколько времени в неделю готов вкладывать игрок.
- Всё на русском. Верни только список заданий по схеме, без лишнего текста.`;

export const NEXT_GOAL_SYSTEM = `Ты — внутриигровой ИИ-наставник в игре про саморазвитие "Life".
Игрок только что ЗАВЕРШИЛ цель. Предложи следующую логичную цель, развивающую
успех, и разбей её на 4-6 конкретных мини-заданий.

Домены (выбери один):
${DOMAIN_LINES}

Всё на русском. Верни только структуру по схеме.`;

export function buildTasksPrompt(goal: GoalContext): string {
  const lines = [
    `Домен: ${goal.domain} (${DOMAIN_META[goal.domain].label}).`,
    `Цель: ${goal.title}.`,
  ];
  if (goal.currentState) lines.push(`Сейчас: ${goal.currentState}`);
  if (goal.motivation) lines.push(`Зачем: ${goal.motivation}`);
  if (goal.description) lines.push(`Детали: ${goal.description}`);
  lines.push(`Времени в неделю: ~${goal.hoursPerWeek} ч.`);
  lines.push(`Разбей эту цель на 4-7 мини-заданий.`);
  return lines.join("\n");
}

export function buildNextGoalPrompt(ctx: NextGoalContext): string {
  return [
    `Персонаж: ${ctx.characterName}.`,
    `Только что завершена цель: "${ctx.completedGoalTitle}" (домен ${ctx.domain}).`,
    `Предложи следующую цель (домен, название, короткая мотивация) и 4-6 мини-заданий.`,
  ].join("\n");
}

export const GOAL_TASKS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    tasks: {
      type: "array",
      description: "4-7 конкретных мини-заданий (короткие строки-действия).",
      items: { type: "string" },
    },
  },
  required: ["tasks"],
};

export const NEXT_GOAL_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    domain: { type: "string", enum: [...DOMAINS] },
    title: { type: "string" },
    motivation: { type: "string" },
    tasks: { type: "array", items: { type: "string" } },
  },
  required: ["domain", "title", "motivation", "tasks"],
};
