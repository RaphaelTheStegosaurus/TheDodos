import * as Phaser from "phaser";

export class MapManager {
  private map: Phaser.Tilemaps.Tilemap;
  public groundLayer!: Phaser.Tilemaps.TilemapLayer;
  public highLayer!: Phaser.Tilemaps.TilemapLayer;
  public roofLayer!: Phaser.Tilemaps.TilemapLayer;

  constructor(scene: Phaser.Scene) {
    this.map = scene.make.tilemap({ key: "map" });
    const tileset = this.map.addTilesetImage("scenario", "tiles");

    this.groundLayer = this.map.createLayer(
      "GroundWalls",
      tileset!,
      0,
      0
    ) as Phaser.Tilemaps.TilemapLayer;
    this.highLayer = this.map.createLayer(
      "HighWalls",
      tileset!,
      0,
      0
    ) as Phaser.Tilemaps.TilemapLayer;
    this.roofLayer = this.map.createLayer(
      "Roofs",
      tileset!,
      0,
      0
    ) as Phaser.Tilemaps.TilemapLayer;
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
