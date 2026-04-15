"use strict";

function gameInit() {}
function gameUpdate() {}
function gameUpdatePost() {}
function gameRender() {}
function gameRenderPost() {
  drawTextScreen("Hello World!", mainCanvasSize.scale(0.5), 80);
}
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, [
  "",
]);
