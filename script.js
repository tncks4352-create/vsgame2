const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const levelText = document.getElementById("levelText");
const scoreText = document.getElementById("scoreText");
const nextLevelText = document.getElementById("nextLevelText");
const message = document.getElementById("message");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const soundBtn = document.getElementById("soundBtn");

const nameInputBox = document.getElementById("nameInputBox");
const nicknameInput = document.getElementById("nicknameInput");
const saveRankBtn = document.getElementById("saveRankBtn");
const rankingList = document.getElementById("rankingList");
const clearRankBtn = document.getElementById("clearRankBtn");

let player;
let bullets;
let keys;
let gameRunning;
let gameOver;
let lastBulletTime;
let animationId;

let score = 0;
let difficultyLevel = 1;
let finalScore = 0;

let audioContext;
let soundEnabled = true;

const rankStorageKey = "bulletDodgeRankingsByBullets";

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
  lastBulletTime = 0;

  score = 0;
  difficultyLevel = 1;
  finalScore = 0;

  updateUI();
  message.textContent = "게임 시작 버튼을 누르세요";

  nameInputBox.classList.add("hidden");
  nicknameInput.value = "";

  draw();
}

function updateUI() {
  levelText.textContent = difficultyLevel;
  scoreText.textContent = score;
  nextLevelText.textContent = difficultyLevel * 10;
}

function initAudio() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playLaserSound() {
  if (!soundEnabled || !audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(900, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(180, audioContext.currentTime + 0.12);

  gainNode.gain.setValueAtTime(0.09, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.12);
}

function playLevelUpSound() {
  if (!soundEnabled || !audioContext) return;

  const notes = [440, 660, 880];

  notes.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    const start = audioContext.currentTime + index * 0.08;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(freq, start);

    gainNode.gain.setValueAtTime(0.12, start);
    gainNode.gain.exponentialRampToValueAtTime(0.01, start + 0.18);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(start);
    oscillator.stop(start + 0.18);
  });
}

function playDisappointedSound() {
  if (!soundEnabled || !audioContext) return;

  const now = audioContext.currentTime;

  for (let i = 0; i < 5; i++) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    const start = now + i * 0.08;

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(240 - i * 20, start);
    oscillator.frequency.exponentialRampToValueAtTime(90, start + 0.45);

    gainNode.gain.setValueAtTime(0.001, start);
    gainNode.gain.exponentialRampToValueAtTime(0.1, start + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.01, start + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(start);
    oscillator.stop(start + 0.5);
  }
}

function startGame() {
  if (gameRunning) return;

  initAudio();

  bullets = [];
  gameRunning = true;
  gameOver = false;
  lastBulletTime = performance.now();

  score = 0;
  difficultyLevel = 1;
  finalScore = 0;

  nameInputBox.classList.add("hidden");
  message.textContent = "탄막을 최대한 많이 피하세요!";

  updateUI();
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
  updateDifficulty();
  updateUI();
}

function movePlayer() {
  if (keys["ArrowUp"] || keys["w"]) player.y -= player.speed;
  if (keys["ArrowDown"] || keys["s"]) player.y += player.speed;
  if (keys["ArrowLeft"] || keys["a"]) player.x -= player.speed;
  if (keys["ArrowRight"] || keys["d"]) player.x += player.speed;

  player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
}

function getSpawnInterval() {
  return Math.max(120, 700 - difficultyLevel * 45);
}

function getBulletSpeed() {
  return 2 + difficultyLevel * 0.35;
}

function getBulletsPerWave() {
  return Math.min(5, 1 + Math.floor(difficultyLevel / 3));
}

function createBullets(timestamp) {
  const spawnInterval = getSpawnInterval();

  if (timestamp - lastBulletTime > spawnInterval) {
    const bulletCount = getBulletsPerWave();

    for (let i = 0; i < bulletCount; i++) {
      createSingleBullet();
    }

    playLaserSound();
    lastBulletTime = timestamp;
  }
}

function createSingleBullet() {
  const side = Math.floor(Math.random() * 4);
  let x, y;

  const speed = getBulletSpeed();

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
  const randomAngleOffset = (Math.random() - 0.5) * 0.35;

  const vx = Math.cos(angle + randomAngleOffset) * speed;
  const vy = Math.sin(angle + randomAngleOffset) * speed;

  bullets.push({
    x,
    y,
    radius: 7,
    vx,
    vy,
    counted: false
  });
}

function moveBullets() {
  bullets.forEach((bullet) => {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;

    const isOut =
      bullet.x < -30 ||
      bullet.x > canvas.width + 30 ||
      bullet.y < -30 ||
      bullet.y > canvas.height + 30;

    if (isOut && !bullet.counted) {
      score += 1;
      bullet.counted = true;
    }
  });

  bullets = bullets.filter((bullet) => {
    return (
      bullet.x > -40 &&
      bullet.x < canvas.width + 40 &&
      bullet.y > -40 &&
      bullet.y < canvas.height + 40
    );
  });
}

function updateDifficulty() {
  const newLevel = Math.floor(score / 10) + 1;

  if (newLevel > difficultyLevel) {
    difficultyLevel = newLevel;
    message.textContent = `난이도 ${difficultyLevel} 상승!`;
    playLevelUpSound();
  }
}

function checkCollision() {
  for (let bullet of bullets) {
    const dx = player.x - bullet.x;
    const dy = player.y - bullet.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < player.size + bullet.radius) {
      endGame();
      break;
    }
  }
}

function endGame() {
  if (gameOver) return;

  finalScore = score;

  gameRunning = false;
  gameOver = true;
  cancelAnimationFrame(animationId);

  message.textContent = `게임 종료! 총 ${finalScore}개의 총알을 피했습니다.`;
  playDisappointedSound();

  nameInputBox.classList.remove("hidden");
  nicknameInput.focus();
}

function saveRanking() {
  const nickname = nicknameInput.value.trim();

  if (nickname === "") {
    alert("닉네임을 입력하세요.");
    return;
  }

  const newRecord = {
    nickname,
    score: finalScore
  };

  const rankings = getRankings();
  rankings.push(newRecord);

  rankings.sort((a, b) => b.score - a.score);

  const top10 = rankings.slice(0, 10);

  localStorage.setItem(rankStorageKey, JSON.stringify(top10));

  nameInputBox.classList.add("hidden");
  renderRankings();
}

function getRankings() {
  const savedData = localStorage.getItem(rankStorageKey);
  return savedData ? JSON.parse(savedData) : [];
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

  if (e.key === "Enter" && !nameInputBox.classList.contains("hidden")) {
    saveRanking();
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", restartGame);
saveRankBtn.addEventListener("click", saveRanking);
clearRankBtn.addEventListener("click", clearRankings);

soundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? "사운드 ON" : "사운드 OFF";
});

initGame();
renderRankings();