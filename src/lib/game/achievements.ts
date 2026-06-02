// Achievement catalogue (plain data, no imports) so it can be shared by the
// Prisma seed script and the runtime self-seed in instrumentation.ts.

export interface AchievementSeed {
  key: string;
  title: string;
  description: string;
  icon: string;
  conditionType: "first_quest" | "quests_completed" | "level" | "domain_level" | "gold_earned";
  threshold: number;
  domain: string | null;
}

export const ACHIEVEMENTS: AchievementSeed[] = [
  { key: "first_step", title: "Первый шаг", description: "Выполни свой первый квест", icon: "🥇", conditionType: "first_quest", threshold: 1, domain: null },
  { key: "disciplined", title: "Дисциплина", description: "Выполни 10 квестов", icon: "🔥", conditionType: "quests_completed", threshold: 10, domain: null },
  { key: "machine", title: "Машина", description: "Выполни 50 квестов", icon: "⚙️", conditionType: "quests_completed", threshold: 50, domain: null },
  { key: "level_5", title: "Набираешь обороты", description: "Достигни 5 уровня", icon: "⭐", conditionType: "level", threshold: 5, domain: null },
  { key: "level_10", title: "Ветеран жизни", description: "Достигни 10 уровня", icon: "🏅", conditionType: "level", threshold: 10, domain: null },
  { key: "buff", title: "Качок", description: "Сила 5 уровня", icon: "💪", conditionType: "domain_level", threshold: 5, domain: "fitness" },
  { key: "pro", title: "Профи", description: "Карьера 5 уровня", icon: "💼", conditionType: "domain_level", threshold: 5, domain: "career" },
  { key: "scholar", title: "Эрудит", description: "Знания 5 уровня", icon: "📚", conditionType: "domain_level", threshold: 5, domain: "knowledge" },
  { key: "zen", title: "Дзен", description: "Благополучие 5 уровня", icon: "🧘", conditionType: "domain_level", threshold: 5, domain: "wellbeing" },
  { key: "rich", title: "Богач", description: "Накопи 500 золота", icon: "💰", conditionType: "gold_earned", threshold: 500, domain: null },
];
