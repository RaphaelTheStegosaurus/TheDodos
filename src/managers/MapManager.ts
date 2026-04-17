import * as Phaser from "phaser";

export class MapManager {
  private map: Phaser.Tilemaps.Tilemap;
  private layer: Phaser.Tilemaps.TilemapLayer;

  constructor(scene: Phaser.Scene) {
    const TILES_X = 100;
    const TILES_Y = 100;
    const TILE_SIZE = 32;

    this.map = scene.make.tilemap({
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      width: TILES_X,
      height: TILES_Y,
    });

    const tileset = this.map.addTilesetImage("tileset_demo", "tiles");

    this.layer = this.map.createBlankLayer("Capa1", tileset!)!;
    this.layer.randomize(0, 0, TILES_X, TILES_Y, [0]);

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
