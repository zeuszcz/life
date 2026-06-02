import Phaser from "phaser";

// Procedural outdoor decorations for the overworld "street": trees, bushes,
// flowers, lamp posts, benches and a central fountain + plaza. Returns a static
// group of solid colliders (trees / lamps / fountain).

type G = Phaser.GameObjects.Graphics;

function ensure(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

function generatePropTextures(scene: Phaser.Scene) {
  ensure(scene, "prop_tree", 48, 60, (g) => {
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(24, 57, 34, 10);
    g.fillStyle(0x6b4a2b, 1);
    g.fillRect(21, 34, 6, 22);
    g.fillStyle(0x276b33, 1);
    g.fillCircle(12, 28, 12);
    g.fillCircle(36, 28, 12);
    g.fillStyle(0x2f8040, 1);
    g.fillCircle(24, 24, 18);
    g.fillStyle(0x3a9a52, 1);
    g.fillCircle(22, 17, 12);
    g.fillStyle(0x49a85e, 0.8);
    g.fillCircle(28, 13, 7);
  });

  ensure(scene, "prop_bush", 36, 28, (g) => {
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(18, 26, 30, 7);
    g.fillStyle(0x2f8040, 1);
    g.fillCircle(11, 17, 9);
    g.fillCircle(25, 17, 9);
    g.fillStyle(0x3a9a52, 1);
    g.fillCircle(18, 12, 10);
    g.fillStyle(0x49a85e, 0.7);
    g.fillCircle(16, 10, 5);
  });

  const flower = (key: string, petal: number, center: number) =>
    ensure(scene, key, 16, 20, (g) => {
      g.fillStyle(0x2f8f3f, 1);
      g.fillRect(7, 9, 2, 10);
      g.fillStyle(petal, 1);
      g.fillCircle(8, 6, 2.6);
      g.fillCircle(4, 7, 2.6);
      g.fillCircle(12, 7, 2.6);
      g.fillCircle(6, 3, 2.6);
      g.fillCircle(10, 3, 2.6);
      g.fillStyle(center, 1);
      g.fillCircle(8, 6, 2);
    });
  flower("prop_flower_r", 0xe05a5a, 0xf2c94c);
  flower("prop_flower_y", 0xf2c94c, 0xe0843a);
  flower("prop_flower_p", 0xa86fd0, 0xf2e9a0);

  ensure(scene, "prop_lamp", 16, 50, (g) => {
    g.fillStyle(0x000000, 0.16);
    g.fillEllipse(8, 48, 12, 6);
    g.fillStyle(0x3a3f4b, 1);
    g.fillRect(6, 10, 4, 38);
    g.fillStyle(0x2b2f3a, 1);
    g.fillRect(2, 5, 12, 7);
    g.fillStyle(0xffe9a0, 1);
    g.fillCircle(8, 9, 3);
  });

  ensure(scene, "prop_bench", 40, 22, (g) => {
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(20, 20, 34, 6);
    g.fillStyle(0x9c6b44, 1);
    g.fillRect(3, 5, 34, 3);
    g.fillStyle(0x8a5a3a, 1);
    g.fillRect(3, 9, 34, 6);
    g.fillStyle(0x6b4528, 1);
    g.fillRect(4, 15, 4, 6);
    g.fillRect(32, 15, 4, 6);
  });

  ensure(scene, "prop_fountain", 64, 56, (g) => {
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(32, 54, 58, 12);
    g.fillStyle(0x9aa0aa, 1);
    g.fillEllipse(32, 42, 58, 24);
    g.fillStyle(0x6f7681, 1);
    g.fillEllipse(32, 40, 58, 22);
    g.fillStyle(0x3aa0d0, 1);
    g.fillEllipse(32, 39, 44, 16);
    g.fillStyle(0x6f7681, 1);
    g.fillRect(28, 18, 8, 22);
    g.fillStyle(0x5ac0e0, 1);
    g.fillEllipse(32, 18, 18, 7);
    g.fillStyle(0xbfe3ef, 0.7);
    g.fillEllipse(32, 16, 10, 4);
  });
}

const TREES: [number, number][] = [
  [96, 116], [300, 96], [536, 96], [736, 116],
  [92, 250], [742, 250],
  [96, 480], [300, 602], [540, 602], [742, 480],
];
const BUSHES: [number, number][] = [
  [150, 190], [250, 150], [600, 150], [690, 190],
  [150, 520], [262, 560], [566, 560], [690, 520],
];
const FLOWERS: [number, number, string][] = [
  [130, 230, "prop_flower_r"], [330, 150, "prop_flower_y"], [500, 150, "prop_flower_p"], [700, 250, "prop_flower_r"],
  [130, 560, "prop_flower_p"], [340, 540, "prop_flower_r"], [500, 540, "prop_flower_y"], [705, 560, "prop_flower_y"],
];
const BENCHES: [number, number][] = [[372, 250], [460, 392]];

export function decorateOverworld(
  scene: Phaser.Scene,
  opts: { midX: number; midY: number },
): Phaser.Physics.Arcade.StaticGroup {
  const { midX, midY } = opts;
  generatePropTextures(scene);

  // Central plaza over the crossroads.
  const plaza = scene.add.graphics().setDepth(-8);
  plaza.fillStyle(0xd8c79b, 1);
  plaza.fillRoundedRect(midX - 96, midY - 96, 192, 192, 18);
  plaza.fillStyle(0xcdb98a, 1);
  plaza.fillRoundedRect(midX - 84, midY - 84, 168, 168, 14);
  plaza.lineStyle(3, 0xb8a06f, 1);
  plaza.strokeRoundedRect(midX - 84, midY - 84, 168, 168, 14);

  const solids = scene.physics.add.staticGroup();
  const addSolid = (x: number, y: number, w: number, h: number) => {
    const r = scene.add.rectangle(x, y, w, h, 0x000000, 0).setOrigin(0.5, 1);
    scene.physics.add.existing(r, true);
    (r.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    solids.add(r);
  };

  // Fountain centerpiece (origin bottom).
  scene.add.image(midX, midY + 6, "prop_fountain").setOrigin(0.5, 1).setDepth(midY + 6);
  addSolid(midX, midY + 6, 50, 14);

  const lampPos: [number, number][] = [
    [midX - 78, midY - 70], [midX + 78, midY - 70], [midX - 78, midY + 86], [midX + 78, midY + 86],
  ];

  for (const [x, y] of TREES) {
    scene.add.image(x, y, "prop_tree").setOrigin(0.5, 1).setDepth(y);
    addSolid(x, y, 12, 8);
  }
  // Lamps are decorative only (no collision) so they never trap the player.
  for (const [x, y] of lampPos) {
    scene.add.image(x, y, "prop_lamp").setOrigin(0.5, 1).setDepth(y);
  }
  for (const [x, y] of BUSHES) scene.add.image(x, y, "prop_bush").setOrigin(0.5, 1).setDepth(y);
  for (const [x, y, key] of FLOWERS) scene.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
  for (const [x, y] of BENCHES) scene.add.image(x, y, "prop_bench").setOrigin(0.5, 1).setDepth(y);

  return solids;
}
