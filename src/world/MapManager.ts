export class MapManager {
  constructor(private scene: Phaser.Scene) {}

  public createStaticLayer(key: string, tilesetName: string) {
    const map = this.scene.make.tilemap({ key });
    const tileset = map.addTilesetImage(tilesetName);
    const layer = map.createLayer("Capa Suelo", tileset!, 0, 0);
    return { map, layer };
  }
}
