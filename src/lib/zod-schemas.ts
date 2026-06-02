import { z } from "zod";
import { DOMAINS, QUEST_TYPES, DIFFICULTIES } from "@/lib/game/constants";
import { SKINS, HAIR_STYLES, HAIR_COLORS, SHIRTS, PANTS, SHOES } from "@/lib/game/avatar";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const RegisterSchema = z.object({
  email: z.string().email("Введите корректный email"),
  name: z.string().trim().min(1, "Введите имя").max(40).optional().or(z.literal("")),
  password: z.string().min(8, "Минимум 8 символов").max(100),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Character
// ---------------------------------------------------------------------------
// LPC-based modular appearance. `.default().catch()` keeps old/garbage values
// from crashing reads — they gracefully fall back to a valid default.
export const AppearanceSchema = z.object({
  skin: z.enum(SKINS).default("light").catch("light"),
  hairStyle: z.enum(HAIR_STYLES).default("plain").catch("plain"),
  hairColor: z.enum(HAIR_COLORS).default("dark_brown").catch("dark_brown"),
  shirt: z.enum(SHIRTS).default("blue").catch("blue"),
  pants: z.enum(PANTS).default("navy").catch("navy"),
  shoes: z.enum(SHOES).default("brown").catch("brown"),
});
export type Appearance = z.infer<typeof AppearanceSchema>;

export const CharacterCreateSchema = z.object({
  name: z.string().trim().min(1, "Введите имя персонажа").max(24),
  appearance: AppearanceSchema,
});
export type CharacterCreateInput = z.infer<typeof CharacterCreateSchema>;

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------
export const GoalInputSchema = z.object({
  domain: z.enum(DOMAINS),
  title: z.string().trim().min(3, "Слишком коротко").max(120),
  description: z.string().trim().max(1000).default(""),
  motivation: z.string().trim().max(1000).default(""),
  currentState: z.string().trim().max(1000).default(""),
  hoursPerWeek: z.coerce.number().int().min(1).max(80).default(3),
  targetDate: z.string().optional(),
});
export type GoalInput = z.infer<typeof GoalInputSchema>;

export const GoalsSubmitSchema = z.object({
  goals: z.array(GoalInputSchema).min(1, "Добавьте хотя бы одну цель").max(8),
});
export type GoalsSubmitInput = z.infer<typeof GoalsSubmitSchema>;

// ---------------------------------------------------------------------------
// AI roadmap output (validated after the model responds)
// ---------------------------------------------------------------------------
export const AIQuestSchema = z.object({
  title: z.string().min(2).max(140),
  description: z.string().max(500).default(""),
  type: z.enum(QUEST_TYPES).default("oneoff"),
  difficulty: z.enum(DIFFICULTIES).default("medium"),
  xpReward: z.coerce.number().int().min(1).max(500).default(20),
  goldReward: z.coerce.number().int().min(0).max(200).default(5),
});

export const AIMilestoneSchema = z.object({
  domain: z.enum(DOMAINS),
  title: z.string().min(2).max(140),
  description: z.string().max(800).default(""),
  targetWeeks: z.coerce.number().int().min(1).max(104).default(4),
  xpReward: z.coerce.number().int().min(1).max(2000).default(100),
  quests: z.array(AIQuestSchema).min(1).max(8),
});

export const RoadmapResultSchema = z.object({
  summary: z.string().max(1500).default(""),
  milestones: z.array(AIMilestoneSchema).min(1).max(24),
});
export type RoadmapResult = z.infer<typeof RoadmapResultSchema>;

// ---------------------------------------------------------------------------
// Shop / real-life logging
// ---------------------------------------------------------------------------
export const BuyItemSchema = z.object({ itemKey: z.string().min(1) });

export const LogRealSchema = z.object({
  kind: z.enum(["real_achievement", "real_purchase"]),
  title: z.string().trim().min(2).max(140),
  note: z.string().trim().max(500).default(""),
});
export type LogRealInput = z.infer<typeof LogRealSchema>;
