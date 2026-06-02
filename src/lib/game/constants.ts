// Shared, framework-agnostic game constants. Safe to import from both server
// and client code (no Node-only or browser-only dependencies).

export const DOMAINS = ["fitness", "career", "wellbeing", "knowledge"] as const;
export type Domain = (typeof DOMAINS)[number];

export const LOCATIONS = ["gym", "work", "home", "study"] as const;
export type LocationKey = (typeof LOCATIONS)[number];

export const QUEST_TYPES = ["oneoff", "daily", "weekly"] as const;
export type QuestType = (typeof QUEST_TYPES)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface DomainMeta {
  domain: Domain;
  label: string;
  location: LocationKey;
  icon: string;
  /** Tailwind-friendly hex for UI accents and Phaser tints. */
  color: string;
  statName: string;
}

export const DOMAIN_META: Record<Domain, DomainMeta> = {
  fitness: {
    domain: "fitness",
    label: "Спорт",
    location: "gym",
    icon: "💪",
    color: "#ef4444",
    statName: "Сила",
  },
  career: {
    domain: "career",
    label: "Карьера",
    location: "work",
    icon: "💼",
    color: "#3b82f6",
    statName: "Доход",
  },
  wellbeing: {
    domain: "wellbeing",
    label: "Благополучие",
    location: "home",
    icon: "🏠",
    color: "#22c55e",
    statName: "Гармония",
  },
  knowledge: {
    domain: "knowledge",
    label: "Знания",
    location: "study",
    icon: "📚",
    color: "#a855f7",
    statName: "Мудрость",
  },
};

export interface LocationMeta {
  key: LocationKey;
  label: string;
  domain: Domain;
  icon: string;
  color: string;
  /** Grid position of the building in the world map (in tiles). */
  tile: { x: number; y: number };
}

export const LOCATION_META: Record<LocationKey, LocationMeta> = {
  gym: { key: "gym", label: "Качалка", domain: "fitness", icon: "💪", color: "#ef4444", tile: { x: 6, y: 5 } },
  work: { key: "work", label: "Работа", domain: "career", icon: "💼", color: "#3b82f6", tile: { x: 18, y: 5 } },
  home: { key: "home", label: "Дом", domain: "wellbeing", icon: "🏠", color: "#22c55e", tile: { x: 6, y: 14 } },
  study: { key: "study", label: "Учёба", domain: "knowledge", icon: "📚", color: "#a855f7", tile: { x: 18, y: 14 } },
};

export const DOMAIN_TO_LOCATION: Record<Domain, LocationKey> = {
  fitness: "gym",
  career: "work",
  wellbeing: "home",
  knowledge: "study",
};

export const LOCATION_TO_DOMAIN: Record<LocationKey, Domain> = {
  gym: "fitness",
  work: "career",
  home: "wellbeing",
  study: "knowledge",
};

/** Base reward table used by the mock provider and for sanity-clamping AI output. */
export const DIFFICULTY_REWARDS: Record<Difficulty, { xp: number; gold: number }> = {
  easy: { xp: 15, gold: 4 },
  medium: { xp: 30, gold: 8 },
  hard: { xp: 60, gold: 18 },
};

export function isDomain(value: string): value is Domain {
  return (DOMAINS as readonly string[]).includes(value);
}

export function isLocation(value: string): value is LocationKey {
  return (LOCATIONS as readonly string[]).includes(value);
}
