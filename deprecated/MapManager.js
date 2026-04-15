function setupTestRoom() {
  // Definir tamaño del mundo (ej. 50x50 tiles)
  worldSize = vec2(50, 50);
  initTileCollision(worldSize);

  // Crear una habitación simple con paredes en los bordes
  for (let x = 0; x < worldSize.x; x++) {
    for (let y = 0; y < worldSize.y; y++) {
      if (x == 0 || y == 0 || x == worldSize.x - 1 || y == worldSize.y - 1) {
        setTileCollisionData(vec2(x, y), 1); // 1 = Pared sólida
      }
    }
  }
}
