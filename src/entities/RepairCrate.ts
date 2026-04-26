import { Crate } from "./Crate";

export class RepairCrate extends Crate {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "green-box");
    this.lootType = "REPAIR_KIT";
    this.health = 1;
  }
}
