import { z } from "zod";
import { DOMAINS } from "@/lib/game/constants";
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
// AI output (validated after the model responds)
// ---------------------------------------------------------------------------
export const GoalTasksSchema = z.object({
  tasks: z.array(z.string().trim().min(2).max(160)).min(1).max(12),
});
export type GoalTasksResult = z.infer<typeof GoalTasksSchema>;

export const NextGoalSchema = z.object({
  domain: z.enum(DOMAINS),
  title: z.string().trim().min(3).max(140),
  motivation: z.string().trim().max(500).default(""),
  tasks: z.array(z.string().trim().min(2).max(160)).min(1).max(12),
});
export type NextGoalResult = z.infer<typeof NextGoalSchema>;

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
