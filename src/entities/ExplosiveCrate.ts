import { Crate } from "./Crate";

export class ExplosiveCrate extends Crate {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "tiles", 3);
    this.lootType = "EXPLOSIVE";
  }

  protected onBreak() {
    // Todo Dañar al jugador si está cerca al romperse
    console.log("¡BOOM! Daño de área");
    super.onBreak();
  }
}
