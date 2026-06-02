// Furniture catalogue. Every item is placeable in interiors (the editor) and
// buyable in the shop. `w`/`h` are the footprint in world pixels used by the
// procedural furniture renderer and for placement.

import type { LocationKey } from "./constants";

export type ItemKind = "furniture";

export interface CatalogItem {
  key: string;
  name: string;
  kind: ItemKind;
  cost: number;
  icon: string;
  description: string;
  w: number;
  h: number;
  /** Rooms this item thematically belongs to (for shop grouping/defaults). */
  themes: LocationKey[];
}

export const CATALOG: CatalogItem[] = [
  // Home
  { key: "rug", name: "Ковёр", kind: "furniture", cost: 40, icon: "🟫", description: "Уют под ногами.", w: 96, h: 64, themes: ["home"] },
  { key: "sofa", name: "Диван", kind: "furniture", cost: 120, icon: "🛋️", description: "Где отдыхать после квестов.", w: 84, h: 44, themes: ["home"] },
  { key: "bed", name: "Кровать", kind: "furniture", cost: 140, icon: "🛏️", description: "Восстановление сил.", w: 56, h: 82, themes: ["home"] },
  { key: "tv", name: "Телевизор", kind: "furniture", cost: 110, icon: "📺", description: "Вечерний релакс.", w: 60, h: 38, themes: ["home"] },
  { key: "table", name: "Столик", kind: "furniture", cost: 60, icon: "🪵", description: "Журнальный столик.", w: 48, h: 40, themes: ["home", "work"] },
  { key: "coffee", name: "Кофемашина", kind: "furniture", cost: 70, icon: "☕", description: "Бодрое утро.", w: 26, h: 30, themes: ["home", "work"] },
  { key: "plant", name: "Растение", kind: "furniture", cost: 30, icon: "🪴", description: "Немного зелени.", w: 26, h: 36, themes: ["home", "work", "study", "gym"] },
  { key: "lamp", name: "Лампа", kind: "furniture", cost: 35, icon: "💡", description: "Тёплый свет.", w: 22, h: 44, themes: ["home", "study"] },
  { key: "trophy", name: "Кубок", kind: "furniture", cost: 90, icon: "🏆", description: "Витрина побед.", w: 24, h: 30, themes: ["home", "study"] },
  // Study
  { key: "bookshelf", name: "Книжный шкаф", kind: "furniture", cost: 80, icon: "📚", description: "Коллекция знаний.", w: 60, h: 40, themes: ["study", "home"] },
  { key: "desk", name: "Стол", kind: "furniture", cost: 90, icon: "🗄️", description: "Рабочее место.", w: 68, h: 42, themes: ["study", "work"] },
  { key: "chair", name: "Стул", kind: "furniture", cost: 40, icon: "🪑", description: "Сидеть и думать.", w: 26, h: 30, themes: ["study", "work"] },
  { key: "globe", name: "Глобус", kind: "furniture", cost: 55, icon: "🌐", description: "Весь мир на столе.", w: 24, h: 32, themes: ["study"] },
  // Work
  { key: "monitor", name: "Монитор", kind: "furniture", cost: 100, icon: "🖥️", description: "Продуктивность.", w: 30, h: 26, themes: ["work"] },
  { key: "whiteboard", name: "Доска", kind: "furniture", cost: 75, icon: "📋", description: "Планы и идеи.", w: 68, h: 40, themes: ["work", "study"] },
  // Gym
  { key: "bench", name: "Скамья", kind: "furniture", cost: 80, icon: "🛋️", description: "Жим лёжа.", w: 58, h: 30, themes: ["gym"] },
  { key: "dumbbells", name: "Гантели", kind: "furniture", cost: 60, icon: "🏋️", description: "Базовый инвентарь.", w: 40, h: 22, themes: ["gym"] },
  { key: "treadmill", name: "Дорожка", kind: "furniture", cost: 150, icon: "🏃", description: "Кардио дома.", w: 44, h: 62, themes: ["gym"] },
  { key: "mat", name: "Мат", kind: "furniture", cost: 30, icon: "🟦", description: "Для растяжки.", w: 64, h: 46, themes: ["gym"] },
  { key: "mirror", name: "Зеркало", kind: "furniture", cost: 70, icon: "🪞", description: "Следи за техникой.", w: 28, h: 50, themes: ["gym"] },
];

export const CATALOG_BY_KEY: Record<string, CatalogItem> = Object.fromEntries(
  CATALOG.map((item) => [item.key, item]),
);
