import * as Phaser from "phaser";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private smokeEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  public zHeight: number = 0;
  public hp: number = 100;
  public maxHp: number = 100;
  public currentLevel: number = 0;
  private piecesActive: number = 0;
  public isLockedX: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "dodo");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(30, 30);
    body.setOffset(17, 34);

    this.setCollideWorldBounds(true);
    this.cursors = scene.input.keyboard!.createCursorKeys();

    const particles = scene.add.particles(0, 0, "tiles", {
      frame: 10,
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.5, end: 0 },
      speed: 20,
      lifespan: 600,
      blendMode: "ADD",
      frequency: -1,
      follow: this,
    });
    this.smokeEmitter = particles;
  }

  update() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body || body.enable === false || this.hp <= 0) return;
    const speed = 200;
    this.setVelocity(0);

    if (!this.isLockedX) {
      if (this.cursors.left.isDown) this.setVelocityX(-speed);
      else if (this.cursors.right.isDown) this.setVelocityX(speed);
    }

    if (this.cursors.up.isDown) this.setVelocityY(-speed);
    else if (this.cursors.down.isDown) this.setVelocityY(speed);

    body.velocity.normalize().scale(speed);

    const velocity = body.velocity;
    if (velocity.length() > 0) {
      const angle = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI);
      this.updateAnimationByAngle(angle);
    } else {
      this.play("dodo-idle-s", true);
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
    this.setScale(1.2);
    this.setTint(0x999999);
    console.log("¡Dodo ha evolucionado a Fase: CHASIS!");
  }
  public setPieces(count: number) {
    this.piecesActive = count;
  }

  public takeDamage(amount: number) {
    if (this.piecesActive > 0) {
      this.piecesActive--;
      this.scene.events.emit("piece_lost", this.piecesActive);
      this.setTint(0xff0000);
      this.scene.time.delayedCall(200, () => this.clearTint());
      if (this.piecesActive === 0) {
        this.setScale(1);
        this.clearTint();
      }
      return;
    }

    this.hp = 0;
    // this.setTint(0xff0000);
    this.scene.events.emit("player_hp_changed", 0);
    this.scene.events.emit("player_hit");
    (this.scene as any).onGameOver();
  }
  public upgradeWithPiece(totalPieces: number) {
    this.piecesActive = totalPieces;
    const newScale = 1 + this.piecesActive * 0.1;
    this.setScale(newScale);
    if (this.piecesActive === 5) {
      this.setTint(0x999999);
    }
  }

  private updateAnimationByAngle(angle: number) {
    if (angle > -22.5 && angle <= 22.5) {
      this.play("dodo-walk-right", true);
    } else if (angle > 22.5 && angle <= 67.5) {
      this.play("dodo-walk-se", true);
    } else if (angle > 67.5 && angle <= 112.5) {
      this.play("dodo-walk-down", true);
    } else if (angle > 112.5 && angle <= 157.5) {
      this.play("dodo-walk-so", true);
    } else if (angle > 157.5 || angle <= -157.5) {
      this.play("dodo-walk-left", true);
    } else if (angle > -157.5 && angle <= -112.5) {
      this.play("dodo-walk-no", true);
    } else if (angle > -112.5 && angle <= -67.5) {
      this.play("dodo-walk-up", true);
    } else if (angle > -67.5 && angle <= -22.5) {
      this.play("dodo-walk-ne", true);
    }
  }
}
