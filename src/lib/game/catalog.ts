// Shop catalogue. Items are static config (not a DB table) so the store can be
// tuned without a migration. Owned items live in the InventoryItem table.

import type { LocationKey } from "./constants";

export type ItemKind = "furniture" | "cosmetic" | "gear" | "trophy";

export interface CatalogItem {
  key: string;
  name: string;
  kind: ItemKind;
  cost: number;
  icon: string;
  description: string;
  /** Where the item is displayed / which room it furnishes. */
  location?: LocationKey;
}

export const CATALOG: CatalogItem[] = [
  { key: "rug", name: "Уютный ковёр", kind: "furniture", cost: 40, icon: "🟦", description: "Делает дом теплее. +атмосфера.", location: "home" },
  { key: "plant", name: "Растение", kind: "furniture", cost: 30, icon: "🪴", description: "Немного зелени в комнату.", location: "home" },
  { key: "bookshelf", name: "Книжный шкаф", kind: "furniture", cost: 80, icon: "📚", description: "Для коллекции знаний.", location: "study" },
  { key: "trophy_shelf", name: "Полка трофеев", kind: "furniture", cost: 120, icon: "🏆", description: "Витрина твоих достижений.", location: "home" },
  { key: "dumbbells", name: "Гантели", kind: "gear", cost: 60, icon: "🏋️", description: "Домашний инвентарь для спорта.", location: "gym" },
  { key: "headphones", name: "Наушники", kind: "cosmetic", cost: 50, icon: "🎧", description: "Стильный аксессуар для аватара." },
  { key: "cap", name: "Кепка", kind: "cosmetic", cost: 35, icon: "🧢", description: "Лёгкий апгрейд внешнего вида." },
  { key: "watch", name: "Умные часы", kind: "gear", cost: 100, icon: "⌚", description: "Трекинг активности. +дисциплина." },
  { key: "desk", name: "Рабочий стол", kind: "furniture", cost: 90, icon: "🖥️", description: "Продуктивность дома.", location: "work" },
  { key: "coffee", name: "Кофемашина", kind: "furniture", cost: 70, icon: "☕", description: "Бодрое утро каждый день.", location: "home" },
];

export const CATALOG_BY_KEY: Record<string, CatalogItem> = Object.fromEntries(
  CATALOG.map((item) => [item.key, item]),
);
