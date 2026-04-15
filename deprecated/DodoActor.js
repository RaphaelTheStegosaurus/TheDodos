class DodoActor extends EngineObject {
  constructor(pos) {
    super(pos, vec2(1, 1), 0);
    this.velocity = vec2(0);

    this.speed = 0.15;
    this.renderOrder = 10; // Para que aparezca sobre el suelo
    this.color = new Color(1, 0.8, 0);

    this.isTank = false;
    this.health = 100;

    this.parts = 0;
    this.maxParts = 5;
  }

  update() {
    // Movimiento básico compatible con Web y Móvil
    let moveInput = keyDirection();

    // Si hay input, normalizamos para que no camine más rápido en diagonal
    // if (moveInput.x > 0) {
    //   moveInput = moveInput.normalize(this.speed);
    // }

    // Aplicar movimiento con colisión simple
    this.pos = this.pos.add(moveInput);

    // Llamar al update del motor para procesar físicas base
    super.update();
    // this.handleInput();
    // this.applyPhysics();
    // super.update();
  }
  render() {
    // Si no tienes el sprite cargado, dibujamos un círculo o cuadro como placeholder
    drawRect(this.pos, this.size, this.color);

    // Un pequeño "ojo" para saber hacia dónde mira
    drawRect(this.pos.add(vec2(0.3, 0.2)), vec2(0.2, 0.2), new Color(0, 0, 0));
  }

  handleInput() {
    let moveInput = isUsingGamepad
      ? gamepadStick(0)
      : vec2(keyIsDown(39) - keyIsDown(37), keyIsDown(40) - keyIsDown(38));

    this.velocity = moveInput.scale(
      this.isTank ? this.speed * 0.5 : this.speed
    );
    this.pos = this.pos.add(this.velocity);
  }

  render() {
    drawSprite(this.isTank ? TILE_TANK : TILE_DODO, this.pos);
  }
}
