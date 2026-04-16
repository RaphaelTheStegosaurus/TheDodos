export enum BuildPhase {
  DODO_ALONE = 0,
  CHASSIS = 1, // Cuerpo
  MOBILE = 2, // Ruedas/Oruga/Propulsores/Piernas
  ARMED = 3, //Brazo
  MECA_COMPLETE = 4, // Robot/Tanque/Nave completo
}

export class BuildManager {
  public currentParts: number = 0;
  public partsPerPhase: number = 5;
  public addPart(): BuildPhase {
    this.currentParts++;
    return Math.floor(this.currentParts / this.partsPerPhase);
  }
}
