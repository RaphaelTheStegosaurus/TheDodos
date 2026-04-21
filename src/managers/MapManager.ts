import * as Phaser from "phaser";

export class MapManager {
  public map: Phaser.Tilemaps.Tilemap;
  public groundLayer!: Phaser.Tilemaps.TilemapLayer;
  public highLayer!: Phaser.Tilemaps.TilemapLayer;
  public roofLayer!: Phaser.Tilemaps.TilemapLayer;

  constructor(scene: Phaser.Scene) {
    this.map = scene.make.tilemap({ key: "map" });
    const tileset = this.map.addTilesetImage("scenario", "tiles");

    if (!tileset) {
      console.error("No se pudo cargar el tileset");
      return;
    }

    this.map.createLayer("GroundLayer", tileset, 0, 0);

    const highWalls = this.map.createLayer(
      "HighWalls",
      tileset!,
      0,
      0
    ) as Phaser.Tilemaps.TilemapLayer;
    if (highWalls) {
      this.highLayer = highWalls;
      this.highLayer.forEachTile((tile) => {
        if (tile.index > 0) {
          tile.setCollision(true);
        }
      });
    }
    this.groundLayer = this.map.createLayer(
      "GroundWalls",
      tileset,
      0,
      0
    ) as Phaser.Tilemaps.TilemapLayer;

    this.groundLayer.forEachTile((tile) => {
      if (tile.index > 0) {
        tile.setCollision(true);
      }
    });

    // const wallIDs = [
    //   29, 32, 39, 40, 45, 49, 50, 55, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68,
    //   70, 72, 73, 75, 76, 78, 80, 81, 82, 83, 84, 85, 86, 87, 88, 90, 91, 92,
    // ];

    this.roofLayer = this.map.createLayer(
      "Roofs",
      tileset,
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
