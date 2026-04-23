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
    this.load.image("player-sprite", "character.png");
    this.load.spritesheet("dodo", "assets/DODO.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    this.mapManager = new MapManager(this);

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
    const progress = Math.min(this.partsCollected * 20, 100);
    this.ui.updateProgress(progress);
    this.ui.updateParts(this.partsCollected);
    this.updateCameraZoom();
    if (this.partsCollected === 5) {
      console.log("has conseguido las 5 piezas");
      this.player.upgradeToChassis();
    }
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
      const stairTop = this.activeStair.y - this.activeStair.height / 2;
      const stairBottom = this.activeStair.y + this.activeStair.height / 2;

      if (this.state === GameState.CLIMBING_UP) {
        if (playerY < stairTop) {
          this.state = GameState.ROOF;
          this.executeLevelChange(1);
        } else {
          this.state = GameState.GROUND;
          this.executeLevelChange(0);
        }
      } else if (this.state === GameState.CLIMBING_DOWN) {
        if (playerY > stairBottom) {
          this.state = GameState.GROUND;
          this.executeLevelChange(0);
        } else {
          this.state = GameState.ROOF;
          this.executeLevelChange(1);
        }
      }

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
    // CAMINAR ABAJO (Frente)
    this.anims.create({
      key: "dodo-walk-down",
      frames: this.anims.generateFrameNumbers("dodo", { start: 0, end: 5 }), // Ajusta según la fila
      frameRate: 8,
      repeat: -1,
    });

    // CAMINAR ESPALDA (Arriba)
    this.anims.create({
      key: "dodo-walk-up",
      frames: this.anims.generateFrameNumbers("dodo", { start: 18, end: 20 }),
      frameRate: 6,
      repeat: -1,
    });

    // GAME OVER (Explosión/Vuelo)
    this.anims.create({
      key: "dodo-die",
      frames: this.anims.generateFrameNumbers("dodo", { start: 30, end: 32 }),
      frameRate: 5,
      repeat: 0,
    });
  }
}
