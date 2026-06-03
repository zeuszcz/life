import Phaser from "phaser";

// Procedural outdoor decorations for the overworld: a hedged border, leafy and
// pine trees, bushes, flower beds, lamp posts, benches, a central fountain, a
// signpost and a little park. Returns a static group of solid colliders
// (trees / fountain) so the player can't walk through them.

type G = Phaser.GameObjects.Graphics;

function ensure(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

function generatePropTextures(scene: Phaser.Scene) {
  // Leafy round tree.
  ensure(scene, "prop_tree", 56, 68, (g) => {
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(28, 65, 40, 11);
    g.fillStyle(0x6b4a2b, 1);
    g.fillRect(24, 40, 8, 24);
    g.fillStyle(0x21602e, 1);
    g.fillCircle(14, 32, 14);
    g.fillCircle(42, 32, 14);
    g.fillStyle(0x2f8040, 1);
    g.fillCircle(28, 27, 21);
    g.fillStyle(0x3a9a52, 1);
    g.fillCircle(24, 19, 14);
    g.fillStyle(0x52b56a, 0.8);
    g.fillCircle(32, 14, 8);
  });

  // Pine / conifer for variety.
  ensure(scene, "prop_pine", 44, 70, (g) => {
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(22, 67, 30, 9);
    g.fillStyle(0x6b4a2b, 1);
    g.fillRect(19, 52, 6, 16);
    const tiers: [number, number][] = [
      [50, 14],
      [40, 30],
      [30, 44],
    ];
    tiers.forEach(([wy, y], i) => {
      g.fillStyle(i === 0 ? 0x1f5e34 : 0x276b3a, 1);
      g.fillTriangle(22 - wy / 2, y + 14, 22 + wy / 2, y + 14, 22, y - 6);
      g.fillStyle(0x35864a, 0.5);
      g.fillTriangle(22 - wy / 2, y + 14, 22, y + 14, 22, y - 6);
    });
  });

  ensure(scene, "prop_bush", 40, 30, (g) => {
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(20, 28, 32, 7);
    g.fillStyle(0x2f8040, 1);
    g.fillCircle(12, 18, 10);
    g.fillCircle(28, 18, 10);
    g.fillStyle(0x3a9a52, 1);
    g.fillCircle(20, 13, 11);
    g.fillStyle(0x52b56a, 0.7);
    g.fillCircle(17, 10, 5);
  });

  const flower = (key: string, petal: number, center: number) =>
    ensure(scene, key, 16, 22, (g) => {
      g.fillStyle(0x2f8f3f, 1);
      g.fillRect(7, 10, 2, 11);
      g.fillStyle(petal, 1);
      g.fillCircle(8, 7, 2.8);
      g.fillCircle(4, 8, 2.8);
      g.fillCircle(12, 8, 2.8);
      g.fillCircle(6, 4, 2.8);
      g.fillCircle(10, 4, 2.8);
      g.fillStyle(center, 1);
      g.fillCircle(8, 7, 2.2);
    });
  flower("prop_flower_r", 0xe05a5a, 0xf2c94c);
  flower("prop_flower_y", 0xf2c94c, 0xe0843a);
  flower("prop_flower_p", 0xa86fd0, 0xf2e9a0);

  ensure(scene, "prop_lamp", 16, 52, (g) => {
    g.fillStyle(0x000000, 0.16);
    g.fillEllipse(8, 50, 12, 6);
    g.fillStyle(0x3a3f4b, 1);
    g.fillRect(6, 12, 4, 38);
    g.fillStyle(0x2b2f3a, 1);
    g.fillRect(2, 6, 12, 8);
    g.fillStyle(0xffe9a0, 1);
    g.fillCircle(8, 10, 3.2);
    g.fillStyle(0xfff6cf, 0.6);
    g.fillCircle(8, 10, 6);
  });

  ensure(scene, "prop_bench", 42, 24, (g) => {
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(21, 22, 36, 6);
    g.fillStyle(0x9c6b44, 1);
    g.fillRect(3, 5, 36, 3);
    g.fillStyle(0x8a5a3a, 1);
    g.fillRect(3, 10, 36, 6);
    g.fillStyle(0x6b4528, 1);
    g.fillRect(5, 16, 4, 7);
    g.fillRect(33, 16, 4, 7);
  });

  ensure(scene, "prop_rock", 30, 22, (g) => {
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(15, 20, 26, 6);
    g.fillStyle(0x7c8088, 1);
    g.fillEllipse(15, 13, 24, 16);
    g.fillStyle(0x9aa0a8, 1);
    g.fillEllipse(11, 10, 12, 8);
    g.fillStyle(0x60656d, 1);
    g.fillEllipse(20, 16, 10, 5);
  });

  ensure(scene, "prop_fountain", 68, 60, (g) => {
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(34, 58, 62, 12);
    g.fillStyle(0x9aa0aa, 1);
    g.fillEllipse(34, 45, 62, 26);
    g.fillStyle(0x6f7681, 1);
    g.fillEllipse(34, 43, 62, 24);
    g.fillStyle(0x3aa0d0, 1);
    g.fillEllipse(34, 42, 48, 18);
    g.fillStyle(0x256a96, 1);
    g.fillEllipse(38, 45, 30, 9);
    g.fillStyle(0x6f7681, 1);
    g.fillRect(30, 18, 8, 24);
    g.fillStyle(0x5ac0e0, 1);
    g.fillEllipse(34, 18, 18, 7);
    g.fillStyle(0xbfe3ef, 0.7);
    g.fillEllipse(34, 16, 10, 4);
  });
}

// Tree colliders intentionally small (just the trunk base).
const TREES: [number, number][] = [
  [56, 96], [120, 64], [712, 64], [776, 96],
  [56, 560], [120, 600], [712, 600], [776, 560],
  [380, 566], [452, 566], [416, 602], // park cluster (bottom-centre)
];
const PINES: [number, number][] = [
  [40, 300], [792, 300], [300, 612], [540, 612],
];
const BUSHES: [number, number][] = [
  [70, 196], [762, 196], [70, 448], [762, 448],
  [256, 252], [580, 252], [256, 398], [580, 398],
];
const FLOWERS: [number, number, string][] = [
  [110, 150, "prop_flower_r"], [724, 150, "prop_flower_y"],
  [110, 506, "prop_flower_p"], [724, 506, "prop_flower_r"],
  [360, 556, "prop_flower_y"], [470, 556, "prop_flower_p"],
  [300, 196, "prop_flower_p"], [536, 196, "prop_flower_y"],
];
const BENCHES: [number, number][] = [
  [340, 388], [496, 388], [380, 540], [452, 540],
];
const ROCKS: [number, number][] = [
  [150, 260], [690, 260], [150, 392], [690, 392],
];

export function decorateOverworld(
  scene: Phaser.Scene,
  opts: { midX: number; midY: number },
): Phaser.Physics.Arcade.StaticGroup {
  const { midX, midY } = opts;
  generatePropTextures(scene);

  const solids = scene.physics.add.staticGroup();
  const addSolid = (x: number, y: number, w: number, h: number) => {
    const r = scene.add.rectangle(x, y, w, h, 0x000000, 0).setOrigin(0.5, 1);
    scene.physics.add.existing(r, true);
    (r.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    solids.add(r);
  };

  // Hedge border framing the map (decorative; world bounds keep the player in).
  const W = 832;
  const H = 640;
  const hedge = scene.add.graphics().setDepth(-12);
  const drawHedge = (x: number, y: number) => {
    hedge.fillStyle(0x255f30, 1);
    hedge.fillCircle(x, y, 13);
    hedge.fillStyle(0x317a3f, 1);
    hedge.fillCircle(x - 3, y - 3, 9);
    hedge.fillStyle(0x42964f, 0.7);
    hedge.fillCircle(x - 4, y - 5, 4);
  };
  for (let x = 14; x <= W - 14; x += 22) {
    drawHedge(x, 12);
    drawHedge(x, H - 12);
  }
  for (let y = 24; y <= H - 24; y += 22) {
    drawHedge(12, y);
    drawHedge(W - 12, y);
  }

  // Fountain centerpiece on the plaza.
  scene.add.image(midX, midY + 6, "prop_fountain").setOrigin(0.5, 1).setDepth(midY + 6);
  addSolid(midX, midY + 6, 52, 12);

  // Signpost between the pond and the plaza.
  drawSignpost(scene, midX, 210);

  // Lamps around the plaza and along the path verticals.
  const lampPos: [number, number][] = [
    [midX - 86, midY - 78], [midX + 86, midY - 78], [midX - 86, midY + 86], [midX + 86, midY + 86],
    [192, 250], [576, 250], [192, 392], [576, 392],
  ];
  for (const [x, y] of lampPos) scene.add.image(x, y, "prop_lamp").setOrigin(0.5, 1).setDepth(y);

  for (const [x, y] of TREES) {
    scene.add.image(x, y, "prop_tree").setOrigin(0.5, 1).setDepth(y);
    addSolid(x, y, 12, 7);
  }
  for (const [x, y] of PINES) {
    scene.add.image(x, y, "prop_pine").setOrigin(0.5, 1).setDepth(y);
    addSolid(x, y, 10, 6);
  }
  for (const [x, y] of ROCKS) {
    scene.add.image(x, y, "prop_rock").setOrigin(0.5, 1).setDepth(y);
    addSolid(x, y, 18, 6);
  }
  for (const [x, y] of BUSHES) scene.add.image(x, y, "prop_bush").setOrigin(0.5, 1).setDepth(y);
  for (const [x, y, key] of FLOWERS) scene.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
  for (const [x, y] of BENCHES) scene.add.image(x, y, "prop_bench").setOrigin(0.5, 1).setDepth(y);

  return solids;
}

function drawSignpost(scene: Phaser.Scene, x: number, y: number) {
  const g = scene.add.graphics().setDepth(y);
  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(x, y, 18, 6);
  g.fillStyle(0x7a5230, 1);
  g.fillRect(x - 3, y - 46, 6, 46); // post
  const boards: [number, number, string][] = [
    [-30, -42, "#ef4444"],
    [22, -32, "#3b82f6"],
    [-30, -22, "#a855f7"],
  ];
  for (const [dx, dy, hex] of boards) {
    g.fillStyle(parseInt(hex.slice(1), 16), 1);
    g.fillRect(x + dx, y + dy, 38, 12);
    g.fillStyle(0xffffff, 0.85);
    g.fillRect(x + dx + 4, y + dy + 5, 26, 2);
  }
}
