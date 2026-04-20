import * as Phaser from "phaser";
import { Player } from "../../entities/Player";
import { Crate } from "../../entities/Crate";
import { CrateGenerator } from "../../entities/CrateGenerator";
import { UIManager } from "../../managers/UIManager";
import { EffectManager } from "../../effects/EffectManager";
import { MapManager } from "../../managers/MapManager";
import { Stairs } from "../../entities/Stairs";

export class Game extends Phaser.Scene {
  private ui!: UIManager;
  private effects!: EffectManager;
  private partsCollected: number = 0;
  private player!: Player;
  private crates!: Phaser.Physics.Arcade.StaticGroup;
  private mapManager!: MapManager;
  private currentLevel: number = 0;

  constructor() {
    super("Game");
  }

  preload() {
    this.load.setPath("assets");
    this.load.tilemapTiledJSON("map", "map.json");
    this.load.image("tiles", "scenario.png");
    this.load.image("red-box", "EXPLOSIVECRATE.png");
    this.load.image("green-box", "REPAIRCRATE.png");
    this.load.image("player-sprite", "character.png");
  }

  create() {
    this.mapManager = new MapManager(this);

    this.player = new Player(this, 400, 300);
    this.physics.add.collider(this.player, this.mapManager.groundLayer);
    if (this.player) {
      this.setupCamera(this.mapManager.width, this.mapManager.height);
    }

    this.crates = this.physics.add.staticGroup();
    const generator = new CrateGenerator(this, this.crates);
    generator.startSpawning();
    this.physics.add.collider(this.player, this.crates);

    this.ui = new UIManager(this);
    this.effects = new EffectManager(this);
    this.setupEventListeners();

    const stairObjects = this.mapManager.map.getObjectLayer("Objects")?.objects;

    stairObjects?.forEach((obj) => {
      // Verificamos por nombre, tipo o clase por si acaso
      const isStair =
        obj.name === "Stairs" ||
        obj.type === "Stairs" ||
        (obj as any).class === "Stairs";

      if (isStair) {
        // Buscamos la propiedad de nivel
        const levelProp = obj.properties?.find(
          (p: any) => p.name === "goToLevel"
        );
        const levelValue = levelProp ? levelProp.value : 1;

        const stairs = new Stairs(
          this,
          obj.x! + obj.width! / 2,
          obj.y! + obj.height! / 2,
          obj.width!,
          obj.height!,
          levelValue
        );

        // Usamos overlap para que no bloquee al jugador, solo detecte que está encima
        this.physics.add.overlap(this.player, stairs, () => {
          console.log("¡Pisando escalera!");
          this.changeLevel(levelValue);
        });
      }
    });

    const climbArea =
      this.mapManager.map.getObjectLayer("ClimbZone")?.objects[0];
    if (climbArea) {
      const zone = this.add.zone(
        climbArea.x!,
        climbArea.y!,
        climbArea.width!,
        climbArea.height!
      );
      this.physics.add.existing(zone, true);

      this.physics.add.overlap(this.player, zone, () => {
        console.log("Dodo en la escalera (vía Zona)");
        this.changeLevel(1);
      });
    }
  }
  update() {
    if (this.player) {
      this.player.update();
      this.checkStairs();
      this.handleRoofTransparency();
    }
  }
  private setupEventListeners() {
    this.events.on("player_attack", (data: { x: number; y: number }) => {
      this.handleAttack(data.x, data.y);
    });

    this.events.on("player_hit", () => this.effects.screenShake());

    this.events.on("player_hp_changed", (hp: number) =>
      this.ui.updateHealthBar(hp)
    );
    this.events.on("crate_broken", (data: any) =>
      this.spawnLoot(data.x, data.y, data.type)
    );
  }

  private setupCamera(width: number, height: number) {
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }

  private updateCameraZoom() {
    let newZoom = 1.5 - this.partsCollected * 0.1;
    newZoom = Phaser.Math.Clamp(newZoom, 0.8, 1.5);
    this.cameras.main.zoomTo(newZoom, 1000, "Linear", true);
  }

  private handleAttack(x: number, y: number) {
    const hitArea = this.add.zone(x, y, 32, 32);
    this.physics.add.existing(hitArea);

    this.physics.overlap(hitArea, this.crates, (_zone, crate) => {
      (crate as Crate).takeDamage(1);
    });
    // this.physics.overlap(hitArea, this.enemies, (_zone, enemy) => {
    //   (enemy as Player).takeDamage(10);
    // });
    this.time.delayedCall(100, () => hitArea.destroy());
  }

  private spawnLoot(x: number, y: number, type: string) {
    const color = type === "REPAIR_KIT" ? 0x00ff00 : 0xff0000;
    const count = type === "REPAIR_KIT" ? 15 : 40;
    const boxSprite = type === "REPAIR_KIT" ? "green-box" : "red-box";
    this.effects.createExplosion(x, y, color, count);
    const item = this.physics.add.sprite(x, y, boxSprite, 10);

    this.physics.add.overlap(this.player, item, () => {
      if (type === "REPAIR_KIT") {
        this.partsCollected += 1;
        this.updateBuildProgress();
      }
      item.destroy();
    });
  }

  private updateBuildProgress() {
    const progress = Math.min(this.partsCollected * 20, 100);
    this.ui.updateProgress(progress);
    this.ui.updateParts(this.partsCollected);
    this.updateCameraZoom();
    if (this.partsCollected === 5) {
      console.log("has conseguido las 5 piezas");
      this.player.upgradeToChassis();
    }
  }

  public checkAttack(hitArea: Phaser.GameObjects.Zone) {
    this.physics.add.overlap(hitArea, this.crates, (_zone, crate) => {
      (crate as any).takeDamage(1);
    });
  }

  private handleRoofTransparency() {
    if (this.mapManager.roofLayer.depth < 10) {
      this.mapManager.roofLayer.alpha = 1;
      return;
    }
    const tile = this.mapManager.roofLayer.getTileAtWorldXY(
      this.player.x,
      this.player.y
    );
    if (tile) {
      this.mapManager.roofLayer.alpha = Phaser.Math.Linear(
        this.mapManager.roofLayer.alpha,
        0.3,
        0.1
      );
    } else {
      this.mapManager.roofLayer.alpha = Phaser.Math.Linear(
        this.mapManager.roofLayer.alpha,
        1,
        0.1
      );
    }
  }
  private checkStairs() {
    // Obtenemos el tile de la capa de muros donde está el jugador
    const tile = this.mapManager.groundLayer.getTileAtWorldXY(
      this.player.x,
      this.player.y
    );
    if (tile) {
      if (tile.properties.stairType === "up") {
        console.log("¡Escalera detectada!");
        this.changeLevel(1);
      }
    }
    if (tile && tile.properties.stairType) {
      if (tile.properties.stairType === "up") {
        console.log("Subiendo al techo");

        this.changeLevel(1); // Ir al techo
      } else if (tile.properties.stairType === "down") {
        console.log("bajando al suelo");
        this.changeLevel(0); // Ir al suelo
      }
    }
  }
  private changeLevel(level: number) {
    this.currentLevel = level;
    if (this.currentLevel === 1) {
      // Modo "Planta Alta"
      this.mapManager.roofLayer.setDepth(5); // El techo ahora es suelo
      this.mapManager.roofLayer.alpha = 1; // Se ve totalmente sólido
      this.player.setDepth(10); // El jugador arriba de todo
    } else {
      // Modo "Calle"
      this.mapManager.roofLayer.setDepth(100); // El techo vuelve a tapar
    }
  }
}
