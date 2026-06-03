import type { LocationKey } from "./constants";

export const ROOM_TILE = 32;
export const ROOM_COLS = 17; // 544 px wide
export const ROOM_ROWS = 12; // 384 px tall
export const ROOM_W = ROOM_COLS * ROOM_TILE;
export const ROOM_H = ROOM_ROWS * ROOM_TILE;
export const WALL_ROWS = 2; // top wall thickness in tiles

export interface RoomTheme {
  floor: number;
  floorAlt: number;
  wall: number;
  wallTrim: number;
  accent: number;
}

export const ROOM_THEME: Record<LocationKey, RoomTheme> = {
  gym: { floor: 0x3c424f, floorAlt: 0x343a46, wall: 0x5b6576, wallTrim: 0x454e5d, accent: 0xef4444 },
  work: { floor: 0x586273, floorAlt: 0x515b6b, wall: 0x70798c, wallTrim: 0x545d6e, accent: 0x3b82f6 },
  home: { floor: 0x8a6240, floorAlt: 0x7d583a, wall: 0xcdb89a, wallTrim: 0xb39c80, accent: 0x22c55e },
  study: { floor: 0x6f4d2d, floorAlt: 0x624326, wall: 0xbaa180, wallTrim: 0x9c855f, accent: 0xa855f7 },
};

export interface DecorItem {
  key: string;
  x: number;
  y: number;
}

// Built-in (non-editable) themed scenery so each room looks furnished by default.
export const BUILTIN_DECOR: Record<LocationKey, DecorItem[]> = {
  gym: [
    { key: "mirror", x: 96, y: 92 },
    { key: "treadmill", x: 470, y: 140 },
    { key: "bench", x: 250, y: 185 },
    { key: "dumbbells", x: 250, y: 232 },
    { key: "mat", x: 120, y: 290 },
    { key: "plant", x: 510, y: 300 },
    { key: "trophy", x: 188, y: 300 },
    { key: "dumbbells", x: 430, y: 300 },
  ],
  work: [
    { key: "desk", x: 140, y: 170 },
    { key: "monitor", x: 140, y: 156 },
    { key: "chair", x: 140, y: 212 },
    { key: "desk", x: 360, y: 170 },
    { key: "monitor", x: 360, y: 156 },
    { key: "chair", x: 360, y: 212 },
    { key: "whiteboard", x: 470, y: 92 },
    { key: "coffee", x: 510, y: 300 },
    { key: "plant", x: 70, y: 300 },
    { key: "trophy", x: 78, y: 120 },
  ],
  home: [
    { key: "bed", x: 100, y: 150 },
    { key: "tv", x: 290, y: 92 },
    { key: "sofa", x: 450, y: 180 },
    { key: "rug", x: 290, y: 255 },
    { key: "lamp", x: 510, y: 250 },
    { key: "plant", x: 70, y: 300 },
    { key: "table", x: 380, y: 300 },
    { key: "bookshelf", x: 110, y: 300 },
  ],
  study: [
    { key: "bookshelf", x: 130, y: 96 },
    { key: "bookshelf", x: 200, y: 96 },
    { key: "desk", x: 330, y: 175 },
    { key: "chair", x: 330, y: 220 },
    { key: "globe", x: 410, y: 165 },
    { key: "lamp", x: 95, y: 285 },
    { key: "plant", x: 500, y: 300 },
    { key: "trophy", x: 470, y: 100 },
  ],
};
