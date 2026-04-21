import * as Phaser from "phaser";

export class MapManager {
  public map: Phaser.Tilemaps.Tilemap;
  public groundLayer!: Phaser.Tilemaps.TilemapLayer;
  public highLayer!: Phaser.Tilemaps.TilemapLayer;
  public roofLayer!: Phaser.Tilemaps.TilemapLayer;

  constructor(scene: Phaser.Scene) {
    this.map = scene.make.tilemap({ key: "map" });
    const tileset = this.map.addTilesetImage("scenario", "tiles");

    // 1. Capa de suelo (solo visual)
    this.map.createLayer("GroundLayer", tileset!, 0, 0);

    // 2. Paredes base
    const walls = this.map.createLayer("GroundWalls", tileset!, 0, 0);
    if (walls) {
      this.groundLayer = walls as Phaser.Tilemaps.TilemapLayer;
      // IMPORTANTE: Aquí le decimos que use la propiedad que vimos en el JSON
      this.groundLayer.setCollisionByProperty({ collides: true });
    }

    // 3. Paredes altas (segundo piso/decoración alta)
    const high = this.map.createLayer("HighWalls", tileset!, 0, 0);
    if (high) {
      this.highLayer = high as Phaser.Tilemaps.TilemapLayer;
      this.highLayer.setCollisionByProperty({ collides: true });
    }

    // 4. Techos
    this.roofLayer = this.map.createLayer(
      "Roofs",
      tileset!,
      0,
      0
    ) as Phaser.Tilemaps.TilemapLayer;

    // Ajustamos los límites de la física al tamaño del mapa
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
