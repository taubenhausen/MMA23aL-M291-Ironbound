/**
 * game.js — Ironbound
 * Interaktives Element ③: Versus Runner Game (Canvas 2D)
 * Trigger: Spacebar / Klick / Touch-Tap = Sprung
 * Inspiration: T-Rex Runner (Chrome Dino)
 */

(function () {
  const canvas    = document.getElementById('game-canvas');
  if (!canvas) return;

  const ctx       = canvas.getContext('2d');
  const scoreEl   = document.getElementById('game-score');
  const highEl    = document.getElementById('game-highscore');
  const overMsg   = document.getElementById('game-over-msg');
  const finalEl   = document.getElementById('final-score');
  const startBtn  = document.getElementById('game-start');
  const pauseBtn  = document.getElementById('game-pause');
  const resetBtn  = document.getElementById('game-reset');

  // ── Farben (dark theme) ───────────────────────────────────────────────────
  const COL = {
    bg:       '#1e1e1e',
    ground:   '#3a3a3a',
    player:   '#d4a843',
    obstacle: '#888888',
    text:     '#888888',
    accent:   '#d4a843',
  };

  // ── Spielzustand ──────────────────────────────────────────────────────────
  const W = canvas.width;
  const H = canvas.height;
  const GROUND_Y = H - 30;

  let gameState = 'idle'; // idle | running | paused | over
  let score = 0;
  let highScore = parseInt(localStorage.getItem('ironbound_hs') || '0');
  let frameId = null;
  let frameCount = 0;
  let speed = 4;

  // Player
  const player = {
    x: 60,
    y: GROUND_Y - 40,
    w: 28,
    h: 40,
    vy: 0,
    grounded: true,
    jump() {
      if (this.grounded) {
        this.vy = -13;
        this.grounded = false;
      }
    },
    update() {
      this.vy += 0.7; // Schwerkraft
      this.y += this.vy;
      if (this.y >= GROUND_Y - this.h) {
        this.y = GROUND_Y - this.h;
        this.vy = 0;
        this.grounded = true;
      }
    },
    draw() {
      // Spieler als stilisiertes Schwert-Symbol
      ctx.fillStyle = COL.player;
      // Klinge
      ctx.fillRect(this.x + 11, this.y, 6, this.h - 10);
      // Griff
      ctx.fillStyle = '#8a6820';
      ctx.fillRect(this.x + 4, this.y + this.h - 14, 20, 5);
      ctx.fillRect(this.x + 11, this.y + this.h - 9, 6, 9);
    }
  };

  // Hindernisse
  let obstacles = [];

  // Hindernis-Typen (Waffen-Silhouetten)
  const OBSTACLE_TYPES = [
    { w: 14, h: 40, label: '⚔' },
    { w: 20, h: 28, label: '🛡' },
    { w: 10, h: 50, label: '|' },
    { w: 24, h: 20, label: '—' },
  ];

  function spawnObstacle() {
    const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
    obstacles.push({
      x: W + 20,
      y: GROUND_Y - type.h,
      w: type.w,
      h: type.h,
    });
  }

  function updateObstacles() {
    // Spawn
    const spawnInterval = Math.max(60, 120 - Math.floor(score / 5));
    if (frameCount % spawnInterval === 0) spawnObstacle();

    obstacles.forEach(o => { o.x -= speed; });
    obstacles = obstacles.filter(o => o.x + o.w > 0);
  }

  function drawObstacles() {
    ctx.fillStyle = COL.obstacle;
    obstacles.forEach(o => {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
  }

  // Kollision (AABB mit kleinem Puffer)
  function checkCollision() {
    const px = player.x + 4, py = player.y + 4;
    const pw = player.w - 8, ph = player.h - 8;
    for (const o of obstacles) {
      if (px < o.x + o.w && px + pw > o.x && py < o.y + o.h && py + ph > o.y) {
        return true;
      }
    }
    return false;
  }

  // ── Zeichnen ──────────────────────────────────────────────────────────────
  function draw() {
    // Hintergrund
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, W, H);

    // Boden
    ctx.fillStyle = COL.ground;
    ctx.fillRect(0, GROUND_Y, W, 4);

    // Laufende Bodenstriche
    ctx.fillStyle = '#2a2a2a';
    for (let i = 0; i < 5; i++) {
      const lx = ((frameCount * speed * 0.5) + i * (W / 5)) % W;
      ctx.fillRect(W - lx, GROUND_Y + 2, 40, 2);
    }

    player.draw();
    drawObstacles();

    // Score-Anzeige im Canvas
    ctx.fillStyle = COL.text;
    ctx.font = '13px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`HI ${String(highScore).padStart(5,'0')}`, W - 12, 22);
    ctx.fillStyle = COL.accent;
    ctx.fillText(String(score).padStart(5,'0'), W - 12, 40);
    ctx.textAlign = 'left';

    // Idle / Pause Text
    if (gameState === 'idle') {
      drawCenterText('Drücke STARTEN oder Leertaste', 16);
    }
    if (gameState === 'paused') {
      drawCenterText('— PAUSE —', 20);
    }
  }

  function drawCenterText(txt, size) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = `${size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(txt, W / 2, H / 2);
    ctx.textAlign = 'left';
  }

  // ── Game Loop ─────────────────────────────────────────────────────────────
  function loop() {
    if (gameState !== 'running') return;

    frameCount++;
    score = Math.floor(frameCount / 6);
    speed = 4 + Math.floor(score / 20) * 0.5; // wird schneller

    player.update();
    updateObstacles();

    if (checkCollision()) {
      gameOver();
      return;
    }

    // UI updaten
    if (scoreEl) scoreEl.textContent = score;
    if (highEl)  highEl.textContent  = highScore;

    draw();
    frameId = requestAnimationFrame(loop);
  }

  // ── Game-Over ─────────────────────────────────────────────────────────────
  function gameOver() {
    gameState = 'over';
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('ironbound_hs', highScore);
      if (highEl) highEl.textContent = highScore;
    }
    if (overMsg)   { overMsg.style.display = 'block'; }
    if (finalEl)   { finalEl.textContent = score; }
    draw();
    ctx.fillStyle = 'rgba(204,68,68,0.15)';
    ctx.fillRect(0, 0, W, H);
    drawCenterText('GAME OVER — Neustart drücken', 18);
  }

  // ── Controls ──────────────────────────────────────────────────────────────
  function startGame() {
    if (gameState === 'running') return;
    // Reset
    score = 0; frameCount = 0; speed = 4;
    player.y = GROUND_Y - player.h;
    player.vy = 0; player.grounded = true;
    obstacles = [];
    if (overMsg) overMsg.style.display = 'none';
    gameState = 'running';
    loop();
  }

  function pauseGame() {
    if (gameState === 'running') {
      gameState = 'paused';
      cancelAnimationFrame(frameId);
      draw();
    } else if (gameState === 'paused') {
      gameState = 'running';
      loop();
    }
  }

  function resetGame() {
    cancelAnimationFrame(frameId);
    gameState = 'idle';
    score = 0; frameCount = 0; speed = 4;
    player.y = GROUND_Y - player.h;
    player.vy = 0; player.grounded = true;
    obstacles = [];
    if (scoreEl) scoreEl.textContent = 0;
    if (overMsg) overMsg.style.display = 'none';
    draw();
  }

  // Sprung
  function handleJump() {
    if (gameState === 'idle' || gameState === 'over') {
      startGame();
    } else if (gameState === 'running') {
      player.jump();
    }
  }

  // Buttons
  if (startBtn) startBtn.addEventListener('click', startGame);
  if (pauseBtn) pauseBtn.addEventListener('click', pauseGame);
  if (resetBtn) resetBtn.addEventListener('click', resetGame);

  // Tastatur
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && canvas.getBoundingClientRect().top < window.innerHeight) {
      e.preventDefault();
      handleJump();
    }
  });

  // Touch / Klick auf Canvas
  canvas.addEventListener('click',     handleJump);
  canvas.addEventListener('touchstart', function(e) { e.preventDefault(); handleJump(); });

  // ── Init ──────────────────────────────────────────────────────────────────
  if (highEl) highEl.textContent = highScore;
  draw();

})();
