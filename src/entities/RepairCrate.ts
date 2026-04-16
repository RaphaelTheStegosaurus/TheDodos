import { Crate } from "./Crate";

export class RepairCrate extends Crate {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "tiles", 2); // Supongamos que el frame 2 es azul/reparación
    this.lootType = "REPAIR_KIT";
    this.health = 1; // Más fácil de romper
  }
}
