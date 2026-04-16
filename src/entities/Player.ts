import { Scene, Physics } from "phaser";

export class Player extends Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  public zHeight: number = 0;
  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, "player-sprite");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);

    // this.setBounce(0.2);
    this.cursors = scene.input.keyboard!.createCursorKeys();
  }

  update() {
    const speed = 200;
    this.setVelocity(0);
    if (this.cursors.left.isDown) {
      this.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.setVelocityX(speed);
    }
    if (this.cursors.up.isDown) {
      this.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.setVelocityY(speed);
    }
    if (this.body) {
      this.body.velocity.normalize().scale(speed);
    }
  }
}
