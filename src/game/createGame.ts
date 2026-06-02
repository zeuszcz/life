import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { WorldScene } from "./scenes/WorldScene";
import type { Appearance } from "@/lib/zod-schemas";

// Builds the Phaser game instance. Imported dynamically (client-only) so Phaser
// never touches the server bundle.
export function createGame(parent: HTMLElement, appearance: Appearance): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#2f6b3d",
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: parent.clientWidth || 960,
      height: parent.clientHeight || 600,
    },
    physics: { default: "arcade", arcade: { debug: false } },
    callbacks: { preBoot: (game) => game.registry.set("appearance", appearance) },
    scene: [BootScene, WorldScene],
  });
}
