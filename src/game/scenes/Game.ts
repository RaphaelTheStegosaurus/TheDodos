import { Scene } from "phaser";
import { Player } from "../../entities/player";

export class Game extends Scene {
  private player!: Player;
  constructor() {
    super("Game");
  }

  preload() {
    this.load.setPath("assets");
    this.load.image("background", "bg.png");
    this.load.image("logo", "logo.png");
    this.load.image("player-sprite", "character.png");
  }

  create() {
    this.add.image(512, 384, "background");
    this.player = new Player(this, 400, 300);
    this.add.image(512, 350, "logo").setDepth(100);
    this.add
      .text(512, 490, "THE DODOS", {
        fontFamily: "Arial Black",
        fontSize: 38,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(100);
  }
  update() {
    if (this.player) {
      this.player.update();
    }
  }
}
