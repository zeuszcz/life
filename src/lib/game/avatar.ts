// Modular pixel-art avatar built from Universal LPC Spritesheet layers
// (see public/assets/character/CREDITS.md). Each layer is a 64×64-frame sheet,
// 13 columns × 21 rows; walk-cycle rows are up=8, left=9, down=10, right=11
// (column 0 = idle/standing, columns 1–8 = the 8-frame walk cycle).
//
// Shared by Phaser (BootScene/WorldScene) and the React character creator, so
// it must stay free of Node/browser-only dependencies.

export const FRAME = 64;
export const COLS = 13;

export const WALK_ROWS = { up: 8, left: 9, down: 10, right: 11 } as const;
export type Dir = keyof typeof WALK_ROWS;

export const SKINS = ["light", "tanned", "tanned2", "dark", "dark2"] as const;
export const HAIR_STYLES = ["plain", "bedhead", "long", "messy1", "ponytail", "mohawk"] as const;
export const HAIR_COLORS = ["black", "brown", "blonde", "redhead", "gray", "white"] as const;
export const SHIRTS = ["white", "teal", "maroon", "brown"] as const;
export const PANTS = ["teal", "white", "red", "magenta"] as const;

export type Skin = (typeof SKINS)[number];
export type HairStyle = (typeof HAIR_STYLES)[number];
export type HairColor = (typeof HAIR_COLORS)[number];
export type Shirt = (typeof SHIRTS)[number];
export type Pants = (typeof PANTS)[number];

export interface AvatarConfig {
  skin: Skin;
  hairStyle: HairStyle;
  hairColor: HairColor;
  shirt: Shirt;
  pants: Pants;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: "light",
  hairStyle: "plain",
  hairColor: "brown",
  shirt: "white",
  pants: "teal",
};

// Back-to-front draw order.
export const LAYER_ORDER = ["body", "pants", "shirt", "hair"] as const;
export type LayerKey = (typeof LAYER_ORDER)[number];

export function layerUrls(a: AvatarConfig): Record<LayerKey, string> {
  return {
    body: `/assets/character/body/${a.skin}.png`,
    pants: `/assets/character/pants/${a.pants}.png`,
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
  tanned: "#d6a06a",
  tanned2: "#c0824a",
  dark: "#8d5a3b",
  dark2: "#5b3a28",
};

export const HAIR_HEX: Record<HairColor, string> = {
  black: "#2b2b2b",
  brown: "#6b4a2b",
  blonde: "#e6c66b",
  redhead: "#b5453b",
  gray: "#9aa0a6",
  white: "#ededed",
};

export const CLOTH_HEX: Record<string, string> = {
  white: "#e8e8e8",
  teal: "#2bb3a3",
  maroon: "#7d2b3a",
  brown: "#6b4a2b",
  red: "#c0392b",
  magenta: "#c026d3",
};

export const HAIR_STYLE_LABEL: Record<HairStyle, string> = {
  plain: "Обычные",
  bedhead: "Взъерошенные",
  long: "Длинные",
  messy1: "Небрежные",
  ponytail: "Хвост",
  mohawk: "Ирокез",
};

export const SKIN_LABEL: Record<Skin, string> = {
  light: "Светлый",
  tanned: "Загар",
  tanned2: "Бронза",
  dark: "Смуглый",
  dark2: "Тёмный",
};
