const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const timeText = document.getElementById("time");
const message = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const soundBtn = document.getElementById("soundBtn");

const levelText = document.getElementById("levelText");
const targetTimeText = document.getElementById("targetTime");
const levelButtons = document.querySelectorAll(".levelBtn");

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
let startTime;
let lastBulletTime;
let animationId;
let finalSurviveTime = 0;
let finalResult = "";

let audioContext;
let soundEnabled = true;

let selectedLevel = 1;
let winTime = 15;

const rankStorageKey = "bulletDodgeRankings";

const levelSettings = {
  1: {
    name: "1단계",
    winTime: 15,
    startSpawnInterval: 750,
    minSpawnInterval: 220,
    spawnDecrease: 12,
    startBulletSpeed: 2,
    speedIncrease: 0.06
  },
  2: {
    name: "2단계",
    winTime: 45,
    startSpawnInterval: 650,
    minSpawnInterval: 160,
    spawnDecrease: 10,
    startBulletSpeed: 2.3,
    speedIncrease: 0.075
  },
  3: {
    name: "3단계",
    winTime: 90,
    startSpawnInterval: 580,
    minSpawnInterval: 120,
    spawnDecrease: 8,
    startBulletSpeed: 2.6,
    speedIncrease: 0.085
  }
};

function initGame() {
  const setting = levelSettings[selectedLevel];

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
  finalSurviveTime = 0;
  finalResult = "";
  winTime = setting.winTime;

  levelText.textContent = setting.name;
  targetTimeText.textContent = setting.winTime;
  timeText.textContent = "0.0";
  message.textContent = "단계를 선택하고 게임 시작 버튼을 누르세요";

  nameInputBox.classList.add("hidden");
  nicknameInput.value = "";

  draw();
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

  gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.12);
}

function playCheerSound() {
  if (!soundEnabled || !audioContext) return;

  const now = audioContext.currentTime;

  for (let i = 0; i < 12; i++) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    const start = now + i * 0.04;
    const freq = 300 + Math.random() * 700;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(freq, start);
    oscillator.frequency.exponentialRampToValueAtTime(freq * 1.8, start + 0.25);

    gainNode.gain.setValueAtTime(0.001, start);
    gainNode.gain.exponentialRampToValueAtTime(0.08, start + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.01, start + 0.35);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(start);
    oscillator.stop(start + 0.35);
  }

  setTimeout(playVictoryTone, 250);
}

function playVictoryTone() {
  if (!soundEnabled || !audioContext) return;

  const notes = [523, 659, 784, 1046];

  notes.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    const start = audioContext.currentTime + index * 0.12;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freq, start);

    gainNode.gain.setValueAtTime(0.14, start);
    gainNode.gain.exponentialRampToValueAtTime(0.01, start + 0.25);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(start);
    oscillator.stop(start + 0.25);
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
  startTime = performance.now();
  lastBulletTime = performance.now();
  finalSurviveTime = 0;
  finalResult = "";
  nameInputBox.classList.add("hidden");

  message.textContent = `${levelSettings[selectedLevel].name} 시작! 탄막을 피하세요!`;

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
  const setting = levelSettings[selectedLevel];
  const elapsed = (timestamp - startTime) / 1000;

  const spawnInterval = Math.max(
    setting.minSpawnInterval,
    setting.startSpawnInterval - elapsed * setting.spawnDecrease
  );

  if (timestamp - lastBulletTime > spawnInterval) {
    const side = Math.floor(Math.random() * 4);
    let x, y;

    const speed = setting.startBulletSpeed + elapsed * setting.speedIncrease;

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
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    bullets.push({
      x,
      y,
      radius: 7,
      vx,
      vy
    });

    playLaserSound();

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
  if (gameOver) return;

  const now = performance.now();
  finalSurviveTime = Math.min((now - startTime) / 1000, winTime);
  finalResult = isWin ? "승리" : "패배";

  gameRunning = false;
  gameOver = true;
  cancelAnimationFrame(animationId);

  if (isWin) {
    message.textContent = `승리! ${levelSettings[selectedLevel].name} 클리어! 닉네임을 남겨주세요.`;
    playCheerSound();
  } else {
    message.textContent = `패배! ${levelSettings[selectedLevel].name} 도전 실패! 닉네임을 남겨주세요.`;
    playDisappointedSound();
  }

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
    level: levelSettings[selectedLevel].name,
    result: finalResult,
    time: Number(finalSurviveTime.toFixed(1)),
    date: new Date().toLocaleString()
  };

  const rankings = getRankings();
  rankings.push(newRecord);

  rankings.sort((a, b) => {
    if (b.time !== a.time) return b.time - a.time;
    return Number(b.result === "승리") - Number(a.result === "승리");
  });

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

  rankings.forEach((record) => {
    const li = document.createElement("li");

    li.textContent = `${record.nickname} | ${record.level} | ${record.result} | ${record.time}초 | ${record.date}`;

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

levelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (gameRunning) return;

    selectedLevel = Number(button.dataset.level);

    levelButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    initGame();
  });
});

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