import * as Phaser from "phaser";

export class Crate extends Phaser.Physics.Arcade.Sprite {
  public health: number = 3;
  protected lootType: string = "generic";
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.body?.setSize(32, 32);
  }
  public takeDamage(amount: number) {
    this.health -= amount;
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => this.clearTint());
    if (this.health <= 0) {
      this.onBreak();
    }
  }
  protected onBreak() {
    this.scene.events.emit("crate_broken", {
      x: this.x,
      y: this.y,
      type: this.lootType,
    });
    this.destroy();
  }
}
