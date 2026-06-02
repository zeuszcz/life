import Phaser from "phaser";
import { CATALOG } from "@/lib/game/catalog";

export const furnitureTextureKey = (key: string) => `fz_${key}`;

type Style = "box" | "flat" | "plant" | "lamp" | "mirror" | "screen" | "shelf" | "bed" | "sofa" | "board" | "treadmill";

interface Spec {
  style: Style;
  a: number; // primary
  b: number; // shade/secondary
  c: number; // detail
}

const SPEC: Record<string, Spec> = {
  rug: { style: "flat", a: 0xb24a4a, b: 0x7d2b3a, c: 0xe6c66b },
  mat: { style: "flat", a: 0x2f6bb2, b: 0x214f86, c: 0x9ec3e6 },
  plant: { style: "plant", a: 0x2f8f3f, b: 0x247030, c: 0x8a5a3a },
  lamp: { style: "lamp", a: 0xf5d98a, b: 0x444a55, c: 0xffe9b0 },
  mirror: { style: "mirror", a: 0xbfe3ef, b: 0x6b4a2b, c: 0xffffff },
  tv: { style: "screen", a: 0x2b2f3a, b: 0x3aa0d0, c: 0x111316 },
  monitor: { style: "screen", a: 0x2b2f3a, b: 0x49b36a, c: 0x111316 },
  bookshelf: { style: "shelf", a: 0x7a5230, b: 0x5e3f24, c: 0xcaa15f },
  bed: { style: "bed", a: 0x9a6b44, b: 0x6b4a2b, c: 0xeef0f4 },
  sofa: { style: "sofa", a: 0x4f7d5a, b: 0x3a5e44, c: 0x6fae7f },
  whiteboard: { style: "board", a: 0xf3f5f8, b: 0x5b6472, c: 0xef4444 },
  treadmill: { style: "treadmill", a: 0x2b2b2f, b: 0x4a4f59, c: 0x3aa0d0 },
  table: { style: "box", a: 0x9a6b44, b: 0x6b4a2b, c: 0x7d5836 },
  chair: { style: "box", a: 0x6b7689, b: 0x515a6b, c: 0x3b4252 },
  desk: { style: "box", a: 0x8a6240, b: 0x60411f, c: 0x9c7142 },
  coffee: { style: "box", a: 0x3a3f4b, b: 0x26292f, c: 0xc0392b },
  globe: { style: "box", a: 0x2f7bb2, b: 0x6b4a2b, c: 0x9ec3e6 },
  trophy: { style: "box", a: 0xf5c518, b: 0xb9930f, c: 0xffe9a0 },
  dumbbells: { style: "box", a: 0x3a3f4b, b: 0x26292f, c: 0x9aa0a6 },
  bench: { style: "box", a: 0x5b6576, b: 0x3a3f4b, c: 0x2b2b2f },
};

export function generateFurnitureTextures(scene: Phaser.Scene) {
  for (const item of CATALOG) {
    const key = furnitureTextureKey(item.key);
    if (scene.textures.exists(key)) continue;
    const spec = SPEC[item.key] ?? { style: "box", a: 0x8a6240, b: 0x60411f, c: 0x9c7142 };
    const g = scene.add.graphics();
    draw(g, spec, item.w, item.h);
    g.generateTexture(key, item.w, item.h);
    g.destroy();
  }
}

function shadow(g: Phaser.GameObjects.Graphics, w: number, h: number) {
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(w / 2, h - 2, w * 0.9, Math.max(6, h * 0.18));
}

function draw(g: Phaser.GameObjects.Graphics, s: Spec, w: number, h: number) {
  switch (s.style) {
    case "flat": {
      g.fillStyle(s.b, 1);
      g.fillRoundedRect(0, 0, w, h, 6);
      g.fillStyle(s.a, 1);
      g.fillRoundedRect(4, 4, w - 8, h - 8, 4);
      g.lineStyle(2, s.c, 0.85);
      g.strokeRoundedRect(8, 8, w - 16, h - 16, 3);
      break;
    }
    case "plant": {
      shadow(g, w, h);
      g.fillStyle(s.c, 1);
      g.fillRect(w / 2 - 9, h - 15, 18, 15); // pot
      g.fillStyle(0x000000, 0.15);
      g.fillRect(w / 2 - 9, h - 15, 18, 3);
      g.fillStyle(s.a, 1);
      g.fillCircle(w / 2, h - 22, 11);
      g.fillCircle(w / 2 - 8, h - 18, 8);
      g.fillCircle(w / 2 + 8, h - 18, 8);
      g.fillStyle(s.b, 1);
      g.fillCircle(w / 2 + 3, h - 26, 6);
      break;
    }
    case "lamp": {
      shadow(g, w, h);
      g.fillStyle(s.b, 1);
      g.fillRect(w / 2 - 7, h - 6, 14, 6); // base
      g.fillRect(w / 2 - 2, 16, 4, h - 20); // pole
      g.fillStyle(s.a, 1);
      g.fillTriangle(w / 2 - 12, 18, w / 2 + 12, 18, w / 2, 2); // shade
      g.fillStyle(s.c, 0.5);
      g.fillTriangle(w / 2 - 9, 17, w / 2 + 9, 17, w / 2, 6);
      break;
    }
    case "mirror": {
      g.fillStyle(s.b, 1);
      g.fillRoundedRect(0, 0, w, h, 4);
      g.fillStyle(s.a, 1);
      g.fillRoundedRect(4, 4, w - 8, h - 8, 3);
      g.fillStyle(s.c, 0.4);
      g.fillTriangle(6, 8, 6 + (w - 12) * 0.5, 8, 6, h - 8);
      break;
    }
    case "screen": {
      shadow(g, w, h);
      g.fillStyle(0x2b2b2f, 1);
      g.fillRect(w / 2 - 5, h * 0.78, 10, h * 0.22); // stand
      g.fillStyle(s.a, 1);
      g.fillRoundedRect(0, 0, w, h * 0.82, 3); // bezel
      g.fillStyle(s.b, 1);
      g.fillRect(3, 3, w - 6, h * 0.82 - 6); // screen
      g.fillStyle(0xffffff, 0.18);
      g.fillTriangle(3, 3, w * 0.5, 3, 3, h * 0.5);
      break;
    }
    case "shelf": {
      shadow(g, w, h);
      g.fillStyle(s.b, 1);
      g.fillRect(0, 0, w, h);
      g.fillStyle(s.a, 1);
      g.fillRect(3, 3, w - 6, h - 6);
      const books = [0xc0392b, 0x2f7bb2, 0x2f8f3f, 0xf5c518, 0xa855f7, 0xe67e22];
      for (let row = 0; row < 2; row++) {
        const y = 6 + row * ((h - 12) / 2);
        g.fillStyle(s.c, 1);
        g.fillRect(4, y + (h - 12) / 2 - 3, w - 8, 3); // shelf board
        let x = 6;
        let i = row;
        while (x < w - 9) {
          const bw = 4 + (i % 3);
          g.fillStyle(books[i % books.length], 1);
          g.fillRect(x, y, bw, (h - 12) / 2 - 4);
          x += bw + 1;
          i++;
        }
      }
      break;
    }
    case "bed": {
      shadow(g, w, h);
      g.fillStyle(s.b, 1);
      g.fillRoundedRect(0, 0, w, h, 5); // frame
      g.fillStyle(s.a, 1);
      g.fillRoundedRect(3, 8, w - 6, h - 12, 4); // mattress
      g.fillStyle(s.c, 1);
      g.fillRoundedRect(6, 11, w - 12, 16, 3); // pillow
      g.fillStyle(0x4f7d9a, 1);
      g.fillRoundedRect(4, h * 0.5, w - 8, h * 0.5 - 6, 3); // blanket
      break;
    }
    case "sofa": {
      shadow(g, w, h);
      g.fillStyle(s.b, 1);
      g.fillRoundedRect(0, 0, w, h, 6); // back
      g.fillStyle(s.a, 1);
      g.fillRoundedRect(4, h * 0.35, w - 8, h * 0.6, 5); // seat
      g.fillStyle(s.b, 1);
      g.fillRoundedRect(0, h * 0.3, 10, h * 0.65, 4); // arm L
      g.fillRoundedRect(w - 10, h * 0.3, 10, h * 0.65, 4); // arm R
      g.fillStyle(s.c, 0.6);
      g.fillRect(w / 2 - 1, h * 0.4, 2, h * 0.5);
      break;
    }
    case "board": {
      shadow(g, w, h);
      g.fillStyle(s.b, 1);
      g.fillRoundedRect(0, 0, w, h, 3); // frame
      g.fillStyle(s.a, 1);
      g.fillRect(4, 4, w - 8, h - 12); // surface
      g.fillStyle(s.c, 1);
      g.fillRect(8, 10, w * 0.5, 2);
      g.fillStyle(0x3b82f6, 1);
      g.fillRect(8, 16, w * 0.35, 2);
      g.fillRect(8, 22, w * 0.45, 2);
      break;
    }
    case "treadmill": {
      shadow(g, w, h);
      g.fillStyle(s.b, 1);
      g.fillRoundedRect(0, h * 0.18, w, h * 0.82, 4); // belt base
      g.fillStyle(s.a, 1);
      g.fillRect(6, h * 0.3, w - 12, h * 0.62); // belt
      for (let y = h * 0.34; y < h * 0.9; y += 8) {
        g.fillStyle(0x000000, 0.25);
        g.fillRect(8, y, w - 16, 2);
      }
      g.fillStyle(s.b, 1);
      g.fillRect(2, 0, 5, h * 0.4); // rail L
      g.fillRect(w - 7, 0, 5, h * 0.4); // rail R
      g.fillStyle(0x111316, 1);
      g.fillRoundedRect(w / 2 - 12, 0, 24, 12, 2); // console
      g.fillStyle(s.c, 1);
      g.fillRect(w / 2 - 9, 3, 18, 5);
      break;
    }
    default: {
      // box
      shadow(g, w, h);
      g.fillStyle(s.b, 1);
      g.fillRoundedRect(2, h * 0.42, w - 4, h * 0.56, 3); // front
      g.fillStyle(s.a, 1);
      g.fillRoundedRect(2, 2, w - 4, h * 0.56, 3); // top
      g.fillStyle(s.c, 1);
      g.fillRect(5, h * 0.5, w - 10, 2);
      break;
    }
  }
}
