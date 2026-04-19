import * as Phaser from "phaser";

export class MapManager {
  private map: Phaser.Tilemaps.Tilemap;
  // private layer: Phaser.Tilemaps.TilemapLayer;
  public groundLayer!: Phaser.Tilemaps.TilemapLayer;
  public highLayer!: Phaser.Tilemaps.TilemapLayer;
  public roofLayer!: Phaser.Tilemaps.TilemapLayer;

  constructor(scene: Phaser.Scene) {
    // const TILES_X = 100;
    // const TILES_Y = 100;
    // const TILE_SIZE = 32;

    this.map = scene.make.tilemap({ key: "map" });
    const tileset = this.map.addTilesetImage("tileset_demo", "tiles");

    // Añadimos "as Phaser.Tilemaps.TilemapLayer" al final de cada creación
    this.groundLayer = this.map.createLayer(
      "GroundWalls",
      tileset!,
      0,
      0
    ) as Phaser.Tilemaps.TilemapLayer;
    this.groundLayer.setCollisionByProperty({ collides: true });

    this.highLayer = this.map.createLayer(
      "HighWalls",
      tileset!,
      0,
      0
    ) as Phaser.Tilemaps.TilemapLayer;
    this.highLayer.setCollisionByProperty({ collides: true });
    this.highLayer.setDepth(5);

    this.roofLayer = this.map.createLayer(
      "Roofs",
      tileset!,
      0,
      0
    ) as Phaser.Tilemaps.TilemapLayer;
    this.roofLayer.setDepth(100);

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
