import * as Phaser from "phaser";
import { Player } from "../../entities/Player";
import { Crate } from "../../entities/Crate";
import { CrateGenerator } from "../../entities/CrateGenerator";
import { UIManager } from "../../managers/UIManager";
import { EffectManager } from "../../effects/EffectManager";
import { MapManager } from "../../managers/MapManager";
import { Stairs } from "../../entities/Stairs";

export class Game extends Phaser.Scene {
  private ui!: UIManager;
  private effects!: EffectManager;
  private partsCollected: number = 0;
  private player!: Player;
  private crates!: Phaser.Physics.Arcade.StaticGroup;
  private mapManager!: MapManager;

  constructor() {
    super("Game");
  }

  preload() {
    this.load.setPath("assets");
    this.load.tilemapTiledJSON("map", "map.json");
    this.load.image("tiles", "tileset_demo.png");
    this.load.image("red-box", "led-square-red.svg");
    this.load.image("green-box", "led-square-green.svg");
    this.load.image("player-sprite", "character.png");
  }

  create() {
    this.mapManager = new MapManager(this);

    this.player = new Player(this, 400, 300);
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

    // Nota: Usamos mapManager.groundLayer (el nombre correcto definido en el Manager)
    this.physics.add.collider(
      this.player,
      this.mapManager.groundLayer,
      undefined,
      () => {
        // Solo colisiona si el jugador está en el nivel 0 (suelo)
        return this.player.currentLevel === 0;
      }
    );

    this.physics.add.collider(
      this.player,
      this.mapManager.highLayer,
      undefined,
      () => {
        // Solo colisiona si el jugador está en el nivel 1 (planta alta)
        return this.player.currentLevel === 1;
      }
    );
    // Escaleras (Trigger)
    const stairs = new Stairs(this, 600, 400, 64, 32);
    this.physics.add.overlap(this.player, stairs, () => {
      stairs.handleOverlap(this.player);
    });
  }
  update() {
    if (this.player) {
      this.player.update();
      this.handleRoofTransparency();
    }
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
    // Obtenemos el tile exacto donde está el centro del jugador
    const tile = this.mapManager.roofLayer.getTileAtWorldXY(
      this.player.x,
      this.player.y
    );

    // Si hay un tile de techo sobre el jugador
    if (tile) {
      // Suavizamos la transición a 0.3 de opacidad (30%)
      this.mapManager.roofLayer.alpha = Phaser.Math.Linear(
        this.mapManager.roofLayer.alpha,
        0.3,
        0.1
      );
    } else {
      // Restauramos a opacidad total (100%)
      this.mapManager.roofLayer.alpha = Phaser.Math.Linear(
        this.mapManager.roofLayer.alpha,
        1,
        0.1
      );
    }
  }
}
