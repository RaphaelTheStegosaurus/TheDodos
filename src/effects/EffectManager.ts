import * as Phaser from "phaser";

export class EffectManager {
  constructor(private scene: Phaser.Scene) {}

  public createExplosion(x: number, y: number, color: number, count: number) {
    const particles = this.scene.add.particles(x, y, "tiles", {
      frame: 10,
      speed: { min: -100, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      blendMode: "SCREEN",
      lifespan: 400,
      gravityY: 200,
      tint: color,
    });

    particles.explode(count);
    this.scene.time.delayedCall(500, () => particles.destroy());
  }

  public screenShake() {
    this.scene.cameras.main.shake(200);
  }
}
