import * as Phaser from "phaser";

export class UIManager {
  private uiText: Phaser.GameObjects.Text;
  private buildText: Phaser.GameObjects.Text;
  private healthBar: Phaser.GameObjects.Graphics;
  private backgroundBar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.uiText = scene.add
      .text(20, 20, "Piezas de Tanque: 0", {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 10, y: 5 },
      })
      .setScrollFactor(0)
      .setDepth(10000);

    this.buildText = scene.add
      .text(20, 60, "Progreso Meca: 0%", {
        fontSize: "24px",
        color: "#ffff00",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(10000);

    this.backgroundBar = scene.add
      .graphics()
      .fillStyle(0x000000, 0.5)
      .fillRect(20, 100, 200, 20)
      .setScrollFactor(0)
      .setDepth(1000);

    this.healthBar = scene.add.graphics().setScrollFactor(0).setDepth(1001);

    this.updateHealthBar(100);
  }

  public updateParts(count: number) {
    this.uiText.setText(`Piezas de Tanque: ${count}`);
  }

  public updateProgress(progress: number) {
    this.buildText.setText(`Progreso Meca: ${progress}%`);
  }

  public updateHealthBar(hp: number) {
    this.healthBar.clear();
    const color = hp > 50 ? 0x00ff00 : hp > 25 ? 0xffff00 : 0xff0000;
    this.healthBar.fillStyle(color);
    const width = (hp / 100) * 200;
    this.healthBar.fillRect(20, 100, width, 20);
  }
}
