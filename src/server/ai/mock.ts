import { GoalTasksSchema, NextGoalSchema, WeeklyReviewSchema } from "@/lib/zod-schemas";
import { DOMAIN_META } from "@/lib/game/constants";
import type {
  AIProvider,
  GoalContext,
  GoalTasksResult,
  NextGoalContext,
  NextGoalResult,
  WeeklyReviewContext,
  WeeklyReviewResult,
} from "./types";

// Deterministic, offline provider. Lets the whole loop run with no API keys.
export class MockProvider implements AIProvider {
  readonly name = "mock";
  readonly model = "mock-v2";

  async generateGoalTasks(goal: GoalContext): Promise<GoalTasksResult> {
    const t = goal.title.trim();
    const weekly = Math.max(2, Math.min(6, Math.round(goal.hoursPerWeek / 2)));
    return GoalTasksSchema.parse({
      tasks: [
        `Разобраться, с чего начать: «${t}» (20-30 минут)`,
        `Сделать первый маленький шаг к «${t}»`,
        `Заниматься «${t}» ${weekly} раз(а) на этой неделе`,
        `Найти пример или полезный ресурс по теме «${t}»`,
        `Подвести итоги недели по «${t}» и наметить следующий шаг`,
      ],
    });
  }

  async suggestNextGoal(ctx: NextGoalContext): Promise<NextGoalResult> {
    const label = DOMAIN_META[ctx.domain].label;
    return NextGoalSchema.parse({
      domain: ctx.domain,
      title: `Новый уровень в сфере «${label}»`,
      motivation: `Ты завершил «${ctx.completedGoalTitle}» — пора поднять планку.`,
      tasks: [
        `Поставить более амбициозную версию прошлой цели`,
        `Составить план на 2 недели`,
        `Делать ключевое действие 3 раза в неделю`,
        `Отметить прогресс в конце недели`,
      ],
    });
  }

  async reviewWeek(ctx: WeeklyReviewContext): Promise<WeeklyReviewResult> {
    const active = ctx.tasksThisWeek > 0;
    return WeeklyReviewSchema.parse({
      summary: active
        ? `За неделю ты выполнил ${ctx.tasksThisWeek} действий, стрик ${ctx.dayStreak} дн., уровень ${ctx.level}.`
        : `Неделя была спокойной — самое время сделать хотя бы один маленький шаг.`,
      encouragement: active
        ? "Так держать — постоянство решает больше, чем рывки."
        : "Начни с одного действия сегодня — этого достаточно.",
      suggestion:
        ctx.habitsTracked === 0
          ? "Заведи одну простую ежедневную привычку на 2 минуты."
          : "Выбери одну привычку и доведи её стрик до 7 дней.",
    });
  }
}
