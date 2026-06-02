import Phaser from "phaser";
import { LOCATIONS, LOCATION_META, type LocationKey } from "@/lib/game/constants";
import { gameBus } from "@/lib/event-bus";
import { frameFor, type Dir } from "@/lib/game/avatar";
import { layerTextureKey } from "./BootScene";

const TILE = 32;
export const MAP_W = 26;
export const MAP_H = 20;
const SPEED = 130;
const AVATAR_SCALE = 0.72;
const OVER_LAYERS = ["pants", "shoes", "shirt", "hair"] as const;

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

    this.add.tileSprite(0, 0, worldW, worldH, "grass").setOrigin(0, 0).setDepth(-10);

    const paths = this.add.graphics().setDepth(-9);
    paths.fillStyle(0xcdb98a, 1);
    const midX = Math.floor(MAP_W / 2) * TILE;
    const midY = Math.floor(MAP_H / 2) * TILE;
    paths.fillRect(0, midY - TILE, worldW, TILE * 2);
    paths.fillRect(midX - TILE, 0, TILE * 2, worldH);

    const buildings = this.physics.add.staticGroup();
    for (const key of LOCATIONS) {
      const m = LOCATION_META[key];
      const cx = m.tile.x * TILE;
      const baseY = m.tile.y * TILE;
      this.drawBuilding(cx, baseY, m.icon, m.label, m.color);

      const collide = this.add
        .rectangle(cx, baseY - TILE * 0.6, TILE * 2.2, TILE * 1.3, 0x000000, 0)
        .setOrigin(0.5, 0.5);
      this.physics.add.existing(collide, true);
      buildings.add(collide);

      this.doors.push({ key, x: cx, y: baseY });
      paths.fillStyle(0xcdb98a, 1);
      paths.fillRect(cx - TILE * 0.5, baseY - TILE, TILE, midY - baseY + TILE);
    }

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

    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.9);
    this.physics.world.setBounds(0, 0, worldW, worldH);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

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

  private drawBuilding(cx: number, baseY: number, icon: string, label: string, colorHex: string) {
    const color = parseInt(colorHex.replace("#", ""), 16);
    const dark = Phaser.Display.Color.IntegerToColor(color).darken(28).color;
    const light = Phaser.Display.Color.IntegerToColor(color).lighten(12).color;

    const c = this.add.container(cx, baseY);
    const g = this.add.graphics();
    const w = TILE * 2.2;
    const wallH = TILE * 1.6;
    const roofH = TILE * 0.9;

    g.fillStyle(0x000000, 0.16);
    g.fillEllipse(0, -2, w * 1.05, TILE * 0.5);
    g.fillStyle(dark, 1);
    g.fillRect(-w / 2, -wallH, w, wallH);
    g.fillStyle(light, 1);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(-w / 2, -wallH),
        new Phaser.Math.Vector2(w / 2, -wallH),
        new Phaser.Math.Vector2(w / 2 - TILE * 0.5, -wallH - roofH),
        new Phaser.Math.Vector2(-w / 2 + TILE * 0.5, -wallH - roofH),
      ],
      true,
    );
    g.fillStyle(0x2b2b33, 1);
    g.fillRect(-TILE * 0.4, -TILE * 0.95, TILE * 0.8, TILE * 0.95);
    g.fillStyle(0xfff2b0, 0.9);
    g.fillRect(-w / 2 + 8, -wallH + 8, 8, 8);
    g.fillRect(w / 2 - 16, -wallH + 8, 8, 8);
    c.add(g);

    const text = this.add
      .text(0, -wallH - roofH - 4, `${icon} ${label}`, {
        fontFamily: "monospace",
        fontStyle: "bold",
        fontSize: "13px",
        color: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.45)",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setResolution(2);
    c.add(text);
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
