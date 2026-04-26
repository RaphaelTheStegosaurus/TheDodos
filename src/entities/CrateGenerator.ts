import * as Phaser from "phaser";
import { RepairCrate } from "./RepairCrate";
import { ExplosiveCrate } from "./ExplosiveCrate";

export class CrateGenerator {
  private scene: Phaser.Scene;
  private group: Phaser.Physics.Arcade.StaticGroup;
  private maxCrates: number = 15;

  constructor(scene: Phaser.Scene, group: Phaser.Physics.Arcade.StaticGroup) {
    this.scene = scene;
    this.group = group;
  }

  public startSpawning() {
    this.scene.time.addEvent({
      delay: Phaser.Math.Between(3000, 7000),
      callback: this.spawnRandomCrate,
      callbackScope: this,
      loop: true,
    });
  }

  private spawnRandomCrate() {
    if (this.group.getLength() >= this.maxCrates) return;
    const x = Phaser.Math.Between(100, 3100);
    const y = Phaser.Math.Between(100, 3100);
    const player = (this.scene as any).player;
    const distance = Phaser.Math.Distance.Between(x, y, player.x, player.y);
    if (distance < 200) {
      return;
    }
    const rand = Phaser.Math.FloatBetween(0, 1);
    if (rand < 0.4) {
      this.group.add(new ExplosiveCrate(this.scene, x, y));
    } else {
      this.group.add(new RepairCrate(this.scene, x, y));
    }
  }
}
