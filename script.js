const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const levelText = document.getElementById("levelText");
const scoreText = document.getElementById("scoreText");
const nextLevelText = document.getElementById("nextLevelText");
const message = document.getElementById("message");
const levelUpText = document.getElementById("levelUpText");
const startText = document.getElementById("startText");

const introScreen = document.getElementById("introScreen");
const guideScreen = document.getElementById("guideScreen");
const introStartBtn = document.getElementById("introStartBtn");
const playStartBtn = document.getElementById("playStartBtn");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const soundBtn = document.getElementById("soundBtn");

const nameInputBox = document.getElementById("nameInputBox");
const nicknameInput = document.getElementById("nicknameInput");
const saveRankBtn = document.getElementById("saveRankBtn");
const rankingList = document.getElementById("rankingList");
const clearRankBtn = document.getElementById("clearRankBtn");

const playerImage = new Image();
playerImage.src = "./marine.png";

const introBgm = new Audio("./intro.mp3");
const playBgm = new Audio("./playbgm.mp3");
const startSound = new Audio("./start.mp3");
const smallGunSound = new Audio("./smallgun.mp3");
const bigGunSound = new Audio("./biggun.mp3");
const finishSound = new Audio("./finish.mp3");

introBgm.loop = true;
playBgm.loop = true;

introBgm.volume = 0.18;
playBgm.volume = 0.2;
startSound.volume = 0.8;
smallGunSound.volume = 0.35;
bigGunSound.volume = 0.65;
finishSound.volume = 0.75;

const rankStorageKey = "spaceBulletSurvivalRankingsV3";

let player;
let bullets = [];
let stars = [];
let keys = {};
let gameRunning = false;
let gameOver = false;
let isStarting = false;
let animationId = null;
let menuAnimationId = null;
let lastBulletTime = 0;
let playerDirection = "right";
let soundEnabled = true;

let score = 0;
let difficultyLevel = 1;
let finalScore = 0;
let shakeTime = 0;

function initGame() {
  player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    hitRadius: 17,
    imageWidth: 58,
    imageHeight: 70,
    speed: 4
  };

  bullets = [];
  keys = {};
  gameRunning = false;
  gameOver = false;
  isStarting = false;
  lastBulletTime = 0;
  playerDirection = "right";

  score = 0;
  difficultyLevel = 1;
  finalScore = 0;
  shakeTime = 0;

  createStars();
  stopSound(playBgm);
  stopSound(finishSound);
  hideNameInput();

  updateUI();
  message.textContent = "게임 시작 버튼을 누르세요";
  draw();
  startMenuAnimation();
}

function startMenuAnimation() {
  cancelAnimationFrame(menuAnimationId);

  function animateMenu() {
    if (gameRunning) return;
    updateStars();
    draw();
    menuAnimationId = requestAnimationFrame(animateMenu);
  }

  animateMenu();
}

function createStars() {
  stars = [];

  for (let i = 0; i < 95; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.4,
      speed: Math.random() * 0.8 + 0.2,
      alpha: Math.random() * 0.7 + 0.25
    });
  }
}

function updateStars() {
  stars.forEach((star) => {
    star.y += star.speed;

    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  });
}

function updateUI() {
  levelText.textContent = difficultyLevel;
  scoreText.textContent = score;
  nextLevelText.textContent = difficultyLevel * 10;
}

function playSound(sound) {
  if (!soundEnabled) return;

  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function stopSound(sound) {
  sound.pause();
  sound.currentTime = 0;
}

function playLoop(sound) {
  if (!soundEnabled) return;
  sound.play().catch(() => {});
}

function fadeOut(sound, duration = 600) {
  return new Promise((resolve) => {
    if (sound.paused) {
      resolve();
      return;
    }

    const startVolume = sound.volume;
    const steps = 20;
    const intervalTime = duration / steps;
    let step = 0;

    const interval = setInterval(() => {
      step += 1;
      sound.volume = Math.max(0, startVolume * (1 - step / steps));

      if (step >= steps) {
        clearInterval(interval);
        sound.pause();
        sound.currentTime = 0;
        sound.volume = startVolume;
        resolve();
      }
    }, intervalTime);
  });
}

function openGuide() {
  introScreen.classList.add("hidden");
  guideScreen.classList.remove("hidden");
  message.textContent = "미션을 확인하고 플레이 시작을 누르세요.";
  playLoop(introBgm);
}

function showStartText() {
  startText.classList.remove("hidden");
  startText.style.animation = "none";
  startText.offsetHeight;
  startText.style.animation = "";

  setTimeout(() => {
    startText.classList.add("hidden");
  }, 1080);
}

async function startGame() {
  if (gameRunning || isStarting) return;

  isStarting = true;
  startBtn.disabled = true;
  playStartBtn.disabled = true;

  introScreen.classList.add("hidden");
  guideScreen.classList.add("hidden");
  hideNameInput();
  stopSound(finishSound);

  await fadeOut(introBgm, 450);

  message.textContent = "OK, LET'S GO!";
  showStartText();
  playSound(startSound);

  setTimeout(() => {
    cancelAnimationFrame(menuAnimationId);

    bullets = [];
    gameRunning = true;
    gameOver = false;
    isStarting = false;
    startBtn.disabled = false;
    playStartBtn.disabled = false;

    lastBulletTime = performance.now();
    score = 0;
    difficultyLevel = 1;
    finalScore = 0;
    shakeTime = 0;

    message.textContent = "탄막을 최대한 많이 피하세요!";
    updateUI();

    playLoop(playBgm);
    gameLoop();
  }, 750);
}

function restartGame() {
  cancelAnimationFrame(animationId);
  cancelAnimationFrame(menuAnimationId);
  stopSound(playBgm);
  stopSound(finishSound);
  introScreen.classList.add("hidden");
  guideScreen.classList.remove("hidden");
  initGame();
  introScreen.classList.add("hidden");
  guideScreen.classList.remove("hidden");
  playLoop(introBgm);
}

function gameLoop(timestamp) {
  if (!gameRunning || gameOver) return;

  update(timestamp);
  draw();

  animationId = requestAnimationFrame(gameLoop);
}

function update(timestamp) {
  updateStars();
  movePlayer();
  createBullets(timestamp);
  moveBullets();
  checkCollision();
  updateDifficulty();
  updateUI();

  if (shakeTime > 0) {
    shakeTime -= 1;
  }
}

function movePlayer() {
  if (keys["ArrowUp"] || keys["w"] || keys["W"]) {
    player.y -= player.speed;
  }

  if (keys["ArrowDown"] || keys["s"] || keys["S"]) {
    player.y += player.speed;
  }

  if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
    player.x -= player.speed;
    playerDirection = "left";
  }

  if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
    player.x += player.speed;
    playerDirection = "right";
  }

  player.x = Math.max(player.hitRadius, Math.min(canvas.width - player.hitRadius, player.x));
  player.y = Math.max(player.hitRadius, Math.min(canvas.height - player.hitRadius, player.y));
}

function getSpawnInterval() {
  return Math.max(110, 700 - difficultyLevel * 45);
}

function getBulletSpeed() {
  return 2 + difficultyLevel * 0.36;
}

function getBulletsPerWave() {
  return Math.min(6, 1 + Math.floor(difficultyLevel / 3));
}

function createBullets(timestamp) {
  const spawnInterval = getSpawnInterval();

  if (timestamp - lastBulletTime <= spawnInterval) return;

  const bulletCount = getBulletsPerWave();

  for (let i = 0; i < bulletCount; i++) {
    createSingleBullet();
  }

  playSound(smallGunSound);
  lastBulletTime = timestamp;
}

function createSingleBullet() {
  const spawn = getSpawnPosition(16);
  const speed = getBulletSpeed();
  const angle = Math.atan2(player.y - spawn.y, player.x - spawn.x);
  const randomAngleOffset = (Math.random() - 0.5) * 0.38;

  bullets.push({
    x: spawn.x,
    y: spawn.y,
    radius: 7,
    vx: Math.cos(angle + randomAngleOffset) * speed,
    vy: Math.sin(angle + randomAngleOffset) * speed,
    counted: false,
    isBig: false,
    trail: []
  });
}

function createBigLevelUpBullet() {
  const spawn = getSpawnPosition(36);
  const speed = getBulletSpeed() * 0.82;
  const angle = Math.atan2(player.y - spawn.y, player.x - spawn.x);

  bullets.push({
    x: spawn.x,
    y: spawn.y,
    radius: 27,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    counted: false,
    isBig: true,
    trail: []
  });

  shakeTime = 16;
  playSound(bigGunSound);
}

function getSpawnPosition(offset) {
  const side = Math.floor(Math.random() * 4);

  if (side === 0) {
    return { x: Math.random() * canvas.width, y: -offset };
  }

  if (side === 1) {
    return { x: canvas.width + offset, y: Math.random() * canvas.height };
  }

  if (side === 2) {
    return { x: Math.random() * canvas.width, y: canvas.height + offset };
  }

  return { x: -offset, y: Math.random() * canvas.height };
}

function moveBullets() {
  bullets.forEach((bullet) => {
    bullet.trail.push({ x: bullet.x, y: bullet.y });
    if (bullet.trail.length > 8) bullet.trail.shift();

    bullet.x += bullet.vx;
    bullet.y += bullet.vy;

    const out =
      bullet.x < -35 ||
      bullet.x > canvas.width + 35 ||
      bullet.y < -35 ||
      bullet.y > canvas.height + 35;

    if (out && !bullet.counted) {
      score += 1;
      bullet.counted = true;
    }
  });

  bullets = bullets.filter((bullet) => {
    return (
      bullet.x > -70 &&
      bullet.x < canvas.width + 70 &&
      bullet.y > -70 &&
      bullet.y < canvas.height + 70
    );
  });
}

function updateDifficulty() {
  const newLevel = Math.floor(score / 10) + 1;

  if (newLevel > difficultyLevel) {
    difficultyLevel = newLevel;
    message.textContent = `난이도 ${difficultyLevel} 상승! 거대 탄막 등장!`;
    showLevelUp();
    createBigLevelUpBullet();
  }
}

function showLevelUp() {
  levelUpText.classList.remove("hidden");
  levelUpText.style.animation = "none";
  levelUpText.offsetHeight;
  levelUpText.style.animation = "";

  setTimeout(() => {
    levelUpText.classList.add("hidden");
  }, 780);
}

function checkCollision() {
  for (const bullet of bullets) {
    const dx = player.x - bullet.x;
    const dy = player.y - bullet.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < player.hitRadius + bullet.radius) {
      endGame();
      return;
    }
  }
}

function endGame() {
  if (gameOver) return;

  finalScore = score;
  gameRunning = false;
  gameOver = true;

  cancelAnimationFrame(animationId);
  stopSound(playBgm);

  message.textContent = `게임 종료! 총 ${finalScore}개의 총알을 피했습니다.`;
  playSound(finishSound);

  setTimeout(() => {
    playLoop(introBgm);
    startMenuAnimation();
  }, 1200);

  nameInputBox.classList.remove("hidden");
  nicknameInput.focus();
}

function saveRanking() {
  const nickname = nicknameInput.value.trim();

  if (!nickname) {
    alert("닉네임을 입력하세요.");
    return;
  }

  const rankings = getRankings();

  rankings.push({
    nickname,
    score: finalScore
  });

  rankings.sort((a, b) => b.score - a.score);

  localStorage.setItem(rankStorageKey, JSON.stringify(rankings.slice(0, 10)));

  hideNameInput();
  renderRankings();
}

function hideNameInput() {
  nameInputBox.classList.add("hidden");
  nicknameInput.value = "";
}

function getRankings() {
  const data = localStorage.getItem(rankStorageKey);
  return data ? JSON.parse(data) : [];
}

function renderRankings() {
  const rankings = getRankings();

  rankingList.innerHTML = "";

  if (rankings.length === 0) {
    rankingList.innerHTML = "<li>아직 기록이 없습니다.</li>";
    return;
  }

  rankings.forEach((record, index) => {
    const li = document.createElement("li");

    let rankIcon = `${index + 1}.`;
    if (index === 0) rankIcon = "🥇";
    if (index === 1) rankIcon = "🥈";
    if (index === 2) rankIcon = "🥉";

    li.textContent = `${rankIcon} ${record.nickname} | ${record.score}개 회피`;
    rankingList.appendChild(li);
  });
}

function clearRankings() {
  localStorage.removeItem(rankStorageKey);
  renderRankings();
}

function draw() {
  const shake = getShakeOffset();

  ctx.save();
  ctx.translate(shake.x, shake.y);

  drawBackground();
  drawBullets();
  drawPlayer();

  ctx.restore();
}

function getShakeOffset() {
  if (shakeTime <= 0) return { x: 0, y: 0 };

  return {
    x: (Math.random() - 0.5) * 8,
    y: (Math.random() - 0.5) * 8
  };
}

function drawBackground() {
  const gradient = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    40,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width
  );

  gradient.addColorStop(0, "#0f172a");
  gradient.addColorStop(0.45, "#020617");
  gradient.addColorStop(1, "#000000");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStars();
  drawGrid();
}

function drawStars() {
  stars.forEach((star) => {
    ctx.beginPath();
    ctx.globalAlpha = star.alpha;
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = "#bfdbfe";
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function drawGrid() {
  ctx.strokeStyle = "rgba(56, 189, 248, 0.07)";
  ctx.lineWidth = 1;

  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  if (playerDirection === "left") {
    ctx.scale(-1, 1);
  }

  if (playerImage.complete && playerImage.naturalWidth > 0) {
    ctx.drawImage(
      playerImage,
      -player.imageWidth / 2,
      -player.imageHeight / 2,
      player.imageWidth,
      player.imageHeight
    );
  } else {
    drawFallbackPlayer();
  }

  ctx.restore();
}

function drawFallbackPlayer() {
  ctx.beginPath();
  ctx.arc(0, 0, player.hitRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#22c55e";
  ctx.fill();
}

function drawBullets() {
  bullets.forEach((bullet) => {
    drawBulletTrail(bullet);

    ctx.save();
    ctx.shadowColor = bullet.isBig ? "#facc15" : "#ef4444";
    ctx.shadowBlur = bullet.isBig ? 24 : 12;

    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fillStyle = bullet.isBig ? "#facc15" : "#ef4444";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = bullet.isBig ? "#fef3c7" : "#fecaca";
    ctx.fill();

    ctx.restore();

    if (bullet.isBig) {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  });
}

function drawBulletTrail(bullet) {
  bullet.trail.forEach((point, index) => {
    const alpha = index / bullet.trail.length;

    ctx.beginPath();
    ctx.globalAlpha = alpha * 0.35;
    ctx.arc(point.x, point.y, bullet.radius * alpha, 0, Math.PI * 2);
    ctx.fillStyle = bullet.isBig ? "#facc15" : "#ef4444";
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

document.addEventListener("keydown", (event) => {
  keys[event.key] = true;

  if (event.key === "Enter" && !nameInputBox.classList.contains("hidden")) {
    saveRanking();
  }
});

document.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

introStartBtn.addEventListener("click", openGuide);
playStartBtn.addEventListener("click", startGame);

startBtn.addEventListener("click", () => {
  if (!gameRunning && !isStarting) {
    introScreen.classList.add("hidden");
    guideScreen.classList.remove("hidden");
    playLoop(introBgm);
  }
});

restartBtn.addEventListener("click", restartGame);
saveRankBtn.addEventListener("click", saveRanking);
clearRankBtn.addEventListener("click", clearRankings);

soundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? "사운드 ON" : "사운드 OFF";

  if (soundEnabled) {
    if (!gameRunning && !isStarting) playLoop(introBgm);
    if (gameRunning) playLoop(playBgm);
  } else {
    stopSound(introBgm);
    stopSound(playBgm);
    stopSound(startSound);
    stopSound(smallGunSound);
    stopSound(bigGunSound);
    stopSound(finishSound);
  }
});

playerImage.addEventListener("load", draw);

initGame();
renderRankings();
