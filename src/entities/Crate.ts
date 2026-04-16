import * as Phaser from "phaser";

export class Crate extends Phaser.Physics.Arcade.Sprite {
  public health: number = 3;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "logo", 1);

    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    this.setFrame(1);
    this.body?.setSize(28, 28);
  }

  public takeDamage(amount: number) {
    this.health -= amount;
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => this.clearTint());

    if (this.health <= 0) {
      this.destroy();
    }
  }

  private break() {
    //todo  Soltar un item o simplemente desaparecer
    this.destroy();
  }
}
