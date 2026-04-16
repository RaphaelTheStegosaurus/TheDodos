import * as Phaser from "phaser";
import { RepairCrate } from "./RepairCrate";
import { ExplosiveCrate } from "./ExplosiveCrate";
import { Crate } from "./Crate";

export class CrateGenerator {
  private scene: Phaser.Scene;
  private group: Phaser.Physics.Arcade.StaticGroup;
  private maxCrates: number = 20; // Control de elementos en pantalla

  constructor(scene: Phaser.Scene, group: Phaser.Physics.Arcade.StaticGroup) {
    this.scene = scene;
    this.group = group;
  }

  public startSpawning() {
    // Configura un temporizador con tiempo al azar entre 3 y 7 segundos
    this.scene.time.addEvent({
      delay: Phaser.Math.Between(3000, 7000),
      callback: this.spawnRandomCrate,
      callbackScope: this,
      loop: true,
    });
  }

  private spawnRandomCrate() {
    // Control de población: no crear más si alcanzamos el límite
    if (this.group.getLength() >= this.maxCrates) return;

    // Coordenadas al azar dentro del mapa de 100x100 tiles (3200px)
    const x = Phaser.Math.Between(100, 3100);
    const y = Phaser.Math.Between(100, 3100);

    // Sistema de probabilidades
    const rand = Phaser.Math.FloatBetween(0, 1);
    let newCrate: Crate;

    if (rand < 0.2) {
      // 20% Probabilidad de caja explosiva
      newCrate = new ExplosiveCrate(this.scene, x, y);
    } else {
      // 80% Probabilidad de caja de reparación
      newCrate = new RepairCrate(this.scene, x, y);
    }

    this.group.add(newCrate);
  }
}
