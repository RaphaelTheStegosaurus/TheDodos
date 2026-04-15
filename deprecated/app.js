"use strict";
let player;
let worldSize = vec2(40, 40);
function gameInit() {
  // 1. Configurar el tamaño del mapa (Tiles)
  // Usamos un tamaño de 40x40 para la Testroom inicial

  // 2. Inicializar sistema de colisiones
  // console.log(initCollision);

  // initCollision(worldSize);

  // 3. Crear la habitación de prueba (Paredes perimetrales)
  for (let x = 0; x < worldSize.x; x++) {
    for (let y = 0; y < worldSize.y; y++) {
      if (x == 0 || y == 0 || x == worldSize.x - 1 || y == worldSize.y - 1) {
        // setCollisionData(vec2(x, y), 1);
      }
    }
  }

  // 4. Instanciar al Dodo en el centro del mapa
  player = new DodoActor(worldSize.scale(0.5));
}
function gameUpdate() {
  // La cámara sigue al dodo con un suavizado (lerp)
  cameraPos = cameraPos.lerp(player.pos, 0.1);
}
function gameUpdatePost() {}
function gameRender() {
  // Dibujar el suelo de la Testroom (opcional, para referencia visual)
  drawRect(worldSize.scale(0.5), worldSize, new Color(0.2, 0.2, 0.2));
}
function gameRenderPost() {
  // UI o textos sobre el juego (útil para debug)
  drawTextScreen(
    `Dodo Position: ${player.pos.x.toFixed(1)}, ${player.pos.y.toFixed(1)}`,
    vec2(20, 20),
    20
  );
}
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, [
  "",
]);
