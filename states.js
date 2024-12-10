const states = {
  IDLE: 0,
  WALK: 1,
  RUN: 2,
  JUMP: 3,
  FLY: 4,
  IDLEAIR: 5,
  SHOOT: 6,
  SHOOTAIR: 7,
};

class State {
  constructor(state, player) {
    this.state = state;
    this.player = player;
  }
  enter(maxFramesX, maxFramesY, spriteId) {
    this.player.frameX = 0;
    this.player.frameY = 0;
    this.player.maxFramesX = maxFramesX;
    this.player.maxFramesY = maxFramesY;
    this.player.image = document.getElementById(spriteId);
  }
}

export class Idle extends State {
  constructor(player) {
    super("IDLE", player);
  }
  enter() {
    super.enter(4, 2, "playerIdle");
  }
  handleInput(input) {
    if (input.includes(87) && !this.player.onGround() && this.player.fuel > 0)
      this.player.setState(states.IDLEAIR);
    if (input.includes(68) || input.includes(65))
      this.player.setState(states.WALK);
    if (input.includes(70)) this.player.setState(states.JUMP);
    if (input.includes(32) && this.player.onGround())
      this.player.setState(states.SHOOT);
  }
}

export class Walk extends State {
  constructor(player) {
    super("WALK", player);
  }
  enter() {
    super.enter(4, 2, "playerWalk");
  }
  handleInput(input) {
    if (!input.includes(68) && !input.includes(65))
      this.player.setState(states.IDLE);
    else if (input.includes(16)) this.player.setState(states.RUN);
    if (input.includes(70)) this.player.setState(states.JUMP);
    if (input.includes(87) && !this.player.onGround() && this.player.fuel > 0)
      this.player.setState(states.FLY);
    if (input.includes(32) && this.player.onGround())
      this.player.setState(states.SHOOT);
  }
}

export class Run extends State {
  constructor(player) {
    super("RUN", player);
  }
  enter() {
    super.enter(4, 2, "playerRun");
  }
  handleInput(input) {
    if (!input.includes(16)) this.player.setState(states.WALK);
    else if (!input.includes(65) && !input.includes(68))
      this.player.setState(states.IDLE);
    if (input.includes(70)) this.player.setState(states.JUMP);
    if (input.includes(87) && !this.player.onGround() && this.player.fuel > 0)
      this.player.setState(states.FLY);
    if (input.includes(32) && this.player.onGround())
      this.player.setState(states.SHOOT);
  }
}

export class Jump extends State {
  constructor(player) {
    super("JUMP", player);
  }
  enter() {
    super.enter(4, 1, "playerJump");
  }
  handleInput(input) {
    if (this.player.onGround()) this.player.setState(states.WALK);
    if (input.includes(87) && !this.player.onGround() && this.player.fuel > 0)
      this.player.setState(states.FLY);
  }
}

export class Fly extends State {
  constructor(player) {
    super("FLY", player);
  }
  enter() {
    super.enter(4, 2, "playerFlying");
  }
  handleInput(input) {
    if (input.includes(32)) this.player.setState(states.SHOOTAIR);
    if (!input.includes(68) && !input.includes(65) && !this.player.onGround())
      this.player.setState(states.IDLEAIR);
    if (this.player.onGround()) this.player.setState(states.IDLE);
  }
}

export class IdleAir extends State {
  constructor(player) {
    super("IDLEAIR", player);
  }
  enter() {
    super.enter(4, 1, "playerIdleAir");
  }
  handleInput(input) {
    if (input.includes(32)) this.player.setState(states.SHOOTAIR);
    if ((input.includes(68) || input.includes(65)) && !this.player.onGround())
      this.player.setState(states.FLY);
    if (this.player.onGround()) this.player.setState(states.IDLE);
  }
}

export class Shoot extends State {
  constructor(player) {
    super("SHOOT", player);
  }
  enter() {
    super.enter(4, 0, "playerShoot");
  }
  handleInput(input) {
    if (input.includes(32) && !this.player.onGround())
      this.player.setState(states.SHOOTAIR);
    if (!input.includes(32)) this.player.setState(states.IDLE);
  }
}

export class ShootAir extends State {
  constructor(player) {
    super("SHOOTAIR", player);
  }
  enter() {
    super.enter(4, 1, "playerShootAir");
  }
  handleInput(input) {
    if (this.player.onGround()) this.player.setState(states.IDLE);
    if (!input.includes(32) && this.player.onGround())
      this.player.setState(states.IDLE);
    else if (!input.includes(32) && !this.player.onGround())
      this.player.setState(states.IDLEAIR);
  }
}