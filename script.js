import {
  Idle,
  Walk,
  Run,
  Jump,
  Fly,
  IdleAir,
  Shoot,
  ShootAir,
} from "./states.js";

window.addEventListener("load", function () {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const CANVAS_WIDTH = (canvas.width = window.innerWidth);
  const CANVAS_HEIGHT = (canvas.height = window.innerHeight);

  const scoreEl = document.getElementById("scoreEl");
  const startGameEl = document.getElementById("startGameEl");
  const killStreakEl = document.getElementById("killStreakEl");
  const startGameBtn = document.getElementById("startGameBtn");
  const restartGameEl = document.getElementById("restartGameEl");
  const restartGameBtn = document.getElementById("restartGameBtn");

  const backgroundMusic = new Audio();
  backgroundMusic.src = "./Public/Audio/BackgroundMusic.mp3";
  backgroundMusic.loop = true;

  let score = 0;
  let killStreak = 0;
  let enemies = [];
  let medkits = [];
  let fuelDrops = [];
  let gunSmokes = [];
  let particles = [];
  let projectiles = [];
  let damageMarkers = [];
  let healingEffects = [];
  const enemyTypes = ["zombie", "evilEye", "demon"];

  class InputHandler {
    constructor() {
      this.keyCodes = [];
      this.isShooting = false;
      this.intervalId = null;
      window.addEventListener("keydown", ({ keyCode }) => {
        if (
          (keyCode === 87 ||
            keyCode === 65 ||
            keyCode === 83 ||
            keyCode === 68 ||
            keyCode === 16 ||
            keyCode === 70) &&
          !this.keyCodes.includes(keyCode)
        ) {
          this.keyCodes.push(keyCode);
        }
        if (keyCode === 32) {
          if (!this.keyCodes.includes(keyCode)) this.keyCodes.push(keyCode);
          if (!this.isShooting) {
            if (!gameOver) canvas.classList.add("shake");
            this.isShooting = true;
            this.intervalId = setInterval(() => {
              this.playerX = player.x;
              this.playerY = player.y;
              projectiles.push(new Projectile(this.playerX, this.playerY));
              gunSmokes.push(new GunSmoke(this.playerX, this.playerY));
              drawGlowEffect(this.playerX + 200, this.playerY + 75);
            }, 75);
          }
        }
      });
      window.addEventListener("keyup", ({ keyCode }) => {
        if (
          keyCode === 87 ||
          keyCode === 65 ||
          keyCode === 83 ||
          keyCode === 68 ||
          keyCode === 16 ||
          keyCode === 70
        ) {
          this.keyCodes.splice(this.keyCodes.indexOf(keyCode), 1);
        }
        if (keyCode === 32) {
          canvas.classList.remove("shake");
          this.isShooting = false;
          this.keyCodes.splice(this.keyCodes.indexOf(keyCode), 1);
          if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
          }
        }
      });
      startGameBtn.addEventListener("click", () => {
        startGameEl.style.display = "none";
        init();
      });
      restartGameBtn.addEventListener("click", () => {
        restartGameEl.style.display = "none";
        init();
      });
    }
  }

  class Player {
    constructor() {
      this.maxFuel = 100;
      this.fuel = this.maxFuel;
      this.maxHealth = 100;
      this.health = this.maxHealth;
      this.width = 50;
      this.height = 50;
      this.x = 250;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.weight = 1;
      this.spriteWidth = 881;
      this.spriteHeight = 639;
      this.width = this.spriteWidth * 0.3;
      this.height = this.spriteHeight * 0.3;
      this.frameX = 0;
      this.frameY = 0;
      this.maxFramesX = 4;
      this.maxFramesY = 2;
      this.frameInterval = 25;
      this.timeToNewFrame = 0;
      this.image = document.getElementById("playerIdle");
      this.states = [
        new Idle(this),
        new Walk(this),
        new Run(this),
        new Jump(this),
        new Fly(this),
        new IdleAir(this),
        new Shoot(this),
        new ShootAir(this),
      ];
      this.currentState = this.states[5];
      this.currentState.enter();
      this.hitbox = {
        x: this.x + 100,
        y: this.y + 10,
        width: this.width / 5,
        height: this.height - 40,
      };
      this.fuelInterval = 250;
      this.timeToFuelDecrement = 0;
    }
    update(keyCodes, deltaTime) {
      this.draw();
      this.animate(deltaTime);
      this.handleInput(keyCodes);
      this.moveVertically(deltaTime);
      this.moveHorizontally();
      this.updateHitbox();
    }
    updateHitbox() {
      this.hitbox.x = this.x + 100;
      this.hitbox.y = this.y + 10;
    }
    animate(deltaTime) {
      if (this.timeToNewFrame >= this.frameInterval) {
        if (this.frameX < this.maxFramesX) this.frameX++;
        else {
          this.frameX = 0;
          if (this.frameY < this.maxFramesY) this.frameY++;
          else this.frameY = 0;
        }
        this.timeToNewFrame = 0;
      } else {
        this.timeToNewFrame += deltaTime;
      }
    }
    handleInput(codes) {
      if (
        (codes.includes(68) || codes.includes(65)) &&
        input.isShooting &&
        this.onGround()
      )
        this.vx = 0;
      else if (codes.includes(68) && !this.onGround()) this.vx = 6;
      else if (codes.includes(65) && !this.onGround()) this.vx = -6;
      else if (codes.includes(68)) this.vx = 3;
      else if (codes.includes(65)) this.vx = -3;
      else this.vx = 0;
      if (
        codes.includes(16) &&
        codes.includes(68) &&
        this.onGround() &&
        !input.isShooting
      )
        this.vx = 6;
      if (
        codes.includes(16) &&
        codes.includes(65) &&
        this.onGround() &&
        !input.isShooting
      )
        this.vx = -6;
      if (codes.includes(70) && this.onGround() && !input.isShooting)
        this.vy = -15;
      if (codes.includes(87) && this.fuel > 0) this.vy -= 1.3;
      this.currentState.handleInput(codes);
    }
    moveHorizontally() {
      this.x += this.vx;
      this.handleHorizontalBoundaries();
    }
    moveVertically(deltaTime) {
      this.y += this.vy;
      if (!this.onGround()) {
        this.vy += this.weight;
        if (this.timeToFuelDecrement >= this.fuelInterval) {
          if (this.fuel > 0) this.fuel--;
          this.timeToFuelDecrement = 0;
        } else {
          this.timeToFuelDecrement += deltaTime;
        }
      }
      if (this.y <= 0) this.vy = 1;
      this.handleVerticalBoundaries();
    }
    handleHorizontalBoundaries() {
      if (this.x <= 0) this.x = 0;
      else if (this.x >= CANVAS_WIDTH - this.width)
        this.x = CANVAS_WIDTH - this.width;
    }
    handleVerticalBoundaries() {
      if (this.y <= 0) this.y = 0;
      else if (this.y >= CANVAS_HEIGHT - this.height + 35)
        this.y = CANVAS_HEIGHT - this.height + 35;
    }
    setState(state) {
      this.currentState = this.states[state];
      this.currentState.enter();
    }
    onGround() {
      return this.y >= CANVAS_HEIGHT - this.height + 35;
    }
    draw() {
      ctx.drawImage(
        this.image,
        this.frameX * this.spriteWidth,
        this.frameY * this.spriteHeight,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  class PlayerFuelbar {
    constructor(playerFuel, playerMaxFuel) {
      this.x = CANVAS_WIDTH - 75;
      this.y = 50;
      this.width = 20;
      this.height = 150;
      this.playerFuel = playerFuel;
      this.playerMaxFuel = playerMaxFuel;
      this.currentFuel = playerFuel;
      this.targetFuel = playerFuel;
      this.alpha = 0.75;
    }
    update(updatedPlayerFuel) {
      this.targetFuel = Math.max(
        0,
        Math.min(updatedPlayerFuel, this.playerMaxFuel)
      );
      this.animateFuel();
      this.draw();
    }
    animateFuel() {
      if (Math.abs(this.currentFuel - this.targetFuel) > 0.5) {
        this.currentFuel += (this.targetFuel - this.currentFuel) * 0.1;
      } else {
        this.currentFuel = this.targetFuel;
      }
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = "#222";
      ctx.fillRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
      let gradient = ctx.createLinearGradient(
        this.x,
        this.y,
        this.x,
        this.y + this.height
      );
      gradient.addColorStop(0.5, "rgb(155, 0, 0)");
      gradient.addColorStop(0.75, "rgb(200, 0, 0)");
      gradient.addColorStop(1, "rgb(255, 0, 0)");
      const fuelHeight = (this.currentFuel / this.playerMaxFuel) * this.height;
      ctx.fillStyle = gradient;
      ctx.fillRect(
        this.x,
        this.y + (this.height - fuelHeight),
        this.width,
        fuelHeight
      );
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fff";
      ctx.strokeRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
      ctx.fillStyle = "#fff";
      ctx.font = "13px Share Tech";
      ctx.textAlign = "center";
      ctx.fillText(
        Math.round((this.currentFuel / this.playerMaxFuel) * 100) + "%",
        this.x + this.width / 2,
        this.y + this.height - 10
      );
      ctx.font = "20px Share Tech";
      ctx.fillText("Fuel", this.x + this.width / 2, this.y + this.height + 30);
      ctx.restore();
    }
  }

  class PlayerHealthbar {
    constructor(playerHealth, playerMaxHealth) {
      this.x = 0;
      this.y = 25;
      this.alpha = 1;
      this.maxFrames = 5;
      this.currentFrame = 0;
      this.spriteWidth = 64;
      this.spriteHeight = 64;
      this.frameInterval = 25;
      this.timeToNewFrame = 0;
      this.alphaChangeRate = 0.025;
      this.incrementAlpha = false;
      this.playerHealth = playerHealth;
      this.width = this.spriteWidth * 3;
      this.height = this.spriteHeight * 3;
      this.playerMaxHealth = playerMaxHealth;
      this.image = document.getElementById("heart");
    }
    update(deltaTime, updatedPlayerHealth) {
      this.draw();
      this.animate(deltaTime);
      this.playerHealth = updatedPlayerHealth;
      if (this.playerHealth <= 0) this.playerHealth = 0;
    }
    animate(deltaTime) {
      if (this.timeToNewFrame >= this.frameInterval) {
        if (this.currentFrame < this.maxFrames) this.currentFrame++;
        else this.currentFrame = 0;
        this.timeToNewFrame = 0;
        if (this.playerHealth > 75) this.frameInterval = 25;
        else if (this.playerHealth > 50) this.frameInterval = 75;
        else if (this.playerHealth > 25) this.frameInterval = 125;
        else if (this.playerHealth > 0) this.frameInterval = 175;
      } else {
        this.timeToNewFrame += deltaTime;
      }
      if (this.incrementAlpha) {
        this.alpha += this.alphaChangeRate;
        if (this.alpha >= 1) {
          this.alpha = 1;
          this.incrementAlpha = false;
        }
      } else {
        this.alpha -= this.alphaChangeRate;
        if (this.alpha <= 0.5) {
          this.alpha = 0.5;
          this.incrementAlpha = true;
        }
      }
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.drawImage(
        this.image,
        this.currentFrame * this.spriteWidth,
        0,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y,
        this.width,
        this.height
      );
      ctx.fillStyle = "white";
      ctx.font = "30px Share Tech";
      ctx.fillText(
        `${Math.ceil(this.playerHealth)}%`,
        this.x + 70,
        this.y + 140
      );
      ctx.restore();
    }
  }

  class DamageOverlay {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.spriteWidth = CANVAS_WIDTH;
      this.spriteHeight = CANVAS_HEIGHT;
      this.image = document.getElementById("damage");
    }
    update() {
      this.draw();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.drawImage(
        this.image,
        this.x,
        this.y,
        this.spriteWidth,
        this.spriteHeight
      );
      ctx.restore();
    }
  }

  class Projectile {
    constructor(x, y) {
      this.x = x + player.width * 0.5;
      this.y = y + player.height * 0.5 - 30;
      this.vx = 30;
      this.vy = Math.random() * 3 - 1.5;
      this.spriteWidth = 32;
      this.spriteHeight = 32;
      this.width = this.spriteWidth;
      this.height = this.spriteHeight;
      this.image = document.getElementById("bullet");
      this.hitbox = {
        x: this.x + 10,
        y: this.y + 11,
        width: this.width / 2,
        height: this.height / 3,
      };
    }
    update() {
      this.draw();
      this.x += this.vx;
      this.y += this.vy;
      this.updateHitbox();
    }
    updateHitbox() {
      this.hitbox.x = this.x + 10;
      this.hitbox.y = this.y + 11;
    }
    draw() {
      ctx.drawImage(
        this.image,
        this.x,
        this.y,
        this.spriteWidth,
        this.spriteHeight
      );
    }
  }

  class GunSmoke {
    constructor(x, y) {
      this.x = x + player.width * 0.5 + 50;
      this.y = y + player.height * 0.5;
      this.vx = Math.random() * 1;
      this.vy = Math.random() * 0.9 + 0.1;
      this.alpha = 1;
      this.radius = 0;
      this.alphaDecrement = Math.random() * 0.01 + 0.01;
      this.radiusIncrement = Math.random() * 0.9 + 0.1;
    }
    update() {
      this.draw();
      this.radius += this.radiusIncrement;
      this.alpha -= this.alphaDecrement;
      this.x += this.vx;
      this.y -= this.vy;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.closePath();
      ctx.restore();
    }
  }

  class Enemy {
    constructor(spriteWidth, spriteHeight, image) {
      this.spriteWidth = spriteWidth;
      this.spriteHeight = spriteHeight;
      this.x = CANVAS_WIDTH;
      this.image = image;
      this.timeToNewFrame = 0;
    }
  }

  class EnemyHealthbar {
    constructor(x, y, currentHealth, maxHealth, width) {
      this.x = x;
      this.y = y;
      this.currentHealth = currentHealth;
      this.maxHealth = maxHealth;
      this.width = width;
      this.healthColor = "white";
    }
    update(newX, newY, currentHealth) {
      this.x = newX;
      this.y = newY;
      this.currentHealth = currentHealth;
      this.draw();
    }
    draw() {
      ctx.fillStyle = "white";
      ctx.fillRect(this.x + this.width / 2, this.y - 20, this.maxHealth + 2, 8);
      ctx.fillStyle = "black";
      ctx.fillRect(this.x + this.width / 2, this.y - 19, this.maxHealth, 6);
      ctx.fillStyle = this.healthColor;
      ctx.fillRect(this.x + this.width / 2, this.y - 19, this.currentHealth, 6);
    }
  }

  class Zombie extends Enemy {
    constructor() {
      super(96, 100, document.getElementById("zombie1"));
      this.maxHealth = Math.random() * 100 + 25;
      this.health = this.maxHealth;
      this.speed = Math.random() * 10 + 5;
      this.vx = this.speed;
      this.sizeModifier = Math.random() * 0.75 + 1.25;
      this.frameInterval = this.speed + 75;
      this.width = this.spriteWidth * this.sizeModifier;
      this.height = this.spriteHeight * this.sizeModifier;
      this.y = CANVAS_HEIGHT - this.height + 5;
      this.maxFrames = 3;
      this.currentFrame = 1;
      this.hitbox = {
        x: this.x + this.width / 2,
        y: this.y + 12,
        width: this.width / 4,
        height: this.height - 12,
      };
      this.healthbar = new EnemyHealthbar(
        this.x,
        this.y,
        this.health,
        this.maxHealth,
        this.width
      );
    }
    update(deltaTime) {
      this.draw();
      this.animate(deltaTime);
      this.updateHitbox();
      this.healthbar.update(this.x, this.y, this.health);
      this.x -= this.vx;
    }
    updateHitbox() {
      this.hitbox.x = this.x + this.width / 2;
      this.hitbox.y = this.y + 12;
    }
    animate(deltaTime) {
      if (this.timeToNewFrame >= this.frameInterval) {
        this.currentFrame++;
        if (this.currentFrame > this.maxFrames) this.currentFrame = 1;
        this.image = document.getElementById(`zombie${this.currentFrame}`);
        this.timeToNewFrame = 0;
      } else {
        this.timeToNewFrame += deltaTime;
      }
    }
    draw() {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }

  class EvilEye extends Enemy {
    constructor() {
      super(32, 32, document.getElementById("eyes"));
      this.maxHealth = Math.random() * 15 + 15;
      this.health = this.maxHealth;
      this.speed = Math.random() * 20 + 10;
      this.vx = this.speed;
      this.frameInterval = this.speed + 75;
      this.sizeModifier = Math.random() * 0.5 + 1.5;
      this.width = this.spriteWidth * this.sizeModifier;
      this.height = this.spriteHeight * this.sizeModifier;
      this.y = Math.random() * CANVAS_HEIGHT;
      this.angle = Math.random() * Math.PI * 2;
      this.curve = Math.random() * 2 + 1;
      this.frequency = Math.random() * 0.05 + 0.02;
      this.randomMovementTimer = 0;
      this.randomY = 0;
      this.y = this.baseY;
      this.baseY = Math.floor(Math.random() * (this.height - 600 + 1)) + 600;
      this.frameX = 0;
      this.maxFrames = 7;
      this.frameY = Math.floor(Math.random() * 8);
      this.hitbox = {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      };
      this.healthbar = new EnemyHealthbar(
        this.x,
        this.y,
        this.health,
        this,
        this.maxHealth,
        this.width
      );
    }
    update(deltaTime) {
      this.draw();
      this.animate(deltaTime);
      this.updateHitbox();
      this.healthbar.update(this.x, this.y, this.health);
      this.move(deltaTime);
    }
    updateHitbox() {
      this.hitbox.x = this.x;
      this.hitbox.y = this.y;
    }
    move(deltaTime) {
      this.y = this.baseY + Math.sin(this.angle) * this.curve * 20;
      this.angle += this.frequency;
      this.randomMovementTimer += deltaTime;
      if (this.randomMovementTimer > 1000) {
        this.randomY = Math.random() * 30 - 15;
        this.randomMovementTimer = 0;
      }
      this.y += this.randomY;
      this.y = Math.max(0, Math.min(this.y, CANVAS_HEIGHT - this.height));
      this.hitBoxX = this.x + 20;
      this.hitBoxY = this.y + this.height / 3;
      this.x -= this.vx;
    }
    animate(deltaTime) {
      if (this.timeToNewFrame >= this.frameInterval) {
        if (this.frameX > this.maxFrames) this.frameX = 0;
        else this.frameX++;
        this.timeToNewFrame = 0;
      } else {
        this.timeToNewFrame += deltaTime;
      }
    }
    draw() {
      ctx.drawImage(
        this.image,
        this.frameX * this.spriteWidth,
        this.frameY * this.spriteHeight,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  class Demon extends Enemy {
    constructor() {
      super(81, 71, document.getElementById("demon"));
      this.maxHealth = Math.random() * 50 + 25;
      this.health = this.maxHealth;
      this.speed = Math.random() * 20 + 10;
      this.vx = this.speed;
      this.vy = 0;
      this.sizeModifier = Math.random() * 0.75 + 1.25;
      this.frameInterval = this.speed + 75;
      this.width = this.spriteWidth * this.sizeModifier;
      this.height = this.spriteHeight * this.sizeModifier;
      this.y = Math.floor(Math.random() * (this.height - 600 + 1)) + 600;
      this.angle = 0;
      this.maxFrames = 3;
      this.currentFrame = 0;
      this.hitbox = {
        x: this.x + this.width / 10,
        y: this.y + this.height / 3,
        width: this.width / 2,
        height: this.height / 2,
      };
      this.healthbar = new EnemyHealthbar(
        this.x,
        this.y,
        this.health,
        this.maxHealth,
        this.width
      );
    }
    update(deltaTime) {
      this.draw();
      this.move();
      this.animate(deltaTime);
      this.updateHitbox();
      this.healthbar.update(this.x, this.y, this.health);
    }
    move() {
      this.angle = Math.atan2(player.y - this.y, player.x - this.x);
      this.vy = Math.sin(this.angle) * this.speed * 0.75;
      this.x -= this.vx;
      this.y += this.vy;
    }
    updateHitbox() {
      this.hitbox.x = this.x + this.width / 10;
      this.hitbox.y = this.y + this.height / 3;
    }
    animate(deltaTime) {
      if (this.timeToNewFrame >= this.frameInterval) {
        this.currentFrame++;
        if (this.currentFrame > this.maxFrames) this.currentFrame = 0;
        this.timeToNewFrame = 0;
      } else {
        this.timeToNewFrame += deltaTime;
      }
    }
    draw() {
      ctx.drawImage(
        this.image,
        this.currentFrame * this.spriteWidth,
        0,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  class Witch extends Enemy {
    constructor() {
      super(64, 63, document.getElementById("witches"));
      this.maxHealth = Math.random() * 50 + 50;
      this.health = this.maxHealth;
      this.speed = Math.random() * 20 + 10;
      this.vx = this.speed;
      this.sizeModifier = Math.random() * 1.25 + 1.25;
      this.frameInterval = this.speed + 75;
      this.width = this.spriteWidth * this.sizeModifier;
      this.height = this.spriteHeight * this.sizeModifier;
      this.y = Math.floor(Math.random() * (this.height - 600 + 1)) + 600;
      this.witchType = Math.floor(Math.random() * 4);
      this.hitbox = {
        x: this.x,
        y: this.y,
        width: this.width / 2,
        height: this.height / 2,
      };
      this.healthbar = new EnemyHealthbar(
        this.x,
        this.y,
        this.health,
        this.maxHealth,
        this.width
      );
    }
    update() {
      this.draw();
      this.move();
      this.updateHitbox();
      this.healthbar.update(this.x, this.y, this.health);
    }
    move() {
      this.x -= this.vx;
    }
    updateHitbox() {
      this.hitbox.x = this.x + this.width / 4;
      this.hitbox.y = this.y + this.width / 4;
    }
    draw() {
      ctx.drawImage(
        this.image,
        this.witchType * this.spriteWidth,
        0,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  class DamageMarker {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.alpha = 0;
      this.alphaIncrement = Math.random() * 0.1 + 0.1;
      this.radius = Math.random() * 15;
      this.spriteWidth = 256;
      this.spriteHeight = 256;
      this.width = this.spriteWidth * 0.4;
      this.height = this.spriteHeight * 0.4;
      this.image = document.getElementById("bloodSplatter");
    }
    update() {
      this.draw();
      this.alpha += this.alphaIncrement;
    }
    draw() {
      ctx.save();
      ctx.beginPath();
      ctx.drawImage(
        this.image,
        this.x - this.width / 2,
        this.y - this.height / 2,
        this.width,
        this.height
      );
      ctx.globalAlpha = this.alpha;
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = Math.random() > 0.5 ? "white" : "papayawhip";
      ctx.fill();
      ctx.closePath();
      ctx.restore();
    }
  }

  class Particle {
    constructor(x, y, radius, color, velocityX, velocityY) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.vx = velocityX;
      this.vy = velocityY;
      this.alpha = 1;
      this.friction = 0.99;
    }
    update() {
      this.draw();
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= 0.01;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();
    }
  }

  class FuelDrop {
    constructor() {
      this.spriteWidth = 100;
      this.spriteHeight = 100;
      this.width = this.spriteWidth;
      this.height = this.spriteHeight;
      this.image = document.getElementById("gasCan");
      this.x =
        Math.floor(Math.random() * (this.width - CANVAS_WIDTH - 250 + 1)) +
        CANVAS_WIDTH +
        250;
      this.y = -this.height;
      this.vy = Math.random() * 4 + 1;
      this.hitbox = {
        x: this.x,
        y: this.y,
        width: this.width / 2,
        height: this.height / 2,
      };
      this.glowSize = 50;
    }
    update() {
      this.draw();
      this.updateHitbox();
      this.move();
    }
    updateHitbox() {
      this.hitbox.x = this.x + this.hitbox.width / 2;
      this.hitbox.y = this.y + this.hitbox.height / 2;
    }
    move() {
      this.y += this.vy;
    }
    draw() {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
      const gradient = ctx.createRadialGradient(
        this.x + this.width / 2,
        this.y,
        0,
        this.x + this.width / 2,
        this.y - this.glowSize / 2,
        this.glowSize
      );
      gradient.addColorStop(0, "rgba(0, 255, 0, 0.25)");
      gradient.addColorStop(1, "rgba(0, 255, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + 100,
        this.glowSize * 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
  }

  class Medkit {
    constructor() {
      this.spriteWidth = 512;
      this.spriteHeight = 512;
      this.width = this.spriteWidth * 0.25;
      this.height = this.spriteHeight * 0.25;
      this.image = document.getElementById("medkit");
      this.x =
        Math.floor(Math.random() * (this.width - CANVAS_WIDTH - 250 + 1)) +
        CANVAS_WIDTH +
        250;
      this.y = -this.height;
      this.vy = Math.random() * 4 + 1;
      this.hitbox = {
        x: this.x,
        y: this.y,
        width: this.width / 3,
        height: this.height / 3,
      };
      this.glowSize = 50;
    }
    update() {
      this.draw();
      this.updateHitbox();
      this.move();
    }
    updateHitbox() {
      this.hitbox.x = this.x + this.hitbox.width;
      this.hitbox.y = this.y + this.hitbox.height + 3;
    }
    move() {
      this.y += this.vy;
    }
    draw() {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
      const gradient = ctx.createRadialGradient(
        this.x + this.width / 2,
        this.y,
        0,
        this.x + this.width / 2,
        this.y - this.glowSize / 2,
        this.glowSize
      );
      gradient.addColorStop(0, "rgba(255, 0, 0, 0.25)");
      gradient.addColorStop(1, "rgba(255, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + 100,
        this.glowSize * 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
  }

  class HealingEffect {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.frameX = 0;
      this.maxFrames = 5;
      this.spriteWidth = 167;
      this.spriteHeight = 167;
      this.timeToNewFrame = 0;
      this.frameInterval = 100;
      this.width = this.spriteWidth;
      this.height = this.spriteHeight;
      this.image = document.getElementById("health");
    }
    update(deltaTime, newX, newY) {
      this.draw();
      this.animate(deltaTime);
      this.x = newX;
      this.y = newY;
    }
    animate(deltaTime) {
      if (this.timeToNewFrame >= this.frameInterval) {
        this.frameX++;
        this.timeToNewFrame = 0;
      } else {
        this.timeToNewFrame += deltaTime;
      }
    }
    draw() {
      ctx.drawImage(
        this.image,
        this.frameX * this.spriteWidth,
        0,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  function drawGlowEffect(playerX, playerY) {
    if (gameOver) return;
    const size = Math.random() * 50 + 50;
    const gradient = ctx.createRadialGradient(
      playerX,
      playerY,
      0,
      playerX,
      playerY,
      size
    );
    gradient.addColorStop(0, "rgba(255, 165, 0, 0.7)");
    gradient.addColorStop(1, "rgba(255, 165, 0, 0)");
    ctx.save();
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(playerX, playerY, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function checkCollision(thing1, thing2) {
    return (
      thing1.hitbox.x < thing2.hitbox.x + thing2.hitbox.width &&
      thing1.hitbox.x + thing1.hitbox.width > thing2.hitbox.x &&
      thing1.hitbox.y < thing2.hitbox.y + thing2.hitbox.height &&
      thing1.hitbox.y + thing1.hitbox.height > thing2.hitbox.y
    );
  }

  function spawnMedkit(deltaTime) {
    if (timeToNewMedkit >= medkitInterval) {
      medkits.push(new Medkit());
      timeToNewMedkit = 0;
    } else {
      timeToNewMedkit += deltaTime;
    }
  }

  function spawnFueldrop(deltaTime) {
    if (timeToFuelDrop >= fuelDropInterval) {
      fuelDrops.push(new FuelDrop());
      timeToFuelDrop = 0;
    } else {
      timeToFuelDrop += deltaTime;
    }
  }

  function spawnEnemies(deltaTime) {
    if (timeToNewEnemy >= enemyInterval) {
      const enemyType =
        enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      if (Math.random() > 0.975) enemies.push(new Witch());
      else if (enemyType === "zombie") enemies.push(new Zombie());
      else if (enemyType === "demon") enemies.push(new Demon());
      else if (enemyType === "evilEye") enemies.push(new EvilEye());
      timeToNewEnemy = 0;
      enemyInterval = Math.random() * 150 + 150;
    } else {
      timeToNewEnemy += deltaTime;
    }
  }

  function displayStatusText() {
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.font = "18px Rock Salt";
    ctx.fillStyle = "#DD444488";
    ctx.fillText("Kill Streak: " + killStreak, 28, CANVAS_HEIGHT - 28);
    ctx.fillText("Score: " + score, 28, CANVAS_HEIGHT - 68);
    ctx.fillStyle = "#EFEFEF";
    ctx.fillText("Kill Streak: " + killStreak, 30, CANVAS_HEIGHT - 30);
    ctx.fillText("Score: " + score, 28, CANVAS_HEIGHT - 70);
    ctx.restore();
  }

  function init() {
    backgroundMusic.volume = 0.5;
    backgroundMusic.currentTime = 0;
    backgroundMusic.playbackRate = 1;
    backgroundMusic.play();
    gameOver = false;
    player.y = 0;
    player.x = 250;
    player.vx = 0;
    player.vy = 0;
    player.fuel = player.maxFuel;
    player.health = player.maxHealth;
    player.currentState = player.states[5];
    player.currentState.enter();
    enemies = [];
    medkits = [];
    fuelDrops = [];
    gunSmokes = [];
    particles = [];
    projectiles = [];
    damageMarkers = [];
    healingEffects = [];
    timeToNewEnemy = 0;
    timeToNewMedkit = 0;
    timeToFuelDrop = 0;
    score = 0;
    killStreak = 0;
    animate(0);
  }

  const player = new Player();
  const input = new InputHandler();
  const playerFuelbar = new PlayerFuelbar(player.fuel, player.maxFuel);
  const playerHealthbar = new PlayerHealthbar(player.health, player.maxHealth);
  const damageOverlay = new DamageOverlay();

  let lastTime = 0;
  let gameOver = false;
  let timeToNewEnemy = 0;
  let timeToNewMedkit = 0;
  let timeToFuelDrop = 0;
  let enemyInterval = 1000;
  const medkitInterval = 10000;
  const fuelDropInterval = 10000;
  function animate(timestamp) {
    if (!gameOver) requestAnimationFrame(animate);
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    ctx.fillStyle = "#1D1C2E44";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    let isDamaged = false;
    projectiles.forEach((projectile, projectileIndex) => {
      if (projectile.x > CANVAS_WIDTH) projectiles.splice(projectileIndex, 1);
      else projectile.update();
    });
    player.update(input.keyCodes, deltaTime);
    medkits.forEach((medkit, medkitIndex) => {
      if (medkit.y > CANVAS_HEIGHT) medkits.splice(medkitIndex, 1);
      else medkit.update();
      if (checkCollision(player, medkit)) {
        medkits.splice(medkitIndex, 1);
        healingEffects.push(new HealingEffect(player.x, player.y));
        player.health += Math.random() * 50 + 25;
        if (player.health >= 100) player.health = 100;
      }
    });
    fuelDrops.forEach((drop, dropIndex) => {
      if (drop.y > CANVAS_HEIGHT) fuelDrops.splice(dropIndex, 1);
      else drop.update();
      if (checkCollision(player, drop)) {
        fuelDrops.splice(dropIndex, 1);
        player.fuel += Math.random() * 50 + 25;
        if (player.fuel >= 100) player.fuel = 100;
      }
    });
    gunSmokes.forEach((gunSmoke, gunSmokeIndex) => {
      if (gunSmoke.alpha <= 0) gunSmokes.splice(gunSmokeIndex, 1);
      else gunSmoke.update();
    });
    enemies.forEach((enemy, enemyIndex) => {
      if (enemy.health <= 0) {
        score += Math.floor(Math.random() * 20 + 5);
        killStreak++;
        document.querySelector("body").classList.add("shake");
        const particleNumbers = Math.floor(Math.random() * 100 + 50);
        for (let i = 0; i < particleNumbers; i++) {
          const particleX = enemy.x + enemy.width / 2;
          const particleY = enemy.y + enemy.height / 2;
          const particleRadius = Math.random() * 3 + 2;
          const particleColor = `rgb(${Math.floor(
            150 + Math.random() * 105
          )}, ${Math.floor(Math.random() * 100)}, ${Math.floor(
            Math.random() * 50
          )})`;
          const particleVelocityX = Math.random() * 20 - 10;
          const particleVelocityY = Math.random() * 20 - 10;
          particles.push(
            new Particle(
              particleX,
              particleY,
              particleRadius,
              particleColor,
              particleVelocityX,
              particleVelocityY
            )
          );
          setTimeout(() => {
            document.querySelector("body").classList.remove("shake");
          }, 750);
        }
      }
      if (enemy.x < -enemy.width || enemy.health <= 0) {
        enemy.health = 0;
        enemies.splice(enemyIndex, 1);
      } else enemy.update(deltaTime);
      projectiles.forEach((projectile, projectileIndex) => {
        if (checkCollision(projectile, enemy)) {
          projectiles.splice(projectileIndex, 1);
          damageMarkers.push(new DamageMarker(projectile.x, projectile.y));
          enemy.health -= Math.random() * 10 + 15;
        }
      });
      if (checkCollision(player, enemy) && !isDamaged) {
        damageOverlay.update();
        player.health -= Math.random() * 1 + 1;
        isDamaged = true;
      } else if (!checkCollision(player, enemy)) isDamaged = false;
    });
    particles.forEach((particle, particleIndex) => {
      if (particle.alpha <= 0) particles.splice(particleIndex, 1);
      else particle.update();
    });
    damageMarkers.forEach((marker, markerIndex) => {
      if (marker.alpha >= 1) damageMarkers.splice(markerIndex, 1);
      else marker.update();
    });
    healingEffects.forEach((effect, effectIndex) => {
      if (effect.frameX >= effect.maxFrames)
        healingEffects.splice(effectIndex, 1);
      else effect.update(deltaTime, player.x, player.y);
    });
    playerFuelbar.update(player.fuel);
    playerHealthbar.update(deltaTime, player.health);
    spawnMedkit(deltaTime);
    spawnEnemies(deltaTime);
    spawnFueldrop(deltaTime);
    displayStatusText();
    if (player.health <= 0) {
      gameOver = true;
      scoreEl.innerHTML = score;
      killStreakEl.innerHTML = killStreak;
      restartGameEl.style.display = "block";
      canvas.classList.remove("shake");
      document.querySelector("body").classList.remove("shake");
      backgroundMusic.volume = 0.05;
      backgroundMusic.playbackRate = 0.75;
    }
  }
});