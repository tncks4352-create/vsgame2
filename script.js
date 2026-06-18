const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const timeText = document.getElementById("time");
const message = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

let player;
let bullets;
let keys;
let gameRunning;
let gameOver;
let startTime;
let lastBulletTime;
let animationId;

const winTime = 30;

function initGame() {
  player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 18,
    speed: 4
  };

  bullets = [];
  keys = {};
  gameRunning = false;
  gameOver = false;
  startTime = 0;
  lastBulletTime = 0;

  timeText.textContent = "0.0";
  message.textContent = "게임 시작 버튼을 누르세요";

  draw();
}

function startGame() {
  if (gameRunning) return;

  bullets = [];
  gameRunning = true;
  gameOver = false;
  startTime = performance.now();
  lastBulletTime = performance.now();
  message.textContent = "탄막을 피하세요!";

  gameLoop();
}

function restartGame() {
  cancelAnimationFrame(animationId);
  initGame();
  startGame();
}

function gameLoop(timestamp) {
  if (!gameRunning || gameOver) return;

  update(timestamp);
  draw();

  animationId = requestAnimationFrame(gameLoop);
}

function update(timestamp) {
  movePlayer();
  createBullets(timestamp);
  moveBullets();
  checkCollision();

  const surviveTime = (timestamp - startTime) / 1000;
  timeText.textContent = surviveTime.toFixed(1);

  if (surviveTime >= winTime) {
    endGame(true);
  }
}

function movePlayer() {
  if (keys["ArrowUp"] || keys["w"]) player.y -= player.speed;
  if (keys["ArrowDown"] || keys["s"]) player.y += player.speed;
  if (keys["ArrowLeft"] || keys["a"]) player.x -= player.speed;
  if (keys["ArrowRight"] || keys["d"]) player.x += player.speed;

  player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
}

function createBullets(timestamp) {
  const elapsed = (timestamp - startTime) / 1000;
  const spawnInterval = Math.max(200, 700 - elapsed * 15);

  if (timestamp - lastBulletTime > spawnInterval) {
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;

    const speed = 2 + elapsed * 0.08;

    if (side === 0) {
      x = Math.random() * canvas.width;
      y = -10;
    } else if (side === 1) {
      x = canvas.width + 10;
      y = Math.random() * canvas.height;
    } else if (side === 2) {
      x = Math.random() * canvas.width;
      y = canvas.height + 10;
    } else {
      x = -10;
      y = Math.random() * canvas.height;
    }

    const angle = Math.atan2(player.y - y, player.x - x);
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;

    bullets.push({
      x,
      y,
      radius: 7,
      vx,
      vy
    });

    lastBulletTime = timestamp;
  }
}

function moveBullets() {
  bullets.forEach((bullet) => {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
  });

  bullets = bullets.filter((bullet) => {
    return (
      bullet.x > -30 &&
      bullet.x < canvas.width + 30 &&
      bullet.y > -30 &&
      bullet.y < canvas.height + 30
    );
  });
}

function checkCollision() {
  for (let bullet of bullets) {
    const dx = player.x - bullet.x;
    const dy = player.y - bullet.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < player.size + bullet.radius) {
      endGame(false);
      break;
    }
  }
}

function endGame(isWin) {
  gameRunning = false;
  gameOver = true;
  cancelAnimationFrame(animationId);

  if (isWin) {
    message.textContent = "승리! 30초 생존 성공!";
  } else {
    message.textContent = "패배! 탄막에 맞았습니다.";
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPlayer();
  drawBullets();
}

function drawPlayer() {
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fillStyle = "#22c55e";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(player.x, player.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
}

function drawBullets() {
  bullets.forEach((bullet) => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
  });
}

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", restartGame);

initGame();