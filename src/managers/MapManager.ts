import * as Phaser from "phaser";

export class MapManager {
  public map: Phaser.Tilemaps.Tilemap;
  public groundLayer!: Phaser.Tilemaps.TilemapLayer;
  public highLayer!: Phaser.Tilemaps.TilemapLayer;
  public roofLayer!: Phaser.Tilemaps.TilemapLayer;

  constructor(scene: Phaser.Scene) {
    this.map = scene.make.tilemap({ key: "map" });
    const tileset = this.map.addTilesetImage("scenario", "tiles");
    const ground = this.map.createLayer("GroundLayer", tileset!, 0, 0);
    const walls = this.map.createLayer("GroundWalls", tileset!, 0, 0);
    if (walls) {
      this.groundLayer = walls as Phaser.Tilemaps.TilemapLayer;
      // IMPORTANTE: Asegúrate de que en Tiled el tileset tenga la propiedad 'collides' (bool) = true
      this.groundLayer.setCollisionByProperty({ collides: true });
    }

    this.highLayer = this.map.createLayer(
      "HighWalls",
      tileset!,
      0,
      0
    ) as Phaser.Tilemaps.TilemapLayer;
    if (this.highLayer) {
      this.highLayer.setCollisionByProperty({ collides: true });
    }
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
