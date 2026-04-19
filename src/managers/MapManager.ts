import * as Phaser from "phaser";

export class MapManager {
  private map: Phaser.Tilemaps.Tilemap;
  public groundLayer!: Phaser.Tilemaps.TilemapLayer;
  public highLayer!: Phaser.Tilemaps.TilemapLayer;
  public roofLayer!: Phaser.Tilemaps.TilemapLayer;

  constructor(scene: Phaser.Scene) {
    this.map = scene.make.tilemap({ key: "map" });
    const tileset = this.map.addTilesetImage("tileset_demo", "tiles");
    const ground = this.map.createLayer("GroundWalls", tileset!, 0, 0);
    if (ground) {
      this.groundLayer = ground as Phaser.Tilemaps.TilemapLayer;
      this.groundLayer.setCollisionByProperty({ collides: true });
    }
    const high = this.map.createLayer("HighWalls", tileset!, 0, 0);
    if (high) {
      this.highLayer = high as Phaser.Tilemaps.TilemapLayer;
      this.highLayer.setCollisionByProperty({ collides: true });
      this.highLayer.setDepth(5);
    }

    const roof = this.map.createLayer("Roofs", tileset!, 0, 0);
    if (roof) {
      this.roofLayer = roof as Phaser.Tilemaps.TilemapLayer;
      this.roofLayer.setDepth(100);
    }
    scene.physics.world.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );
  }

  public get width(): number {
    return this.map.widthInPixels;
  }

  public get height(): number {
    return this.map.heightInPixels;
  }
}
