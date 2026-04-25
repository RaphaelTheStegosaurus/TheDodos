import * as Phaser from "phaser";
import { Player } from "../../entities/Player";
import { Crate } from "../../entities/Crate";
import { CrateGenerator } from "../../entities/CrateGenerator";
import { UIManager } from "../../managers/UIManager";
import { EffectManager } from "../../effects/EffectManager";
import { MapManager } from "../../managers/MapManager";
import { Stairs } from "../../entities/Stairs";

enum GameState {
  GROUND,
  CLIMBING_UP,
  ROOF,
  CLIMBING_DOWN,
  DEAD,
}

export class Game extends Phaser.Scene {
  private ui!: UIManager;
  private effects!: EffectManager;
  private partsCollected: number = 0;
  private crates!: Phaser.Physics.Arcade.StaticGroup;
  private player!: Player;
  private mapManager!: MapManager;
  private state: GameState = GameState.GROUND;
  private activeStair: Stairs | null = null;

  constructor() {
    super("Game");
  }

  preload() {
    this.load.setPath("assets");
    this.load.tilemapTiledJSON("map", "map.json");
    this.load.image("tiles", "scenario.png");
    this.load.image("red-box", "EXPLOSIVECRATE.png");
    this.load.image("green-box", "REPAIRCRATE.png");
    this.load.spritesheet("dodo", "DODO.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("meca", "Mecas.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    this.mapManager = new MapManager(this);
    this.createDodoAnimations();
    this.player = new Player(this, 400, 300);
    this.physics.add.collider(
      this.player,
      this.mapManager.groundLayer,
      undefined,
      () => {
        return this.state === GameState.GROUND;
      },
      this
    );

    this.physics.add.collider(
      this.player,
      this.mapManager.highLayer,
      undefined,
      () => {
        return this.state === GameState.ROOF;
      },
      this
    );

    this.setupLevelInteractions();
    if (this.player) {
      this.setupCamera(this.mapManager.width, this.mapManager.height);
    }

    this.crates = this.physics.add.staticGroup();
    const generator = new CrateGenerator(this, this.crates);
    generator.startSpawning();
    this.physics.add.collider(this.player, this.crates);

    this.ui = new UIManager(this);
    this.effects = new EffectManager(this);
    this.setupEventListeners();
  }
  update() {
    this.player.update();
    this.handleRoofTransparency();
    this.checkStairExit();
  }
  private setupEventListeners() {
    this.events.on("player_attack", (data: { x: number; y: number }) => {
      this.handleAttack(data.x, data.y);
    });

    this.events.on("player_hit", () => this.effects.screenShake());

    this.events.on("player_hp_changed", (hp: number) =>
      this.ui.updateHealthBar(hp)
    );
    this.events.on("crate_broken", (data: any) =>
      this.spawnLoot(data.x, data.y, data.type)
    );
    // Añadimos el listener para cuando el Dodo pierde una pieza por un golpe
    //todo resetea los valores del dodo
    this.events.on("piece_lost", (remainingPieces: number) => {
      this.partsCollected = remainingPieces;
      const progress = (this.partsCollected / 5) * 100;
      this.ui.updateProgress(progress);
      this.ui.updateParts(this.partsCollected);
      this.updateCameraZoom();

      // Si quieres que la cámara tiemble más fuerte al perder armadura
      this.effects.screenShake();
    });
  }

  private setupCamera(width: number, height: number) {
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }

  private updateCameraZoom() {
    let newZoom = 1.5 - this.partsCollected * 0.1;
    newZoom = Phaser.Math.Clamp(newZoom, 0.8, 1.5);
    this.cameras.main.zoomTo(newZoom, 1000, "Linear", true);
  }

  private handleAttack(x: number, y: number) {
    const hitArea = this.add.zone(x, y, 32, 32);
    this.physics.add.existing(hitArea);

    this.physics.overlap(hitArea, this.crates, (_zone, crate) => {
      (crate as Crate).takeDamage(1);
    });
    // this.physics.overlap(hitArea, this.enemies, (_zone, enemy) => {
    //   (enemy as Player).takeDamage(10);
    // });
    this.time.delayedCall(100, () => hitArea.destroy());
  }

  private spawnLoot(x: number, y: number, type: string) {
    const color = type === "REPAIR_KIT" ? 0x00ff00 : 0xff0000;
    const count = type === "REPAIR_KIT" ? 15 : 40;
    const boxSprite = type === "REPAIR_KIT" ? "green-box" : "red-box";
    this.effects.createExplosion(x, y, color, count);
    const item = this.physics.add.sprite(x, y, boxSprite, 10);

    this.physics.add.overlap(this.player, item, () => {
      if (type === "REPAIR_KIT") {
        this.partsCollected += 1;
        this.updateBuildProgress();
      }
      item.destroy();
    });
  }

  private updateBuildProgress() {
    if (this.partsCollected > 5) this.partsCollected = 5;

    const progress = (this.partsCollected / 5) * 100;
    this.ui.updateProgress(progress);
    this.ui.updateParts(this.partsCollected);
    this.updateCameraZoom();
    this.player.upgradeWithPiece(this.partsCollected);
  }

  public checkAttack(hitArea: Phaser.GameObjects.Zone) {
    this.physics.add.overlap(hitArea, this.crates, (_zone, crate) => {
      (crate as any).takeDamage(1);
    });
  }

  private handleRoofTransparency() {
    if (
      this.state === GameState.ROOF ||
      this.state === GameState.CLIMBING_DOWN ||
      this.state === GameState.CLIMBING_UP
    ) {
      this.mapManager.roofLayer.alpha = 1;
      this.mapManager.highLayer.alpha = 1;
      return;
    }

    const tile = this.mapManager.roofLayer.getTileAtWorldXY(
      this.player.x,
      this.player.y
    );

    const targetAlpha = tile ? 0.3 : 1;
    this.mapManager.roofLayer.alpha = Phaser.Math.Linear(
      this.mapManager.roofLayer.alpha,
      targetAlpha,
      0.1
    );
    this.mapManager.highLayer.alpha = Phaser.Math.Linear(
      this.mapManager.highLayer.alpha,
      targetAlpha,
      0.1
    );
  }
  private setupLevelInteractions() {
    const stairObjects = this.mapManager.map.getObjectLayer("Objects")?.objects;
    stairObjects?.forEach((obj) => {
      const isStair = obj.type === "Stairs" || (obj as any).class === "Stairs";
      if (!isStair) return;

      const stairsZone = new Stairs(
        this,
        obj.x! + obj.width! / 2,
        obj.y! + obj.height! / 2,
        obj.width!,
        obj.height!,
        1
      );
      this.physics.add.overlap(this.player, stairsZone, () => {
        this.handleStairEntry(stairsZone);
      });
    });
  }

  private handleStairEntry(zone: Stairs) {
    if (this.activeStair) return;
    this.activeStair = zone;
    this.player.isLockedX = true;
    this.player.setX(zone.x);
    this.player.setDepth(6);
    if (this.state === GameState.GROUND && this.player.body!.velocity.y < 0) {
      this.state = GameState.CLIMBING_UP;
    } else if (
      this.state === GameState.ROOF &&
      this.player.body!.velocity.y > 0
    ) {
      this.state = GameState.CLIMBING_DOWN;
    }
  }

  private checkStairExit() {
    if (!this.activeStair) return;
    const isTouching = this.physics.overlap(this.player, this.activeStair);

    if (!isTouching) {
      const playerY = this.player.y;
      const margin = 5;
      const stairTop = this.activeStair.y - this.activeStair.height / 2;
      const stairBottom = this.activeStair.y + this.activeStair.height / 2;

      if (this.state === GameState.CLIMBING_UP) {
        if (playerY <= stairTop + margin) {
          this.state = GameState.ROOF;
          this.executeLevelChange(1);
        } else {
          this.state = GameState.GROUND;
          this.executeLevelChange(0);
        }
      } else if (this.state === GameState.CLIMBING_DOWN) {
        if (playerY >= stairBottom - margin) {
          this.state = GameState.GROUND;
          this.executeLevelChange(0);
        } else {
          this.state = GameState.ROOF;
          this.executeLevelChange(1);
        }
      }
      this.player.isLockedX = false;
      this.activeStair = null;
    }
  }

  private executeLevelChange(level: number) {
    if (level === 1) {
      this.mapManager.roofLayer.setDepth(5);
      this.player.setDepth(10);
    } else {
      this.mapManager.roofLayer.setDepth(100);
      this.player.setDepth(10);
    }
  }
  private createDodoAnimations() {
    this.anims.create({
      key: "dodo-idle-s",
      frames: [
        { key: "dodo", frame: 0 },
        { key: "dodo", frame: 1 },
        { key: "dodo", frame: 2 },
        { key: "dodo", frame: 4 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "dodo-idle-e",
      frames: [
        { key: "dodo", frame: 20 },
        { key: "dodo", frame: 21 },
        { key: "dodo", frame: 22 },
        { key: "dodo", frame: 24 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "dodo-idle-o",
      frames: [
        { key: "dodo", frame: 10 },
        { key: "dodo", frame: 11 },
        { key: "dodo", frame: 12 },
        { key: "dodo", frame: 14 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "dodo-idle-n",
      frames: [
        { key: "dodo", frame: 40 },
        { key: "dodo", frame: 43 },
        { key: "dodo", frame: 40 },
        { key: "dodo", frame: 44 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "dodo-walk-down",
      frames: [
        { key: "dodo", frame: 0 },
        { key: "dodo", frame: 4 },
        { key: "dodo", frame: 0 },
        { key: "dodo", frame: 5 },
      ],
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "dodo-walk-up",
      frames: [
        { key: "dodo", frame: 30 },
        { key: "dodo", frame: 31 },
        { key: "dodo", frame: 30 },
        { key: "dodo", frame: 32 },
      ],
      frameRate: 6,
      repeat: -1,
    });

    this.anims.create({
      key: "dodo-die",
      frames: [
        { key: "dodo", frame: 82 },
        { key: "dodo", frame: 80 },
        { key: "dodo", frame: 82 },
        { key: "dodo", frame: 81 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "dodo-walk-ne",
      frames: [
        { key: "dodo", frame: 50 },
        { key: "dodo", frame: 51 },
        { key: "dodo", frame: 50 },
        { key: "dodo", frame: 52 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "dodo-walk-no",
      frames: [
        { key: "dodo", frame: 40 },
        { key: "dodo", frame: 41 },
        { key: "dodo", frame: 40 },
        { key: "dodo", frame: 42 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "dodo-walk-se",
      frames: [
        { key: "dodo", frame: 70 },
        { key: "dodo", frame: 71 },
        { key: "dodo", frame: 70 },
        { key: "dodo", frame: 72 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "dodo-walk-so",
      frames: [
        { key: "dodo", frame: 60 },
        { key: "dodo", frame: 61 },
        { key: "dodo", frame: 60 },
        { key: "dodo", frame: 62 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    // this.anims.create({
    //   key: "dodo-walk-side",
    //   frames: [
    //     { key: "dodo", frame: 0 },
    //     { key: "dodo", frame: 4 },
    //     { key: "dodo", frame: 0 },
    //     { key: "dodo", frame: 5 },
    //   ],
    // frameRate: 8,
    //   repeat: -1,
    // });
    this.anims.create({
      key: "dodo-walk-left",
      frames: [
        { key: "dodo", frame: 10 },
        { key: "dodo", frame: 14 },
        { key: "dodo", frame: 10 },
        { key: "dodo", frame: 15 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "dodo-walk-right",
      frames: [
        { key: "dodo", frame: 20 },
        { key: "dodo", frame: 24 },
        { key: "dodo", frame: 20 },
        { key: "dodo", frame: 25 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca01-idle-s",
      frames: [
        { key: "meca", frame: 0 },
        { key: "meca", frame: 0 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca01-idle-e",
      frames: [
        { key: "meca", frame: 20 },
        { key: "meca", frame: 20 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca01-idle-o",
      frames: [
        { key: "meca", frame: 10 },
        { key: "meca", frame: 10 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca01-idle-n",
      frames: [
        { key: "meca", frame: 30 },
        { key: "meca", frame: 30 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca01-walk-down",
      frames: [
        { key: "meca", frame: 0 },
        { key: "meca", frame: 1 },
        { key: "meca", frame: 0 },
        { key: "meca", frame: 2 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca01-walk-left",
      frames: [
        { key: "meca", frame: 10 },
        { key: "meca", frame: 11 },
        { key: "meca", frame: 10 },
        { key: "meca", frame: 12 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca01-walk-right",
      frames: [
        { key: "meca", frame: 20 },
        { key: "meca", frame: 21 },
        { key: "meca", frame: 20 },
        { key: "meca", frame: 22 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca01-walk-up",
      frames: [
        { key: "meca", frame: 30 },
        { key: "meca", frame: 31 },
        { key: "meca", frame: 30 },
        { key: "meca", frame: 32 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca01-walk-no",
      frames: [
        { key: "meca", frame: 40 },
        { key: "meca", frame: 41 },
        { key: "meca", frame: 40 },
        { key: "meca", frame: 42 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca01-walk-ne",
      frames: [
        { key: "meca", frame: 50 },
        { key: "meca", frame: 51 },
        { key: "meca", frame: 50 },
        { key: "meca", frame: 52 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca01-walk-so",
      frames: [
        { key: "meca", frame: 60 },
        { key: "meca", frame: 61 },
        { key: "meca", frame: 60 },
        { key: "meca", frame: 62 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca01-walk-se",
      frames: [
        { key: "meca", frame: 70 },
        { key: "meca", frame: 71 },
        { key: "meca", frame: 70 },
        { key: "meca", frame: 72 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca02-idle-s",
      frames: [
        { key: "meca", frame: 3 },
        { key: "meca", frame: 3 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca02-idle-e",
      frames: [
        { key: "meca", frame: 23 },
        { key: "meca", frame: 23 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca02-idle-o",
      frames: [
        { key: "meca", frame: 13 },
        { key: "meca", frame: 13 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca02-idle-n",
      frames: [
        { key: "meca", frame: 33 },
        { key: "meca", frame: 33 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca02-walk-down",
      frames: [
        { key: "meca", frame: 3 },
        { key: "meca", frame: 4 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca02-walk-left",
      frames: [
        { key: "meca", frame: 13 },
        { key: "meca", frame: 14 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca02-walk-right",
      frames: [
        { key: "meca", frame: 23 },
        { key: "meca", frame: 24 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca02-walk-up",
      frames: [
        { key: "meca", frame: 33 },
        { key: "meca", frame: 34 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca02-walk-no",
      frames: [
        { key: "meca", frame: 43 },
        { key: "meca", frame: 44 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca02-walk-ne",
      frames: [
        { key: "meca", frame: 53 },
        { key: "meca", frame: 54 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca02-walk-so",
      frames: [
        { key: "meca", frame: 63 },
        { key: "meca", frame: 64 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca02-walk-se",
      frames: [
        { key: "meca", frame: 73 },
        { key: "meca", frame: 74 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca03-idle-s",
      frames: [
        { key: "meca", frame: 5 },
        { key: "meca", frame: 5 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca03-idle-e",
      frames: [
        { key: "meca", frame: 25 },
        { key: "meca", frame: 25 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca03-idle-o",
      frames: [
        { key: "meca", frame: 15 },
        { key: "meca", frame: 15 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca03-idle-n",
      frames: [
        { key: "meca", frame: 35 },
        { key: "meca", frame: 35 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca03-walk-down",
      frames: [
        { key: "meca", frame: 5 },
        { key: "meca", frame: 6 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca03-walk-left",
      frames: [
        { key: "meca", frame: 15 },
        { key: "meca", frame: 16 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca03-walk-right",
      frames: [
        { key: "meca", frame: 25 },
        { key: "meca", frame: 26 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca03-walk-up",
      frames: [
        { key: "meca", frame: 35 },
        { key: "meca", frame: 36 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca03-walk-no",
      frames: [
        { key: "meca", frame: 45 },
        { key: "meca", frame: 46 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca03-walk-ne",
      frames: [
        { key: "meca", frame: 55 },
        { key: "meca", frame: 56 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca03-walk-so",
      frames: [
        { key: "meca", frame: 65 },
        { key: "meca", frame: 66 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca03-walk-se",
      frames: [
        { key: "meca", frame: 75 },
        { key: "meca", frame: 76 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca04-idle-s",
      frames: [
        { key: "meca", frame: 7 },
        { key: "meca", frame: 7 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca04-idle-e",
      frames: [
        { key: "meca", frame: 27 },
        { key: "meca", frame: 27 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca04-idle-o",
      frames: [
        { key: "meca", frame: 17 },
        { key: "meca", frame: 17 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca04-idle-n",
      frames: [
        { key: "meca", frame: 37 },
        { key: "meca", frame: 37 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca04-walk-down",
      frames: [
        { key: "meca", frame: 7 },
        { key: "meca", frame: 8 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca04-walk-left",
      frames: [
        { key: "meca", frame: 17 },
        { key: "meca", frame: 18 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca04-walk-right",
      frames: [
        { key: "meca", frame: 27 },
        { key: "meca", frame: 28 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca04-walk-up",
      frames: [
        { key: "meca", frame: 37 },
        { key: "meca", frame: 38 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca04-walk-no",
      frames: [
        { key: "meca", frame: 47 },
        { key: "meca", frame: 48 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca04-walk-ne",
      frames: [
        { key: "meca", frame: 57 },
        { key: "meca", frame: 58 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca04-walk-so",
      frames: [
        { key: "meca", frame: 67 },
        { key: "meca", frame: 68 },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "meca04-walk-se",
      frames: [
        { key: "meca", frame: 77 },
        { key: "meca", frame: 78 },
      ],
      frameRate: 8,
      repeat: -1,
    });
  }
  public onGameOver() {
    if (this.state === GameState.DEAD) return;
    this.state = GameState.DEAD;

    this.player.body!.enable = false;
    this.physics.pause();
    this.cameras.main.stopFollow();
    this.player.setDepth(1000);
    this.player.play("dodo-die");

    this.add.tween({
      targets: this.player,
      scale: 20,
      alpha: { from: 1, to: 0 },
      angle: 720,
      x: this.cameras.main.midPoint.x,
      y: this.cameras.main.midPoint.y,
      duration: 1600,
      ease: "Power2.easeIn",
      onComplete: () => {
        this.effects.screenShake();
        this.partsCollected = 0;
        this.state = GameState.GROUND;
        this.player.setScale(1);
        this.player.isLockedX = false;
        this.time.delayedCall(1000, () => this.scene.restart());
      },
    });
  }
  private showGameOverMenu() {
    // 1. Oscurecer el fondo con un rectángulo negro
    const bg = this.add.rectangle(
      0,
      0,
      this.scale.width,
      this.scale.height,
      0x000000,
      0.8
    );
    bg.setOrigin(0).setDepth(3000).setScrollFactor(0);

    // 2. Texto de Game Over
    const title = this.add
      .text(this.scale.width / 2, this.scale.height / 3, "GAME OVER", {
        fontSize: "64px",
        color: "#ff0000",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(3001)
      .setScrollFactor(0);

    // 3. Botón de Reintentar
    const retryBtn = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "REINTENTAR", {
        fontSize: "32px",
        backgroundColor: "#333",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(3001)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    retryBtn.on("pointerdown", () => {
      this.scene.restart();
    });
  }
}
