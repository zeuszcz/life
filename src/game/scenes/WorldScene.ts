import Phaser from "phaser";
import { LOCATIONS, LOCATION_META, type LocationKey } from "@/lib/game/constants";
import { gameBus } from "@/lib/event-bus";
import { frameFor, type Dir } from "@/lib/game/avatar";
import { layerTextureKey } from "./BootScene";
import { decorateOverworld } from "../overworld-props";

const TILE = 32;
export const MAP_W = 26;
export const MAP_H = 20;
const SPEED = 130;
const AVATAR_SCALE = 0.72;
const OVER_LAYERS = ["head", "eyes", "pants", "shoes", "shirt", "hair"] as const;

interface Door {
  key: LocationKey;
  x: number;
  y: number;
}

// Open-world scene: grass map with four buildings. The player is a layered LPC
// avatar (body + pants + shirt + hair) with 4-direction walk animation and a
// slightly zoomed, oblique top-down camera.
export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite; // the body layer (carries physics)
  private over: Phaser.GameObjects.Sprite[] = []; // pants/shirt/hair followers
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private eKey!: Phaser.Input.Keyboard.Key;
  private doors: Door[] = [];
  private near: LocationKey | null = null;
  private inputEnabled = true;
  private facing: Dir = "down";
  private animTime = 0;
  private spawnFrom?: LocationKey;

  constructor() {
    super("World");
  }

  init(data: { from?: LocationKey }) {
    this.spawnFrom = data?.from;
  }

  create() {
    const worldW = MAP_W * TILE;
    const worldH = MAP_H * TILE;
    const midX = Math.floor(MAP_W / 2) * TILE;
    const midY = Math.floor(MAP_H / 2) * TILE;

    this.drawGround(worldW, worldH);
    this.drawDistricts();
    this.drawPaths(midX, midY);

    const buildings = this.physics.add.staticGroup();
    this.drawPond(buildings);

    for (const key of LOCATIONS) {
      const m = LOCATION_META[key];
      const cx = m.tile.x * TILE;
      const baseY = m.tile.y * TILE;
      this.drawBuilding(cx, baseY, m.key, m.icon, m.label, m.color);

      const collide = this.add
        .rectangle(cx, baseY - TILE * 0.55, TILE * 2.7, TILE * 1.2, 0x000000, 0)
        .setOrigin(0.5, 0.5);
      this.physics.add.existing(collide, true);
      buildings.add(collide);

      this.doors.push({ key, x: cx, y: baseY });
    }

    // Street decorations (trees, bushes, flowers, lamps, benches, fountain, park, signposts, hedges).
    const props = decorateOverworld(this, { midX, midY });

    // Player — layered LPC avatar. The body sprite carries the physics body;
    // pants/shirt/hair are follower sprites kept in sync each frame.
    // Spawn near the building we just exited, otherwise the map centre.
    let startX = midX + TILE;
    let startY = midY + TILE;
    if (this.spawnFrom) {
      const m = LOCATION_META[this.spawnFrom];
      startX = m.tile.x * TILE;
      startY = m.tile.y * TILE + TILE * 1.4;
    }
    this.player = this.physics.add.sprite(startX, startY, layerTextureKey("body"));
    this.player.setScale(AVATAR_SCALE).setOrigin(0.5, 0.5);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(14, 10);
    body.setOffset(25, 50);
    this.player.setCollideWorldBounds(true);
    this.over = OVER_LAYERS.map((layer) =>
      this.add.sprite(startX, startY, layerTextureKey(layer)).setScale(AVATAR_SCALE).setOrigin(0.5, 0.5),
    );
    this.setFrames(frameFor("down", false, 0));
    this.physics.add.collider(this.player, buildings);
    this.physics.add.collider(this.player, props);

    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.9);
    this.physics.world.setBounds(0, 0, worldW, worldH);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    // Never capture keys → Phaser never preventDefault()s them, so typing in
    // HTML inputs over the canvas (Space, WASD / фцыв, etc.) always works.
    // Movement still reads isDown regardless of capture.
    this.input.keyboard!.clearCaptures();

    const onInput = ({ enabled }: { enabled: boolean }) => {
      this.inputEnabled = enabled;
      if (!enabled) this.player.setVelocity(0, 0);
    };
    gameBus.on("set-input-enabled", onInput);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => gameBus.off("set-input-enabled", onInput));

    gameBus.emit("game-ready");
  }

  private setFrames(frame: number) {
    this.player.setFrame(frame);
    this.over.forEach((s) => s.setFrame(frame));
  }

  private drawGround(worldW: number, worldH: number) {
    this.add.tileSprite(0, 0, worldW, worldH, "grass").setOrigin(0, 0).setDepth(-20);
    // Organic darker-grass patches for terrain variation.
    const g = this.add.graphics().setDepth(-19);
    const patches: [number, number, number, number][] = [
      [120, 96, 150, 90], [705, 110, 130, 80], [110, 540, 150, 90],
      [710, 545, 140, 90], [250, 470, 130, 70], [560, 470, 130, 70],
    ];
    g.fillStyle(0x3c8a4c, 0.5);
    for (const [x, y, w, h] of patches) g.fillEllipse(x, y, w, h);
  }

  private drawDistricts() {
    // Soft themed colour wash under each building to "zone" the map.
    const g = this.add.graphics().setDepth(-18);
    for (const key of LOCATIONS) {
      const m = LOCATION_META[key];
      const cx = m.tile.x * TILE;
      const cy = m.tile.y * TILE;
      const color = parseInt(m.color.replace("#", ""), 16);
      g.fillStyle(color, 0.1);
      g.fillRoundedRect(cx - 96, cy - 80, 192, 152, 22);
    }
  }

  private drawPaths(midX: number, midY: number) {
    const lay = (x: number, y: number, w: number, h: number) => {
      this.add.tileSprite(x, y, w, h, "cobble").setOrigin(0, 0).setDepth(-16);
      const e = this.add.graphics().setDepth(-15);
      e.lineStyle(2, 0x807a6d, 0.5);
      e.strokeRect(x + 1, y + 1, w - 2, h - 2);
    };
    const colW = 50;
    const barH = 50;
    const leftX = LOCATION_META.gym.tile.x * TILE; // 192
    const rightX = LOCATION_META.work.tile.x * TILE; // 576
    const topY = LOCATION_META.gym.tile.y * TILE; // 160
    const botY = LOCATION_META.home.tile.y * TILE; // 448
    lay(leftX - colW / 2, topY, colW, botY - topY); // left column (gym↕home)
    lay(rightX - colW / 2, topY, colW, botY - topY); // right column (work↕study)
    lay(leftX, midY - barH / 2, rightX - leftX, barH); // horizontal bar

    // Round plaza over the crossing (drawn, not tiled, so it stays circular).
    const pr = 92;
    const plaza = this.add.graphics().setDepth(-14);
    plaza.fillStyle(0xa7a094, 1);
    plaza.fillCircle(midX, midY, pr);
    plaza.fillStyle(0xb9b3a6, 1);
    plaza.fillCircle(midX, midY, pr - 5);
    plaza.lineStyle(2, 0x8f8a7e, 0.55);
    plaza.strokeCircle(midX, midY, pr - 22);
    plaza.strokeCircle(midX, midY, pr - 44);
    plaza.lineStyle(3, 0xd8c79b, 0.85);
    plaza.strokeCircle(midX, midY, pr - 3);
  }

  private drawPond(solids: Phaser.Physics.Arcade.StaticGroup) {
    const px = 416;
    const py = 96;
    const g = this.add.graphics().setDepth(-17);
    g.fillStyle(0x6f8a5a, 0.5);
    g.fillEllipse(px, py + 6, 214, 100); // damp shore
    g.fillStyle(0x86a06a, 1);
    g.fillEllipse(px, py, 198, 88); // sandy rim
    g.fillStyle(0x2f7fb0, 1);
    g.fillEllipse(px, py, 182, 76); // water
    g.fillStyle(0x256a96, 1);
    g.fillEllipse(px + 16, py + 8, 120, 40); // depth
    g.fillStyle(0x3a93c4, 0.85);
    g.fillEllipse(px - 22, py - 8, 92, 28); // highlight
    g.fillStyle(0xbfe3ef, 0.5);
    g.fillEllipse(px - 34, py - 14, 34, 9);
    g.fillStyle(0x2f8f3f, 1); // lily pads
    g.fillEllipse(px + 52, py + 6, 22, 12);
    g.fillEllipse(px - 56, py + 12, 18, 10);
    const r = this.add.rectangle(px, py, 176, 64, 0x000000, 0).setOrigin(0.5, 0.5);
    this.physics.add.existing(r, true);
    solids.add(r);
  }

  private drawBuilding(cx: number, baseY: number, key: LocationKey, icon: string, label: string, colorHex: string) {
    const color = parseInt(colorHex.replace("#", ""), 16);
    const C = Phaser.Display.Color.IntegerToColor(color);
    const dark = C.clone().darken(38).color;
    const wall = C.clone().darken(8).color;
    const light = C.clone().lighten(18).color;

    const c = this.add.container(cx, baseY);
    const g = this.add.graphics();
    const w = 108;
    const wallH = 84;

    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(0, -1, w * 1.12, 22); // ground shadow

    // Walls with light/shade.
    g.fillStyle(wall, 1);
    g.fillRect(-w / 2, -wallH, w, wallH);
    g.fillStyle(0xffffff, 0.06);
    g.fillRect(-w / 2, -wallH, w * 0.42, wallH);
    g.fillStyle(0x000000, 0.12);
    g.fillRect(w * 0.16, -wallH, w * 0.34, wallH);

    const win = (x: number, y: number, ww: number, hh: number) => {
      g.fillStyle(0x223049, 1);
      g.fillRect(x - 1, y - 1, ww + 2, hh + 2);
      g.fillStyle(0x9fd0e6, 1);
      g.fillRect(x, y, ww, hh);
      g.fillStyle(0xffffff, 0.4);
      g.fillRect(x, y, ww / 2, hh / 2);
      g.fillStyle(0x223049, 0.5);
      g.fillRect(x + ww / 2, y, 1, hh);
      g.fillRect(x, y + hh / 2, ww, 1);
    };

    let topY = -wallH; // highest point, for the label
    if (key === "home") {
      const roofH = 44;
      g.fillStyle(dark, 1);
      g.fillTriangle(-w / 2 - 8, -wallH, w / 2 + 8, -wallH, 0, -wallH - roofH);
      g.fillStyle(light, 0.45);
      g.fillTriangle(-w / 2 - 8, -wallH, 0, -wallH, 0, -wallH - roofH);
      g.fillStyle(dark, 1);
      g.fillRect(w / 4, -wallH - roofH + 8, 12, 24); // chimney
      win(-w / 2 + 16, -wallH + 18, 22, 22);
      win(w / 2 - 38, -wallH + 18, 22, 22);
      topY = -wallH - roofH;
    } else if (key === "work") {
      g.fillStyle(dark, 1);
      g.fillRect(-w / 2 - 4, -wallH - 12, w + 8, 14); // parapet
      g.fillStyle(light, 0.4);
      g.fillRect(-w / 2 - 4, -wallH - 12, w + 8, 4);
      for (let r = 0; r < 3; r++)
        for (let col = 0; col < 3; col++) win(-w / 2 + 13 + col * 31, -wallH + 12 + r * 23, 18, 14);
      topY = -wallH - 12;
    } else if (key === "gym") {
      const roofH = 24;
      g.fillStyle(dark, 1);
      g.fillRect(-w / 2 - 6, -wallH - roofH, w + 12, roofH);
      g.fillStyle(light, 0.4);
      g.fillRect(-w / 2 - 6, -wallH - roofH, w + 12, 5);
      for (let i = 0; i < 6; i++) {
        g.fillStyle(i % 2 ? 0xf2f2f2 : color, 1);
        g.fillRect(-36 + i * 12, -30, 12, 9); // striped awning over door
      }
      win(-w / 2 + 13, -wallH + 18, 26, 20);
      win(w / 2 - 39, -wallH + 18, 26, 20);
      topY = -wallH - roofH;
    } else {
      // study — library: pediment + columns
      const roofH = 16;
      g.fillStyle(dark, 1);
      g.fillRect(-w / 2 - 6, -wallH - roofH, w + 12, roofH);
      g.fillStyle(light, 1);
      g.fillTriangle(-w / 2 - 6, -wallH - roofH, w / 2 + 6, -wallH - roofH, 0, -wallH - roofH - 18);
      g.fillStyle(0xece6da, 1);
      for (let i = 0; i < 4; i++) g.fillRect(-w / 2 + 12 + i * 28, -wallH + 10, 8, wallH - 26);
      win(-w / 2 + 26, -wallH + 20, 16, 26);
      win(w / 2 - 42, -wallH + 20, 16, 26);
      topY = -wallH - roofH - 18;
    }

    // Door + threshold.
    const dw = 30;
    const dh = 36;
    g.fillStyle(0x2b2b33, 1);
    g.fillRoundedRect(-dw / 2, -dh, dw, dh, 4);
    g.fillStyle(0x394056, 1);
    g.fillRect(-2, -dh, 2, dh); // door split
    g.fillStyle(0xffe9a0, 1);
    g.fillCircle(dw / 2 - 6, -dh / 2, 1.8); // handle
    g.fillStyle(color, 0.55);
    g.fillEllipse(0, -2, dw + 18, 9); // welcome mat
    c.add(g);

    // Signboard with the icon above the door.
    const sg = this.add.graphics();
    sg.fillStyle(0x10182b, 0.96);
    sg.fillRoundedRect(-21, -dh - 24, 42, 19, 5);
    sg.lineStyle(2, color, 1);
    sg.strokeRoundedRect(-21, -dh - 24, 42, 19, 5);
    c.add(sg);
    c.add(this.add.text(0, -dh - 14, icon, { fontSize: "13px" }).setOrigin(0.5).setResolution(2));

    // Floating name label above the roof.
    c.add(
      this.add
        .text(0, topY - 8, label, {
          fontFamily: "monospace",
          fontStyle: "bold",
          fontSize: "13px",
          color: "#ffffff",
          backgroundColor: "rgba(8,12,22,0.6)",
          padding: { x: 5, y: 2 },
        })
        .setOrigin(0.5, 1)
        .setResolution(2),
    );
    c.setDepth(baseY);
  }

  update(_time: number, delta: number) {
    if (!this.player) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    let vx = 0;
    let vy = 0;
    if (this.inputEnabled) {
      if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
      if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
      if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
      if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;
    }

    const moving = vx !== 0 || vy !== 0;
    if (moving) {
      const len = Math.hypot(vx, vy);
      body.setVelocity((vx / len) * SPEED, (vy / len) * SPEED);
      if (Math.abs(vx) >= Math.abs(vy)) this.facing = vx < 0 ? "left" : "right";
      else this.facing = vy < 0 ? "up" : "down";
      this.animTime += delta;
    } else {
      body.setVelocity(0, 0);
    }

    const step = Math.floor(this.animTime / 110);
    this.setFrames(frameFor(this.facing, moving, step));

    const x = this.player.x;
    const y = this.player.y;
    this.player.setDepth(y);
    this.over.forEach((s, i) => {
      s.setPosition(x, y);
      s.setDepth(y + 0.1 * (i + 1));
    });

    this.checkDoors();
  }

  private checkDoors() {
    let nearestKey: LocationKey | null = null;
    let nd = Infinity;
    for (const d of this.doors) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, d.x, d.y - TILE * 0.4);
      if (dist < nd) {
        nd = dist;
        nearestKey = d.key;
      }
    }
    const newNear = nearestKey && nd < TILE * 1.7 ? nearestKey : null;
    if (newNear !== this.near) {
      if (this.near) gameBus.emit("leave-location", { key: this.near });
      this.near = newNear;
      if (newNear) gameBus.emit("near-location", { key: newNear });
    }
    if (this.near && Phaser.Input.Keyboard.JustDown(this.eKey)) {
      const key = this.near;
      gameBus.emit("leave-location", { key });
      this.near = null;
      this.scene.start("Interior", { key });
    }
  }
}
