export class LevelManager {
  constructor(private scene: Phaser.Scene) {}

  public buildMap(key: string): Phaser.Tilemaps.Tilemap {
    const map = this.scene.make.tilemap({ key });
    // Todo Aquí iría la lógica de añadir tilesets y capas...
    return map;
  }
}
