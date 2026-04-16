import * as Phaser from "phaser";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  public zHeight: number = 0;
  private currentPhase: number = 0;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player-sprite");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    if (scene.input && scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
    } else {
      throw new Error("Keyboard input not available");
    }
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
    if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
      this.attack();
    }
  }
  attack() {
    this.scene.events.emit("player_attack", {
      x: this.x + (this.flipX ? -20 : 20),
      y: this.y,
    });
  }
  public upgradeToChassis() {
    this.currentPhase = 1;
    this.setScale(1.2);
    this.setTint(0x999999);
    console.log("¡Dodo ha evolucionado a Fase: CHASIS!");
  }
}
