import * as Phaser from "phaser";
import { Crate } from "./Crate";

export class ExplosiveCrate extends Crate {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "tiles", 3);
    this.lootType = "EXPLOSIVE";
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
