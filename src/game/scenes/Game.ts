import * as Phaser from "phaser";
import { Player } from "../../entities/Player";
import { Crate } from "../../entities/Crate";

export class Game extends Phaser.Scene {
  private player!: Player;
  private crates!: Phaser.Physics.Arcade.StaticGroup;
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
    const crate1 = new Crate(this, 600, 400);
    this.crates.add(crate1);
    this.physics.add.collider(this.player, this.crates);
    this.events.on("player_attack", (data: { x: number; y: number }) => {
      this.handleAttack(data.x, data.y);
    });
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
}
