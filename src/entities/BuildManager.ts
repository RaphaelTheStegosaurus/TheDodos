export enum BuildPhase {
  DODO_ALONE = 0,
  CHASSIS = 1, // El dodo ya tiene la base del tanque
  MOBILE = 2, // Ya tiene orugas/ruedas
  ARMED = 3, // Ya tiene cañón
  MECA_COMPLETE = 4, // Robot completo
}

export class BuildManager {
  public currentParts: number = 0;
  public partsPerPhase: number = 5; // Cada 5 RepairCrates sube de fase

  public addPart(): BuildPhase {
    this.currentParts++;
    // Calculamos la fase actual basándonos en las partes
    return Math.floor(this.currentParts / this.partsPerPhase);
  }
}
