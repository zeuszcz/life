import { DOMAINS, DOMAIN_META } from "@/lib/game/constants";
import type { GoalContext, NextGoalContext, WeeklyReviewContext } from "./types";

const DOMAIN_LINES = DOMAINS.map(
  (d) => `- ${d} — ${DOMAIN_META[d].label} (${DOMAIN_META[d].icon})`,
).join("\n");

export const TASKS_SYSTEM = `Ты — внутриигровой ИИ-наставник в игре про саморазвитие "Life".
Игрок ставит реальную жизненную цель. Разбей ОДНУ цель на 4-7 КОНКРЕТНЫХ,
выполнимых мини-заданий — коротких шагов, которые реально приближают к цели.

Правила:
- Это план на ОДНУ неделю (недельный спринт по цели).
- Каждое задание — отдельная короткая строка (действие), напр.: "Сделать 3 тренировки на этой неделе".
- Плохо: абстракции вроде "стать лучше". Хорошо: измеримые шаги.
- Двигайся по нарастанию: от простого старта к более сложному.
- Если указаны уже выполненные шаги прошлых недель — НЕ повторяй их, продолжай прогресс и повышай планку.
- Учитывай, сколько времени в неделю готов вкладывать игрок.
- Всё на русском. Верни только список заданий по схеме, без лишнего текста.`;

export const NEXT_GOAL_SYSTEM = `Ты — внутриигровой ИИ-наставник в игре про саморазвитие "Life".
Игрок только что ЗАВЕРШИЛ цель. Предложи следующую логичную цель, развивающую
успех, и разбей её на 4-6 конкретных мини-заданий.

Домены (выбери один):
${DOMAIN_LINES}

Всё на русском. Верни только структуру по схеме.`;

export function buildTasksPrompt(goal: GoalContext): string {
  const week = goal.week ?? 1;
  const lines = [
    `Домен: ${goal.domain} (${DOMAIN_META[goal.domain].label}).`,
    `Цель: ${goal.title}.`,
  ];
  if (goal.currentState) lines.push(`Сейчас: ${goal.currentState}`);
  if (goal.motivation) lines.push(`Зачем: ${goal.motivation}`);
  if (goal.description) lines.push(`Детали: ${goal.description}`);
  lines.push(`Времени в неделю: ~${goal.hoursPerWeek} ч.`);
  if (week > 1 && goal.previousTasks && goal.previousTasks.length > 0) {
    lines.push("");
    lines.push(`Это план на НЕДЕЛЮ ${week}. Уже выполнено в прошлые недели:`);
    for (const t of goal.previousTasks.slice(-15)) lines.push(`- ${t}`);
    lines.push(
      `Сгенерируй 4-7 СЛЕДУЮЩИХ шагов на эту неделю: продолжай прогресс, не повторяй сделанное, повышай сложность.`,
    );
  } else {
    lines.push(`Разбей эту цель на 4-7 мини-заданий на первую неделю.`);
  }
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

export const WEEKLY_REVIEW_SYSTEM = `Ты — тёплый ИИ-наставник в игре про саморазвитие "Life".
По сухой статистике за неделю сделай короткий, поддерживающий обзор:
- summary: 1-2 предложения, что произошло за неделю;
- encouragement: 1 предложение искренней поддержки;
- suggestion: ОДИН конкретный шаг на следующую неделю.
Без занудства, без категоричных мед/фин обещаний. На русском. Только структура.`;

export function buildWeeklyReviewPrompt(c: WeeklyReviewContext): string {
  return [
    `Персонаж: ${c.characterName}, уровень ${c.level}.`,
    `За неделю: выполнено заданий/привычек — ${c.tasksThisWeek}; привычек заведено — ${c.habitsTracked};`,
    `лучший стрик привычки — ${c.bestStreak}; дней подряд в игре — ${c.dayStreak}.`,
    `Дай summary, encouragement и одну suggestion.`,
  ].join("\n");
}

export const WEEKLY_REVIEW_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    encouragement: { type: "string" },
    suggestion: { type: "string" },
  },
  required: ["summary", "encouragement", "suggestion"],
};
