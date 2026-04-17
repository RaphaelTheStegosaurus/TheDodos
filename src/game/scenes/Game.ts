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
  private healthBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super("Game");
  }

  preload() {
    this.load.setPath("assets");
    this.load.image("tiles", "demo-ground.jpg");
    this.load.image("red-box", "led-square-red.svg");
    this.load.image("green-box", "led-square-green.svg");
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
    this.events.on("player_hit", () => {
      this.cameras.main.shake(50);
    });
  }
  update() {
    if (this.player) this.player.update();
  }
  private updateCameraZoom() {
    let newZoom = 1.5 - this.partsCollected * 0.1;
    newZoom = Phaser.Math.Clamp(newZoom, 0.8, 1.5);
    this.cameras.main.zoomTo(newZoom, 1000, "Linear", true);
    // console.log(this.cameras.main);
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
    // this.physics.overlap(hitArea, this.enemies, (_zone, enemy) => {
    //   (enemy as Player).takeDamage(10);
    // });
    this.time.delayedCall(100, () => hitArea.destroy());
  }

  private spawnLoot(x: number, y: number, type: string) {
    const item = this.physics.add.sprite(x, y, "tiles", 10);
    if (type === "REPAIR_KIT") {
      // item.setTint(0x00ff00);
      item.setTexture("green-box");
      this.createExplosionEffect(x, y, 0x00ff00, 15);
    } else if (type === "EXPLOSIVE") {
      // item.setTint(0xff0000);
      item.setTexture("red-box");
      this.createExplosionEffect(x, y, 0xffa500, 40);
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
    this.uiText = this.add.text(20, 20, "Piezas de Tanque: 0", {
      fontSize: "24px",
      color: "#ffffff",
      backgroundColor: "#000000",
      padding: { x: 10, y: 5 },
    });
    this.buildText = this.add.text(20, 60, "Progreso Meca: 0%", {
      fontSize: "24px",
      color: "#ffff00",
      stroke: "#000000",
      strokeThickness: 3,
    });
    const backgroundBar = this.add.graphics();
    backgroundBar.fillStyle(0x000000, 0.5);
    backgroundBar.fillRect(20, 100, 200, 20);
    this.healthBar = this.add.graphics();
    this.updateHealthBar(100);
    this.healthBar.setScrollFactor(0).setDepth(1001);
    this.events.on("player_hp_changed", (hp: number) => {
      this.updateHealthBar(hp);
    });
    this.uiText.setScrollFactor(0);
    backgroundBar.setScrollFactor(0);
    this.buildText.setScrollFactor(0);
    backgroundBar.setDepth(1000);
    this.uiText.setDepth(10000);
    this.buildText.setDepth(10000);
  }

  private updateUI() {
    this.uiText.setText(`Piezas de Tanque: ${this.partsCollected}`);
  }

  private updateBuildProgress() {
    const progress = Math.min(this.partsCollected * 20, 100);
    this.buildText.setText(`Progreso Meca: ${progress}%`);
    this.updateCameraZoom();
    if (this.partsCollected === 5) {
      console.log("has conseguido las 5 piezas");

      this.player.upgradeToChassis();
    }
  }
  private updateHealthBar(hp: number) {
    this.healthBar.clear();
    if (hp > 50) this.healthBar.fillStyle(0x00ff00);
    else if (hp > 25) this.healthBar.fillStyle(0xffff00);
    else this.healthBar.fillStyle(0xff0000);
    const width = (hp / 100) * 200;
    this.healthBar.fillRect(20, 100, width, 20);
  }
  private createExplosionEffect(
    x: number,
    y: number,
    color: number,
    count: number
  ) {
    const particles = this.add.particles(x, y, "tiles", {
      frame: 10,
      speed: { min: -100, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      blendMode: "SCREEN",
      lifespan: 400,
      gravityY: 200,
      tint: color,
    });
    particles.explode(count);
    this.time.delayedCall(500, () => particles.destroy());
  }
}
