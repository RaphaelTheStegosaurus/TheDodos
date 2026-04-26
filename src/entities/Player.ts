import * as Phaser from "phaser";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private smokeEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  public zHeight: number = 0;
  public hp: number = 20;
  private _currentLevel: number = 0;
  private currentWeapon: string = "none";
  public isLockedX: boolean = false;
  isClimbing: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "dodo");
    if (!this.anims.exists(`${this.getPrefix()}-idle-s"`)) {
      this.anims.create({
        key: `${this.getPrefix()}-idle-s"`,
        frames: this.anims.generateFrameNumbers("dodo", { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1,
        yoyo: true,
      });
    }
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
      this.play(`${this.getPrefix()}-idle-s"`, true);
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
  get currentLevel(): number {
    return this._currentLevel;
  }

  set currentLevel(value: number) {
    this._currentLevel = value;
    const newScale = 1 + this._currentLevel * 0.1;
    this.setScale(newScale);
  }

  public takeDamage(amount: number) {
    if (this.currentLevel > 0) {
      this.currentLevel--;
      this.setTint(0xffaa00);
      this.scene.time.delayedCall(200, () => this.clearTint());
      this.scene.events.emit("piece_lost", this.currentLevel);
      return;
    }
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => this.clearTint());
    this.scene.events.emit("player_hp_changed", this.hp);
    this.scene.events.emit("player_hit");

    if (this.hp == 0) {
      (this.scene as any).onGameOver();
    }
  }

  private getPrefix = () => {
    if (this._currentLevel >= 4) return "meca04";
    if (this._currentLevel >= 3) return "meca03";
    if (this._currentLevel >= 2) return "meca02";
    if (this._currentLevel >= 1) return "meca01";
    return "dodo";
  };
  private updateAnimationByAngle(angle: number) {
    const prefix = this.getPrefix();
    if (angle > -22.5 && angle <= 22.5) {
      this.play(`${prefix}-walk-right`, true);
    } else if (angle > 22.5 && angle <= 67.5) {
      this.play(`${prefix}-walk-se`, true);
    } else if (angle > 67.5 && angle <= 112.5) {
      this.play(`${prefix}-walk-down`, true);
    } else if (angle > 112.5 && angle <= 157.5) {
      this.play(`${prefix}-walk-so`, true);
    } else if (angle > 157.5 || angle <= -157.5) {
      this.play(`${prefix}-walk-left`, true);
    } else if (angle > -157.5 && angle <= -112.5) {
      this.play(`${prefix}-walk-no`, true);
    } else if (angle > -112.5 && angle <= -67.5) {
      this.play(`${prefix}-walk-up`, true);
    } else if (angle > -67.5 && angle <= -22.5) {
      this.play(`${prefix}-walk-ne`, true);
    }
  }
}
