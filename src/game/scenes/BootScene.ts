import Phaser from "phaser";
import { AppearanceSchema } from "@/lib/zod-schemas";
import { FRAME, LAYER_ORDER, layerUrls } from "@/lib/game/avatar";

export const layerTextureKey = (layer: string) => `av_${layer}`;

// Loads the player's LPC avatar layers (chosen in the character creator) and
// generates the simple ground/path tile textures procedurally.
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    const appearance = AppearanceSchema.parse(this.registry.get("appearance") ?? {});
    const urls = layerUrls(appearance);
    for (const layer of LAYER_ORDER) {
      this.load.spritesheet(layerTextureKey(layer), urls[layer], {
        frameWidth: FRAME,
        frameHeight: FRAME,
      });
    }
  }

  create() {
    this.makeGrass("grass", 0x4a9a59, [0x3f8f4f, 0x57a866, 0x46975a]);
    this.makeGrass("grass2", 0x3c8a4c, [0x357f44, 0x47985a, 0x2f7a40]);
    this.makePath("path", 0xcdb98a, [0xc2ad7c, 0xd8c79b]);
    this.makeCobble("cobble", 0xb9b3a6, 0xa7a094, 0xcbc6bb);
    this.makeWater("water", 0x2f7fb0, 0x3a93c4, 0x256a96);
    this.scene.start("World");
  }

  // Lush grass: base + soft mottling + a few short blade marks.
  private makeGrass(key: string, base: number, specks: number[]) {
    const g = this.add.graphics();
    g.fillStyle(base, 1);
    g.fillRect(0, 0, 32, 32);
    const blobs = [
      [5, 7, 5], [22, 5, 4], [27, 18, 5], [12, 24, 5], [18, 14, 4], [3, 19, 4],
    ];
    blobs.forEach(([x, y, r], i) => {
      g.fillStyle(specks[i % specks.length], 0.6);
      g.fillCircle(x, y, r);
    });
    // tiny blades
    g.fillStyle(0x2f7a40, 0.5);
    [[8, 26], [14, 9], [25, 27], [20, 20]].forEach(([x, y]) => {
      g.fillRect(x, y, 1, 3);
      g.fillRect(x + 2, y + 1, 1, 2);
    });
    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  private makePath(key: string, base: number, specks: number[]) {
    const g = this.add.graphics();
    g.fillStyle(base, 1);
    g.fillRect(0, 0, 32, 32);
    const points = [[4, 6], [20, 3], [27, 14], [10, 22], [16, 27], [2, 18]];
    points.forEach(([x, y], i) => {
      g.fillStyle(specks[i % specks.length], 1);
      g.fillRect(x, y, 2, 2);
    });
    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  // Cobblestone for plaza + main paths.
  private makeCobble(key: string, base: number, dark: number, light: number) {
    const g = this.add.graphics();
    g.fillStyle(dark, 1);
    g.fillRect(0, 0, 32, 32);
    const stones: [number, number, number, number][] = [
      [1, 1, 14, 9], [17, 1, 14, 9], [1, 12, 9, 8], [12, 12, 18, 8],
      [1, 22, 14, 9], [17, 22, 14, 9],
    ];
    stones.forEach(([x, y, w, h], i) => {
      g.fillStyle(i % 2 ? base : light, 1);
      g.fillRoundedRect(x, y, w, h, 3);
      g.fillStyle(0xffffff, 0.08);
      g.fillRoundedRect(x, y, w, 2, 1);
    });
    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  private makeWater(key: string, base: number, light: number, dark: number) {
    const g = this.add.graphics();
    g.fillStyle(base, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(light, 0.5);
    g.fillEllipse(10, 9, 14, 4);
    g.fillEllipse(24, 22, 12, 3);
    g.fillStyle(dark, 0.45);
    g.fillEllipse(20, 13, 10, 3);
    g.fillEllipse(8, 26, 10, 3);
    g.generateTexture(key, 32, 32);
    g.destroy();
  }
}
