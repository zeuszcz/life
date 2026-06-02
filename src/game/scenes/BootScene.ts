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
    this.makeTile("grass", 0x3f8f4f, [0x368044, 0x47985a]);
    this.makeTile("grass2", 0x429553, [0x3a8a49, 0x4ea05e]);
    this.makeTile("path", 0xcdb98a, [0xc2ad7c, 0xd8c79b]);
    this.scene.start("World");
  }

  private makeTile(key: string, base: number, specks: number[]) {
    const g = this.add.graphics();
    g.fillStyle(base, 1);
    g.fillRect(0, 0, 32, 32);
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
}
