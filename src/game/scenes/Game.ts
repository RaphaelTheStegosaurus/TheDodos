import { Scene } from "phaser";
import { Player } from "../../entities/Player";

export class Game extends Scene {
  private player!: Player;
  constructor() {
    super("Game");
  }

  preload() {
    this.load.setPath("assets");
    this.load.image("tiles", "demo-ground.jpg");
    this.load.tilemapTiledJSON("map", "large-map.json");
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
    this.setupCamera(map.widthInPixels, map.heightInPixels);
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
