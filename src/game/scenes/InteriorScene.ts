import Phaser from "phaser";
import { type LocationKey } from "@/lib/game/constants";
import { gameBus, type RoomItemDTO } from "@/lib/event-bus";
import { frameFor, type Dir } from "@/lib/game/avatar";
import { layerTextureKey } from "./BootScene";
import {
  ROOM_W,
  ROOM_H,
  ROOM_TILE,
  WALL_ROWS,
  ROOM_THEME,
  BUILTIN_DECOR,
  type RoomTheme,
} from "@/lib/game/interiors";
import { generateFurnitureTextures, furnitureTextureKey } from "../furniture-sprites";

const SPEED = 120;
const AVATAR_SCALE = 0.72;
const OVER_LAYERS = ["pants", "shoes", "shirt", "hair"] as const;
const DOOR_W = 76;

interface PlacedItem {
  sprite: Phaser.GameObjects.Image;
  itemKey: string;
}

export class InteriorScene extends Phaser.Scene {
  private locationKey: LocationKey = "home";
  private player!: Phaser.Physics.Arcade.Sprite;
  private over: Phaser.GameObjects.Sprite[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private eKey!: Phaser.Input.Keyboard.Key;
  private facing: Dir = "up";
  private animTime = 0;
  private inputEnabled = true;
  private editMode = false;

  private questPt = { x: ROOM_W / 2, y: WALL_ROWS * ROOM_TILE + 18 };
  private exitPt = { x: ROOM_W / 2, y: ROOM_H - 14 };
  private hint: "quest" | "exit" | null = null;

  private userItems: PlacedItem[] = [];
  private selected: Phaser.GameObjects.Image | null = null;
  private gridGfx?: Phaser.GameObjects.Graphics;

  constructor() {
    super("Interior");
  }

  init(data: { key?: LocationKey }) {
    this.locationKey = data?.key ?? "home";
    this.facing = "up";
    this.animTime = 0;
    this.inputEnabled = true;
    this.editMode = false;
    this.userItems = [];
    this.selected = null;
    this.hint = null;
  }

  create() {
    const theme = ROOM_THEME[this.locationKey];
    generateFurnitureTextures(this);
    this.drawRoom(theme);

    // Built-in scenery
    for (const d of BUILTIN_DECOR[this.locationKey]) {
      const tex = furnitureTextureKey(d.key);
      if (this.textures.exists(tex)) {
        this.add.image(d.x, d.y, tex).setOrigin(0.5, 1).setDepth(d.y);
      }
    }

    // Quest marker
    this.drawQuestMarker(theme.accent);

    // Walls collision
    const walls = this.physics.add.staticGroup();
    const addWall = (x: number, y: number, w: number, h: number) => {
      const r = this.add.rectangle(x, y, w, h, 0x000000, 0).setOrigin(0, 0);
      this.physics.add.existing(r, true);
      walls.add(r);
    };
    addWall(0, 0, ROOM_W, WALL_ROWS * ROOM_TILE); // top
    addWall(0, 0, 10, ROOM_H); // left
    addWall(ROOM_W - 10, 0, 10, ROOM_H); // right
    addWall(0, ROOM_H - 10, ROOM_W / 2 - DOOR_W / 2, 10); // bottom-left
    addWall(ROOM_W / 2 + DOOR_W / 2, ROOM_H - 10, ROOM_W / 2 - DOOR_W / 2, 10); // bottom-right

    // Player
    this.createAvatar(ROOM_W / 2, ROOM_H - 44);
    this.physics.add.collider(this.player, walls);

    // Camera
    this.cameras.main.setBounds(0, 0, ROOM_W, ROOM_H);
    this.cameras.main.setBackgroundColor("#0c1018");
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
    this.cameras.main.setZoom(this.pickZoom());
    this.physics.world.setBounds(0, 0, ROOM_W, ROOM_H);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.bindBus();
    gameBus.emit("enter-interior", { key: this.locationKey });
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
  }

  private pickZoom() {
    // "cover" the viewport so the room fills the screen; camera follows the
    // player (clamped to room bounds) → no empty letterbox margins.
    const z = Math.max(this.scale.width / ROOM_W, this.scale.height / ROOM_H);
    return Phaser.Math.Clamp(z, 1.4, 3);
  }
  private onResize() {
    if (!this.cameras?.main) return;
    this.cameras.main.setZoom(this.pickZoom());
  }

  private bindBus() {
    const onInput = ({ enabled }: { enabled: boolean }) => {
      this.inputEnabled = enabled;
      if (!enabled) this.player.setVelocity(0, 0);
    };
    const onEdit = ({ enabled }: { enabled: boolean }) => this.setEdit(enabled);
    const onPlace = ({ itemKey }: { itemKey: string }) => this.addUserItem(itemKey, ROOM_W / 2, ROOM_H / 2, true);
    const onRemove = () => this.removeSelected();
    const onSave = () => this.emitLayout();
    const onLoad = ({ key, items }: { key: LocationKey; items: RoomItemDTO[] }) => {
      if (key !== this.locationKey) return;
      for (const it of items) this.addUserItem(it.itemKey, it.x, it.y, false);
    };
    gameBus.on("set-input-enabled", onInput);
    gameBus.on("set-edit-mode", onEdit);
    gameBus.on("place-item", onPlace);
    gameBus.on("remove-selected", onRemove);
    gameBus.on("save-room", onSave);
    gameBus.on("load-room", onLoad);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameBus.off("set-input-enabled", onInput);
      gameBus.off("set-edit-mode", onEdit);
      gameBus.off("place-item", onPlace);
      gameBus.off("remove-selected", onRemove);
      gameBus.off("save-room", onSave);
      gameBus.off("load-room", onLoad);
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
    });
  }

  private drawRoom(theme: RoomTheme) {
    const warm = this.locationKey === "home" || this.locationKey === "study";
    const floor = this.add.graphics().setDepth(-20);
    floor.fillStyle(theme.floor, 1);
    floor.fillRect(0, 0, ROOM_W, ROOM_H);
    floor.fillStyle(theme.floorAlt, 1);
    if (warm) {
      for (let y = 0; y < ROOM_H; y += 16) floor.fillRect(0, y, ROOM_W, 1); // planks
    } else {
      for (let y = 0; y < ROOM_H; y += ROOM_TILE)
        for (let x = 0; x < ROOM_W; x += ROOM_TILE)
          if (((x / ROOM_TILE + y / ROOM_TILE) & 1) === 0) floor.fillRect(x, y, ROOM_TILE, ROOM_TILE);
    }

    const walls = this.add.graphics().setDepth(-5);
    const wallH = WALL_ROWS * ROOM_TILE;
    walls.fillStyle(theme.wall, 1);
    walls.fillRect(0, 0, ROOM_W, wallH); // top wall
    walls.fillRect(0, 0, 10, ROOM_H); // left
    walls.fillRect(ROOM_W - 10, 0, 10, ROOM_H); // right
    walls.fillStyle(theme.wallTrim, 1);
    walls.fillRect(0, wallH - 6, ROOM_W, 6); // top baseboard
    // window on the top wall
    walls.fillStyle(0x9fd0e6, 1);
    walls.fillRect(44, 12, 64, 34);
    walls.fillStyle(0xffffff, 0.22);
    walls.fillRect(44, 12, 30, 34);
    walls.fillStyle(theme.wallTrim, 1);
    walls.fillRect(74, 12, 4, 34);
    walls.lineStyle(3, theme.wallTrim, 1);
    walls.strokeRect(44, 12, 64, 34);
    // door at bottom
    const dx = ROOM_W / 2 - DOOR_W / 2;
    walls.fillStyle(0x2b2b33, 1);
    walls.fillRect(dx, ROOM_H - 12, DOOR_W, 12);
    walls.fillStyle(theme.accent, 1);
    walls.fillRect(dx + 6, ROOM_H - 9, DOOR_W - 12, 4); // doormat accent
  }

  private drawQuestMarker(accent: number) {
    const g = this.add.graphics().setDepth(this.questPt.y);
    g.fillStyle(accent, 1);
    g.fillCircle(this.questPt.x, this.questPt.y - 8, 7);
    this.add
      .text(this.questPt.x, this.questPt.y - 8, "!", { fontFamily: "monospace", fontStyle: "bold", fontSize: "12px", color: "#fff" })
      .setOrigin(0.5)
      .setDepth(this.questPt.y + 1)
      .setResolution(2);
    this.tweens.add({ targets: g, y: -4, duration: 700, yoyo: true, repeat: -1, ease: "Sine.inOut" });
  }

  private createAvatar(x: number, y: number) {
    this.player = this.physics.add.sprite(x, y, layerTextureKey("body"));
    this.player.setScale(AVATAR_SCALE).setOrigin(0.5, 0.5);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(14, 10);
    body.setOffset(25, 50);
    this.player.setCollideWorldBounds(true);
    this.over = OVER_LAYERS.map((l) =>
      this.add.sprite(x, y, layerTextureKey(l)).setScale(AVATAR_SCALE).setOrigin(0.5, 0.5),
    );
    this.setFrames(frameFor("up", false, 0));
  }
  private setFrames(frame: number) {
    this.player.setFrame(frame);
    this.over.forEach((s) => s.setFrame(frame));
  }

  // ---- editor ----------------------------------------------------------------
  private setEdit(enabled: boolean) {
    this.editMode = enabled;
    this.player.setVelocity(0, 0);
    if (enabled) {
      this.gridGfx = this.add.graphics().setDepth(-4);
      this.gridGfx.lineStyle(1, 0xffffff, 0.08);
      for (let x = 0; x <= ROOM_W; x += ROOM_TILE) this.gridGfx.lineBetween(x, 0, x, ROOM_H);
      for (let y = 0; y <= ROOM_H; y += ROOM_TILE) this.gridGfx.lineBetween(0, y, ROOM_W, y);
      this.userItems.forEach((it) => this.makeInteractive(it.sprite));
    } else {
      this.gridGfx?.destroy();
      this.gridGfx = undefined;
      this.clearSelection();
      this.userItems.forEach((it) => it.sprite.disableInteractive());
    }
  }

  private addUserItem(itemKey: string, x: number, y: number, select: boolean) {
    const tex = furnitureTextureKey(itemKey);
    if (!this.textures.exists(tex)) return;
    const sprite = this.add.image(x, y, tex).setOrigin(0.5, 1).setDepth(y);
    const placed: PlacedItem = { sprite, itemKey };
    this.userItems.push(placed);
    if (this.editMode) this.makeInteractive(sprite);
    if (select) this.select(sprite);
  }

  private makeInteractive(sprite: Phaser.GameObjects.Image) {
    sprite.setInteractive({ draggable: true, useHandCursor: true });
    sprite.off("drag");
    sprite.on("drag", (_p: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      const nx = Phaser.Math.Clamp(dragX, 16, ROOM_W - 16);
      const ny = Phaser.Math.Clamp(dragY, WALL_ROWS * ROOM_TILE + 8, ROOM_H - 8);
      sprite.setPosition(nx, ny).setDepth(ny);
      this.select(sprite);
    });
    sprite.off("pointerdown");
    sprite.on("pointerdown", () => this.select(sprite));
  }

  private select(sprite: Phaser.GameObjects.Image) {
    this.clearSelection();
    this.selected = sprite;
    sprite.setTint(0x9be8a0);
  }
  private clearSelection() {
    if (this.selected) this.selected.clearTint();
    this.selected = null;
  }
  private removeSelected() {
    if (!this.selected) return;
    const idx = this.userItems.findIndex((i) => i.sprite === this.selected);
    if (idx >= 0) this.userItems.splice(idx, 1);
    this.selected.destroy();
    this.selected = null;
  }
  private emitLayout() {
    gameBus.emit("room-layout", {
      key: this.locationKey,
      items: this.userItems.map((i) => ({ itemKey: i.itemKey, x: Math.round(i.sprite.x), y: Math.round(i.sprite.y) })),
    });
  }

  // ---- loop ------------------------------------------------------------------
  update(_t: number, delta: number) {
    if (!this.player) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    let vx = 0;
    let vy = 0;
    const canMove = this.inputEnabled && !this.editMode;
    if (canMove) {
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

    if (!this.editMode) this.checkInteractions();
  }

  private checkInteractions() {
    const dq = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.questPt.x, this.questPt.y);
    const de = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitPt.x, this.exitPt.y);
    let next: "quest" | "exit" | null = null;
    if (dq < 46) next = "quest";
    else if (de < 54) next = "exit";
    if (next !== this.hint) {
      this.hint = next;
      gameBus.emit("interior-hint", {
        text: next === "quest" ? "E — задания" : next === "exit" ? "E — выйти" : null,
      });
    }
    if (this.hint && this.inputEnabled && Phaser.Input.Keyboard.JustDown(this.eKey)) {
      if (this.hint === "quest") gameBus.emit("open-location", { key: this.locationKey });
      else this.exitRoom();
    }
  }

  private exitRoom() {
    gameBus.emit("interior-hint", { text: null });
    gameBus.emit("exit-interior");
    this.scene.start("World", { from: this.locationKey });
  }
}
