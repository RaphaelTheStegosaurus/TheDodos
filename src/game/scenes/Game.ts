import * as Phaser from "phaser";
import { Player } from "../../entities/Player";
import { Crate } from "../../entities/Crate";
import { CrateGenerator } from "../../entities/CrateGenerator";

export class Game extends Phaser.Scene {
  private player!: Player;
  private crates!: Phaser.Physics.Arcade.StaticGroup;
  private buildText!: Phaser.GameObjects.Text;
  private partsCollected: number = 0;
  private uiText!: Phaser.GameObjects.Text;

  constructor() {
    super("Game");
  }

  preload() {
    this.load.setPath("assets");
    this.load.image("tiles", "demo-ground.jpg");
    this.load.tilemapTiledJSON("map", "map.json");
    this.load.image("player-sprite", "character.png");
  }

  create() {
    const TILES_X = 100;
    const TILES_Y = 100;
    const TILE_SIZE = 32;
    const map = this.make.tilemap({
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      width: TILES_X,
      height: TILES_Y,
    });
    const tileset = map.addTilesetImage("tileset_demo", "tiles");
    const layer = map.createBlankLayer("Capa1", tileset!);
    layer?.randomize(0, 0, TILES_X, TILES_Y, [0]);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.player = new Player(this, 400, 300);
    if (this.player) {
      this.setupCamera(map.widthInPixels, map.heightInPixels);
    }
    this.crates = this.physics.add.staticGroup();
    const generator = new CrateGenerator(this, this.crates);
    generator.startSpawning();
    this.physics.add.collider(this.player, this.crates);
    this.createUI();
    this.events.on("player_attack", (data: { x: number; y: number }) => {
      this.handleAttack(data.x, data.y);
    });
    this.events.on(
      "crate_broken",
      (data: { x: number; y: number; type: string }) => {
        this.spawnLoot(data.x, data.y, data.type);
      }
    );
  }
  update() {
    if (this.player) this.player.update();
  }
  private setupCamera(width: number, height: number) {
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }
  public checkAttack(hitArea: Phaser.GameObjects.Zone) {
    this.physics.add.overlap(hitArea, this.crates, (_zone, crate) => {
      (crate as any).takeDamage(1);
    });
  }
  private handleAttack(x: number, y: number) {
    const hitArea = this.add.zone(x, y, 32, 32);
    this.physics.add.existing(hitArea);

    this.physics.overlap(hitArea, this.crates, (_zone, crate) => {
      (crate as Crate).takeDamage(1);
    });

    this.time.delayedCall(100, () => hitArea.destroy());
  }
  private spawnLoot(x: number, y: number, type: string) {
    const item = this.physics.add.sprite(x, y, "tiles", 10);
    if (type === "REPAIR_KIT") {
      item.setTint(0x00ff00);
    } else if (type === "EXPLOSIVE") {
    }

    this.physics.add.overlap(this.player, item, () => {
      console.log(`Recogiste: ${type}`);
      if (type === "REPAIR_KIT") {
        this.partsCollected += 1;
        this.updateUI();
        this.updateBuildProgress();
      }
      item.destroy();
    });
  }
  private createUI() {
    this.uiText = this.add
      .text(20, 20, "Piezas de Tanque: 0", {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 10, y: 5 },
      })
      .setScrollFactor(0)
      .setDepth(1000);
    this.buildText = this.add
      .text(20, 60, "Progreso Meca: 0%", {
        fontSize: "24px",
        color: "#ffff00",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(1000);
  }
  private updateUI() {
    this.uiText.setText(`Piezas de Tanque: ${this.partsCollected}`);
  }
  private updateBuildProgress() {
    const progress = Math.min(this.partsCollected * 20, 100);
    this.buildText.setText(`Progreso Meca: ${progress}%`);
    if (this.partsCollected === 5) {
      this.player.upgradeToChassis();
    }
  }
}
