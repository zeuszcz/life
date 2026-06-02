// Modular pixel-art avatar from the Universal LPC Spritesheet (ULPC, via the
// sanderfrenken generator; CC-BY-SA 3.0 / GPL 3.0 — see CREDITS.md).
//
// Each layer PNG was cropped to JUST the 4-direction walk block (rows 8–11 of
// the universal sheet), i.e. 832×256 = 13 columns × 4 rows of 64px frames.
// After the crop the walk rows are 0=up, 1=left, 2=down, 3=right (column 0 =
// idle/standing, columns 1–8 = the 8-frame walk cycle).
//
// Shared by Phaser and the React creator — no Node/browser-only deps.

export const FRAME = 64;
export const COLS = 13;

export const WALK_ROWS = { up: 0, left: 1, down: 2, right: 3 } as const;
export type Dir = keyof typeof WALK_ROWS;

export const SKINS = ["light", "amber", "olive", "bronze", "brown", "taupe", "black"] as const;
export const HAIR_STYLES = ["plain", "bangs", "long", "ponytail", "page", "parted", "curtains", "afro"] as const;
export const HAIR_COLORS = ["black", "dark_brown", "blonde", "ginger", "gray", "white"] as const;
export const SHIRTS = ["white", "black", "navy", "blue", "red", "forest", "teal", "charcoal", "maroon", "gray"] as const;
export const PANTS = ["black", "navy", "charcoal", "gray", "brown", "walnut", "forest", "teal"] as const;
export const SHOES = ["black", "brown", "gray", "white", "leather", "navy"] as const;

export type Skin = (typeof SKINS)[number];
export type HairStyle = (typeof HAIR_STYLES)[number];
export type HairColor = (typeof HAIR_COLORS)[number];
export type Shirt = (typeof SHIRTS)[number];
export type Pants = (typeof PANTS)[number];
export type Shoes = (typeof SHOES)[number];

export interface AvatarConfig {
  skin: Skin;
  hairStyle: HairStyle;
  hairColor: HairColor;
  shirt: Shirt;
  pants: Pants;
  shoes: Shoes;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: "light",
  hairStyle: "plain",
  hairColor: "dark_brown",
  shirt: "blue",
  pants: "navy",
  shoes: "brown",
};

// Back-to-front draw order.
export const LAYER_ORDER = ["body", "pants", "shoes", "shirt", "hair"] as const;
export type LayerKey = (typeof LAYER_ORDER)[number];

export function layerUrls(a: AvatarConfig): Record<LayerKey, string> {
  return {
    body: `/assets/character/body/${a.skin}.png`,
    pants: `/assets/character/pants/${a.pants}.png`,
    shoes: `/assets/character/shoes/${a.shoes}.png`,
    shirt: `/assets/character/shirt/${a.shirt}.png`,
    hair: `/assets/character/hair/${a.hairStyle}_${a.hairColor}.png`,
  };
}

/** Frame index for a direction. moving=false → idle (col 0); else walk col 1..8. */
export function frameFor(dir: Dir, moving: boolean, step: number): number {
  const base = WALK_ROWS[dir] * COLS;
  return moving ? base + 1 + (((step % 8) + 8) % 8) : base;
}

/** CSS background-position (px) to show a direction's idle frame in a preview. */
export function idleBgPosition(dir: Dir): { x: number; y: number } {
  return { x: 0, y: -WALK_ROWS[dir] * FRAME };
}

// ---- UI helpers (labels + swatch colors) -------------------------------------
export const SKIN_HEX: Record<Skin, string> = {
  light: "#f2c9a0",
  amber: "#e0a878",
  olive: "#c79a5e",
  bronze: "#b87a4b",
  brown: "#8d5a3b",
  taupe: "#6e4e3a",
  black: "#4a3328",
};

export const HAIR_HEX: Record<HairColor, string> = {
  black: "#2b2b2b",
  dark_brown: "#4a2f1a",
  blonde: "#e6c66b",
  ginger: "#b5543b",
  gray: "#9aa0a6",
  white: "#ededed",
};

// Shared clothing palette (shirts / pants / shoes).
export const CLOTH_HEX: Record<string, string> = {
  white: "#e8e8e8",
  black: "#2b2b2b",
  navy: "#243b6b",
  blue: "#3b82f6",
  red: "#c0392b",
  forest: "#2f6b3d",
  teal: "#2bb3a3",
  charcoal: "#36404a",
  maroon: "#7d2b3a",
  gray: "#9aa0a6",
  brown: "#6b4a2b",
  walnut: "#5b4326",
  leather: "#8a5a2b",
};

export const HAIR_STYLE_LABEL: Record<HairStyle, string> = {
  plain: "Обычные",
  bangs: "Чёлка",
  long: "Длинные",
  ponytail: "Хвост",
  page: "Каре",
  parted: "На пробор",
  curtains: "Шторки",
  afro: "Афро",
};

export const SKIN_LABEL: Record<Skin, string> = {
  light: "Светлый",
  amber: "Янтарный",
  olive: "Оливковый",
  bronze: "Бронза",
  brown: "Коричневый",
  taupe: "Тёмный загар",
  black: "Тёмный",
};
