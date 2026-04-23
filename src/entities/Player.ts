import * as Phaser from "phaser";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private smokeEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  public zHeight: number = 0;
  public hp: number = 100;
  public maxHp: number = 100;
  public currentLevel: number = 0;

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
    if (!body || body.enable === false) return; // Si está muerto o desactivado, no hace nada

    const speed = 200;
    this.setVelocity(0);

    // 1. Movimiento Físico
    if (this.cursors.left.isDown) this.setVelocityX(-speed);
    else if (this.cursors.right.isDown) this.setVelocityX(speed);

    if (this.cursors.up.isDown) this.setVelocityY(-speed);
    else if (this.cursors.down.isDown) this.setVelocityY(speed);

    body.velocity.normalize().scale(speed);

    // 2. Máquina de Estados de Animación
    const velocity = body.velocity;
    if (velocity.length() > 0) {
      const angle = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI);
      this.updateAnimationByAngle(angle);
    } else {
      this.play("dodo-idle", true);
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

  public takeDamage(amount: number) {
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => this.clearTint());
    this.scene.events.emit("player_hp_changed", this.hp);
    this.scene.events.emit("player_hit");
    if (this.hp < 30) {
      this.smokeEmitter.setFrequency(100);
      this.smokeEmitter.setParticleTint(0x333333);
    }
    if (this.hp <= 0) {
      this.die();
      (this.scene as any).onGameOver(); // Llamamos a la función en la escena
    }
  }

  private die() {
    console.log("El jugador ha sido destruido");
    //todo mostrar GameOver
  }
  private updateAnimationByAngle(angle: number) {
    // Simplificación de 8 direcciones
    if (angle > -22.5 && angle <= 22.5) {
      // DERECHA
      this.setFlipX(false);
      this.play("dodo-walk-side", true);
    } else if (angle > 22.5 && angle <= 67.5) {
      // SURESTE
      this.setFlipX(false);
      this.play("dodo-walk-se", true);
    } else if (angle > 67.5 && angle <= 112.5) {
      // ABAJO
      this.play("dodo-walk-down", true);
    } else if (angle > 112.5 && angle <= 157.5) {
      // SUROESTE
      this.setFlipX(true);
      this.play("dodo-walk-se", true);
    } else if (angle > 157.5 || angle <= -157.5) {
      // IZQUIERDA
      this.setFlipX(true);
      this.play("dodo-walk-side", true);
    } else if (angle > -157.5 && angle <= -112.5) {
      // NOROESTE
      this.setFlipX(true);
      this.play("dodo-walk-ne", true);
    } else if (angle > -112.5 && angle <= -67.5) {
      // ARRIBA
      this.play("dodo-walk-up", true);
    } else if (angle > -67.5 && angle <= -22.5) {
      // NORESTE
      this.setFlipX(false);
      this.play("dodo-walk-ne", true);
    }
  }
}
