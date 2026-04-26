import * as Phaser from "phaser";
import { Crate } from "./Crate";

export class ExplosiveCrate extends Crate {
  private isPrimed: boolean = false;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "red-box");
    this.lootType = "EXPLOSIVE";
    this.health = 1;
  }
  public onPlayerContact(player: any) {
    if (this.isPrimed) return;

    if (player.currentLevel === 0) {
      this.isPrimed = true;
      this.setTint(0xffff00); // Color amarillo de advertencia

      this.scene.tweens.add({
        targets: this,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 5,
      });

      console.log("Dodo activó trampa: 5 segundos para explotar...");

      this.scene.time.delayedCall(5000, () => {
        if (this.active) this.explode();
      });
    } else {
      // MECÁNICA MECA: Explota al contacto
      console.log("Meca detectado: ¡Explosión inmediata!");
      this.explode();
    }
  }
  public explode() {
    const player = (this.scene as any).player;
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      player.x,
      player.y
    );

    // Rango de explosión
    if (distance < 120) {
      player.takeDamage(40);
    }
    this.scene.cameras.main.shake(200);

    super.onBreak();
  }
  protected onBreak() {
    const player = (this.scene as any).player;
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      player.x,
      player.y
    );

    if (distance < 100) {
      player.takeDamage(20);
    }
    super.onBreak();
  }
}
