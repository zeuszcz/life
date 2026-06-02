import Phaser from "phaser";
import { AppearanceSchema, type Appearance } from "@/lib/zod-schemas";

const hex = (s: string) => parseInt(s.replace("#", ""), 16);

const BODY_COLORS: Record<Appearance["body"], number> = {
  light: 0xf2c9a0,
  tan: 0xd6a06a,
  dark: 0x8d5a3b,
};

// Procedurally generates all pixel-art textures so the game runs with zero
// external asset downloads. Swap these for real tilesets/spritesheets later by
// loading them here and keeping the same texture keys.
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create() {
    const appearance = AppearanceSchema.parse(this.registry.get("appearance") ?? {});
    this.makeTile("grass", 0x3f8f4f, [0x368044, 0x47985a]);
    this.makeTile("grass2", 0x429553, [0x3a8a49, 0x4ea05e]);
    this.makeTile("path", 0xcdb98a, [0xc2ad7c, 0xd8c79b]);
    this.makePlayer("player_0", appearance, false);
    this.makePlayer("player_1", appearance, true);
    this.scene.start("World");
  }

  private makeTile(key: string, base: number, specks: number[]) {
    const g = this.add.graphics();
    g.fillStyle(base, 1);
    g.fillRect(0, 0, 32, 32);
    // deterministic speckles for a tiled, pixel look
    const points = [
      [4, 6],
      [20, 3],
      [27, 14],
      [10, 22],
      [16, 27],
      [2, 18],
    ];
    points.forEach(([x, y], i) => {
      g.fillStyle(specks[i % specks.length], 1);
      g.fillRect(x, y, 2, 2);
    });
    g.lineStyle(1, 0x000000, 0.06);
    g.strokeRect(0, 0, 32, 32);
    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  private makePlayer(key: string, a: Appearance, step: boolean) {
    const W = 24;
    const H = 32;
    const g = this.add.graphics();
    const skin = BODY_COLORS[a.body];
    const hair = hex(a.hairColor);
    const outfit = hex(a.outfitColor);
    const cx = W / 2;

    // soft shadow
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(cx, H - 2, 16, 5);

    // legs (alternate for a walk cycle)
    g.fillStyle(0x2c3142, 1);
    if (step) {
      g.fillRect(cx - 5, H - 9, 4, 7);
      g.fillRect(cx + 2, H - 7, 4, 5);
    } else {
      g.fillRect(cx - 5, H - 8, 4, 6);
      g.fillRect(cx + 1, H - 8, 4, 6);
    }

    // torso / outfit
    g.fillStyle(outfit, 1);
    g.fillRect(cx - 6, H - 18, 12, 11);
    // arms
    g.fillStyle(outfit, 1);
    g.fillRect(cx - 8, H - 17, 3, 8);
    g.fillRect(cx + 5, H - 17, 3, 8);
    // hands
    g.fillStyle(skin, 1);
    g.fillRect(cx - 8, H - 10, 3, 2);
    g.fillRect(cx + 5, H - 10, 3, 2);

    // head
    g.fillStyle(skin, 1);
    g.fillRect(cx - 5, H - 28, 10, 10);
    // hair
    g.fillStyle(hair, 1);
    if (a.hair === "buzz") {
      g.fillRect(cx - 5, H - 28, 10, 3);
    } else if (a.hair === "long") {
      g.fillRect(cx - 6, H - 29, 12, 6);
      g.fillRect(cx - 6, H - 23, 2, 7);
      g.fillRect(cx + 4, H - 23, 2, 7);
    } else if (a.hair === "ponytail") {
      g.fillRect(cx - 5, H - 29, 10, 5);
      g.fillRect(cx + 4, H - 26, 3, 8);
    } else {
      // short
      g.fillRect(cx - 6, H - 29, 12, 5);
    }
    // eyes
    g.fillStyle(0x222222, 1);
    g.fillRect(cx - 3, H - 22, 2, 2);
    g.fillRect(cx + 1, H - 22, 2, 2);

    g.generateTexture(key, W, H);
    g.destroy();
  }
}
