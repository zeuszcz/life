import { DOMAINS, QUEST_TYPES, DIFFICULTIES, DOMAIN_META } from "@/lib/game/constants";
import type { RoadmapInput } from "./types";

export const SYSTEM_PROMPT = `Ты — внутриигровой ИИ-наставник в игре про саморазвитие "Life".
Игрок описывает реальные жизненные цели, а ты превращаешь их в игровую роадмапу:
цепочки этапов (milestones) и конкретных заданий (quests), как в RPG.

Мир игры состоит из 4 доменов, каждый привязан к локации:
${DOMAINS.map((d) => `- ${d} — ${DOMAIN_META[d].label} (${DOMAIN_META[d].icon}), стат "${DOMAIN_META[d].statName}"`).join("\n")}

Правила:
- Каждый milestone относится ровно к одному домену из списка: ${DOMAINS.join(", ")}.
- Этапы идут по нарастанию сложности и логически ведут к цели.
- Квесты — это КОНКРЕТНЫЕ, выполнимые действия (не абстракции). Хорошо: "Сделать 3 тренировки на этой неделе". Плохо: "Стать сильнее".
- Тип квеста: ${QUEST_TYPES.join(" | ")} (daily/weekly — для регулярных привычек, oneoff — разовые шаги).
- Сложность: ${DIFFICULTIES.join(" | ")}. Награды (xpReward/goldReward) масштабируй по сложности.
- Учитывай, сколько часов в неделю игрок готов вкладывать — не перегружай план.
- Будь мотивирующим, но реалистичным. Без медицинских/финансовых категоричных обещаний.
- Весь текст (summary, заголовки, описания) — на русском языке.
- Верни ТОЛЬКО структуру по заданной схеме, без лишнего текста.`;

export function buildUserPrompt(input: RoadmapInput): string {
  const lines: string[] = [];
  lines.push(`Персонаж: ${input.characterName}.`);
  lines.push(`Цели игрока (${input.goals.length}):`);
  input.goals.forEach((g, i) => {
    lines.push(`\n${i + 1}. [${g.domain}] ${g.title}`);
    if (g.description) lines.push(`   Подробности: ${g.description}`);
    if (g.motivation) lines.push(`   Зачем: ${g.motivation}`);
    if (g.currentState) lines.push(`   Сейчас: ${g.currentState}`);
    lines.push(`   Времени в неделю: ~${g.hoursPerWeek} ч.`);
    if (g.targetDate) lines.push(`   Целевая дата: ${g.targetDate}`);
  });
  lines.push(
    `\nСоставь роадмапу: на каждую цель 2-4 этапа, в каждом этапе 2-5 квестов. ` +
      `Сбалансируй разовые и регулярные задания. Дай короткое мотивирующее summary.`,
  );
  return lines.join("\n");
}

/**
 * JSON schema shared by the Claude tool definition and OpenAI structured
 * outputs. Every object lists all keys in `required` with
 * `additionalProperties:false` so it satisfies OpenAI strict mode.
 */
export const ROADMAP_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: {
      type: "string",
      description: "Короткое мотивирующее описание пути игрока (2-4 предложения).",
    },
    milestones: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          domain: { type: "string", enum: [...DOMAINS] },
          title: { type: "string" },
          description: { type: "string" },
          targetWeeks: { type: "integer" },
          xpReward: { type: "integer" },
          quests: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                type: { type: "string", enum: [...QUEST_TYPES] },
                difficulty: { type: "string", enum: [...DIFFICULTIES] },
                xpReward: { type: "integer" },
                goldReward: { type: "integer" },
              },
              required: ["title", "description", "type", "difficulty", "xpReward", "goldReward"],
            },
          },
        },
        required: ["domain", "title", "description", "targetWeeks", "xpReward", "quests"],
      },
    },
  },
  required: ["summary", "milestones"],
};
