import { Scene, Physics } from "phaser";

export class Player extends Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, "player-sprite");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setBounce(0.2);
    this.cursors = scene.input.keyboard!.createCursorKeys();
  }

  update() {
    const speed = 200;

    if (this.cursors.left.isDown) {
      this.setVelocityX(-speed);
      this.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.setVelocityX(speed);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    if (this.cursors.up.isDown && this.body?.blocked.down) {
      this.setVelocityY(-350);
    }
  }
}
