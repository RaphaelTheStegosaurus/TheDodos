import { Scene } from "phaser";
import { Player } from "../../entities/Player";

export class Game extends Scene {
  private player!: Player;
  constructor() {
    super("Game");
  }

  preload() {
    this.load.setPath("assets");
    this.load.image("tiles", "world-tileset.png");
    this.load.tilemapTiledJSON("map", "large-map.json");
    this.load.image("player-sprite", "character.png");
  }

  create() {
    const mapWidth = 100 * 32;
    const mapHeight = 100 * 32;
    const map = this.make.tilemap({ key: "map" });

    const tileset = map.addTilesetImage("TopDownWorld", "tiles");

    const groundLayer = map.createLayer("Ground", tileset!, 0, 0);
    const wallLayer = map.createLayer("Walls", tileset!, 0, 0);

    wallLayer?.setCollisionByProperty({ collides: true });

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.player = new Player(this, 400, 300);
    this.setupCamera(mapWidth, mapHeight);
  }
  update() {
    if (this.player) {
      this.player.update();
    }
  }
  private setupCamera(width: number, height: number) {
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }
}
