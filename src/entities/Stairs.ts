import * as Phaser from "phaser";
import { Player } from "./Player";

export class Stairs extends Phaser.GameObjects.Zone {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    super(scene, x, y, width, height);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
  }

  public handleOverlap(player: Player) {
    if (player.body!.velocity.y < 0 && player.y > this.y) {
      this.goUp(player);
    } else if (player.body!.velocity.y > 0 && player.y < this.y) {
      this.goDown(player);
    }
  }

  private goUp(player: Player) {
    if (player.currentLevel === 1) return;
    player.currentLevel = 1;
    player.setDepth(2);
    player.setScale(1.1);
    console.log("Subiendo al segundo piso");
  }

  private goDown(player: Player) {
    if (player.currentLevel === 0) return;
    player.currentLevel = 0;
    player.setDepth(1);
    player.setScale(1.0);
    console.log("Bajando al suelo");
  }
}
