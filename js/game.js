/* ============================================================
   game.js — IRONBOUND Versus Runner
   Eigener Code. Mindestens 15 Zeilen JS.
   Basiert auf T-Rex-Runner-Konzept, angepasst an Ironbound-Thema.

   Features:
   - Spiel startet ERST wenn der User auf Start klickt
   - Spieler = Schwert-Figur (thematisch angepasst)
   - Hindernisse = anfliegende Waffen-Silhouetten
   - Score steigt mit der Zeit
   - Highscore wird im Browser gespeichert (localStorage)
   - Pause-Funktion
   - Game-Over: Meldung + Score-Anzeige
   ============================================================ */


// ── Canvas und Kontext holen ────────────────────────────────────
var canvas = document.getElementById('game-canvas');
var ctx = canvas.getContext('2d');


// ── Spielzustand ────────────────────────────────────────────────
var spielLaeuft = false;
var spielPausiert = false;
var spielVorbei = false;
var frameId = null;
var frameZaehler = 0;
var score = 0;
var highscore = parseInt(localStorage.getItem('ironbound_highscore') || '0');


// ── Spielfeld-Masse ─────────────────────────────────────────────
var BODEN_Y = 170;
var SPIELFELD_BREITE = canvas.width;


// ── Spieler (Schwert-Silhouette) ────────────────────────────────
var spieler = {
  x: 80,
  y: BODEN_Y - 50,
  breite: 24,
  hoehe: 50,
  sprungKraft: -13,
  schwerkraft: 0.7,
  geschwindigkeit_y: 0,
  amBoden: true
};

function spielerSpringen() {
  if (spieler.amBoden && spielLaeuft && !spielPausiert) {
    spieler.geschwindigkeit_y = spieler.sprungKraft;
    spieler.amBoden = false;
  }
}

function spielerAktualisieren() {
  spieler.geschwindigkeit_y = spieler.geschwindigkeit_y + spieler.schwerkraft;
  spieler.y = spieler.y + spieler.geschwindigkeit_y;

  // Boden-Kollision
  if (spieler.y >= BODEN_Y - spieler.hoehe) {
    spieler.y = BODEN_Y - spieler.hoehe;
    spieler.geschwindigkeit_y = 0;
    spieler.amBoden = true;
  }
}

function spielerZeichnen() {
  ctx.fillStyle = '#c8a060';

  // Klinge (langes Rechteck)
  ctx.fillRect(spieler.x + 10, spieler.y, 4, spieler.hoehe - 14);

  // Parierstange (horizontales Rechteck)
  ctx.fillStyle = '#888888';
  ctx.fillRect(spieler.x, spieler.y + spieler.hoehe - 18, spieler.breite, 5);

  // Griff
  ctx.fillStyle = '#654321';
  ctx.fillRect(spieler.x + 9, spieler.y + spieler.hoehe - 13, 6, 13);
}


// ── Hindernisse (Waffen-Silhouetten) ────────────────────────────
var hindernisse = [];
var geschwindigkeit = 4;

function hindernisErstellen() {
  // Abwechselnd verschiedene Waffen-Formen
  var typen = [
    { breite: 12, hoehe: 45 },  // Speer
    { breite: 20, hoehe: 28 },  // Schild
    { breite: 10, hoehe: 55 },  // Lanze
  ];
  var typ = typen[Math.floor(frameZaehler / 100) % typen.length];

  hindernisse.push({
    x: SPIELFELD_BREITE + 20,
    y: BODEN_Y - typ.hoehe,
    breite: typ.breite,
    hoehe: typ.hoehe
  });
}

function hindernisseAktualisieren() {
  // Spawn-Interval: alle 90-110 Frames ein neues Hindernis
  var interval = 90 + Math.floor(Math.random() * 20);
  if (frameZaehler % interval === 0) {
    hindernisErstellen();
  }

  for (var i = 0; i < hindernisse.length; i++) {
    hindernisse[i].x = hindernisse[i].x - geschwindigkeit;
  }

  // Hindernisse die raus sind entfernen
  var neue_liste = [];
  for (var j = 0; j < hindernisse.length; j++) {
    if (hindernisse[j].x + hindernisse[j].breite > 0) {
      neue_liste.push(hindernisse[j]);
    }
  }
  hindernisse = neue_liste;
}

function hindernisseZeichnen() {
  ctx.fillStyle = '#888888';
  for (var i = 0; i < hindernisse.length; i++) {
    var h = hindernisse[i];
    // Waffe als einfaches Rechteck mit Spitze
    ctx.fillRect(h.x, h.y, h.breite, h.hoehe);
    // Spitze oben
    ctx.beginPath();
    ctx.moveTo(h.x + h.breite / 2, h.y - 10);
    ctx.lineTo(h.x, h.y);
    ctx.lineTo(h.x + h.breite, h.y);
    ctx.closePath();
    ctx.fill();
  }
}


// ── Kollisionserkennung ─────────────────────────────────────────
function kollisionPruefen() {
  var px = spieler.x + 4;
  var py = spieler.y + 4;
  var pb = spieler.breite - 8;
  var ph = spieler.hoehe - 8;

  for (var i = 0; i < hindernisse.length; i++) {
    var h = hindernisse[i];
    if (px < h.x + h.breite && px + pb > h.x && py < h.y + h.hoehe && py + ph > h.y) {
      return true;
    }
  }
  return false;
}


// ── Score ───────────────────────────────────────────────────────
function scoreAktualisieren() {
  score = Math.floor(frameZaehler / 6);

  // Geschwindigkeit erhöhen je nach Score
  geschwindigkeit = 4 + Math.floor(score / 20) * 0.3;

  // HUD aktualisieren
  var scoreEl = document.getElementById('game-score');
  var highscoreEl = document.getElementById('game-highscore');

  if (scoreEl) {
    scoreEl.textContent = String(score).padStart(3, '0');
  }
  if (score > highscore) {
    highscore = score;
    localStorage.setItem('ironbound_highscore', highscore);
    if (highscoreEl) {
      highscoreEl.textContent = String(highscore).padStart(3, '0');
    }
  }
}


// ── Hintergrund zeichnen ────────────────────────────────────────
function hintergrundZeichnen() {
  // Hintergrund
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(0, 0, SPIELFELD_BREITE, canvas.height);

  // Boden
  ctx.fillStyle = '#2a2a30';
  ctx.fillRect(0, BODEN_Y, SPIELFELD_BREITE, 4);

  // Boden-Muster (bewegende Linien)
  ctx.fillStyle = '#1a1a20';
  for (var i = 0; i < 6; i++) {
    var lx = ((frameZaehler * geschwindigkeit * 0.5) + i * 140) % SPIELFELD_BREITE;
    ctx.fillRect(SPIELFELD_BREITE - lx, BODEN_Y + 2, 50, 2);
  }
}


// ── Hilfstext im Canvas ─────────────────────────────────────────
function textZeichnen(text, x, y, groesse, farbe, ausrichtung) {
  ctx.font = groesse + 'px monospace';
  ctx.fillStyle = farbe;
  ctx.textAlign = ausrichtung || 'left';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}


// ── Start-Bildschirm ────────────────────────────────────────────
function startBildschirmZeichnen() {
  hintergrundZeichnen();
  spielerZeichnen();
  textZeichnen('VERSUS RUNNER', SPIELFELD_BREITE / 2, canvas.height / 2 - 20, 18, 'rgba(200,160,96,0.9)', 'center');
  textZeichnen('Drücke STARTEN um zu spielen', SPIELFELD_BREITE / 2, canvas.height / 2 + 14, 13, 'rgba(255,255,255,0.4)', 'center');
}


// ── Haupt-Game-Loop ─────────────────────────────────────────────
function spielLoop() {
  if (!spielLaeuft || spielPausiert || spielVorbei) {
    return;
  }

  frameZaehler = frameZaehler + 1;

  // Aktualisieren
  spielerAktualisieren();
  hindernisseAktualisieren();
  scoreAktualisieren();

  // Kollision prüfen
  if (kollisionPruefen()) {
    spielBeenden();
    return;
  }

  // Zeichnen
  hintergrundZeichnen();
  hindernisseZeichnen();
  spielerZeichnen();

  // Score im Canvas
  textZeichnen('HI ' + String(highscore).padStart(5, '0'), SPIELFELD_BREITE - 12, 20, 12, 'rgba(255,255,255,0.3)', 'right');
  textZeichnen(String(score).padStart(5, '0'), SPIELFELD_BREITE - 12, 38, 14, '#c8a060', 'right');

  frameId = requestAnimationFrame(spielLoop);
}


// ── Spiel starten ───────────────────────────────────────────────
function spielStarten() {
  // Reset
  score = 0;
  frameZaehler = 0;
  geschwindigkeit = 4;
  hindernisse = [];
  spieler.y = BODEN_Y - spieler.hoehe;
  spieler.geschwindigkeit_y = 0;
  spieler.amBoden = true;

  spielLaeuft = true;
  spielPausiert = false;
  spielVorbei = false;

  // Game-Over Meldung verstecken
  var gameMeldung = document.getElementById('game-over-meldung');
  if (gameMeldung) {
    gameMeldung.style.display = 'none';
  }

  // Highscore im HUD zeigen
  var highscoreEl = document.getElementById('game-highscore');
  if (highscoreEl) {
    highscoreEl.textContent = String(highscore).padStart(3, '0');
  }

  cancelAnimationFrame(frameId);
  spielLoop();
}


// ── Spiel pausieren / fortsetzen ────────────────────────────────
function spielPausieren() {
  if (!spielLaeuft || spielVorbei) {
    return;
  }

  spielPausiert = !spielPausiert;

  if (!spielPausiert) {
    spielLoop();
  } else {
    textZeichnen('— PAUSE —', SPIELFELD_BREITE / 2, canvas.height / 2, 18, 'rgba(255,255,255,0.5)', 'center');
  }
}


// ── Spiel beenden ───────────────────────────────────────────────
function spielBeenden() {
  spielLaeuft = false;
  spielVorbei = true;
  cancelAnimationFrame(frameId);

  // Game-Over Meldung anzeigen
  var gameMeldung = document.getElementById('game-over-meldung');
  var finalScore = document.getElementById('game-final-score');
  if (gameMeldung) {
    gameMeldung.style.display = 'block';
  }
  if (finalScore) {
    finalScore.textContent = score;
  }

  // Auf Canvas malen
  ctx.fillStyle = 'rgba(204, 68, 68, 0.15)';
  ctx.fillRect(0, 0, SPIELFELD_BREITE, canvas.height);
  textZeichnen('GAME OVER', SPIELFELD_BREITE / 2, canvas.height / 2 - 10, 20, '#e07070', 'center');
  textZeichnen('Score: ' + score, SPIELFELD_BREITE / 2, canvas.height / 2 + 20, 14, 'rgba(255,255,255,0.5)', 'center');
}


// ── Neustart ────────────────────────────────────────────────────
function spielNeustart() {
  cancelAnimationFrame(frameId);
  spielLaeuft = false;
  spielVorbei = false;
  spielPausiert = false;
  score = 0;
  frameZaehler = 0;
  geschwindigkeit = 4;
  hindernisse = [];
  spieler.y = BODEN_Y - spieler.hoehe;
  spieler.geschwindigkeit_y = 0;
  spieler.amBoden = true;

  var gameMeldung = document.getElementById('game-over-meldung');
  if (gameMeldung) {
    gameMeldung.style.display = 'none';
  }

  var scoreEl = document.getElementById('game-score');
  if (scoreEl) {
    scoreEl.textContent = '000';
  }

  startBildschirmZeichnen();
}


// ── Button Event-Listener ────────────────────────────────────────
var startBtn = document.getElementById('game-start-btn');
var pauseBtn = document.getElementById('game-pause-btn');
var resetBtn = document.getElementById('game-reset-btn');

if (startBtn) {
  startBtn.addEventListener('click', spielStarten);
}

if (pauseBtn) {
  pauseBtn.addEventListener('click', spielPausieren);
}

if (resetBtn) {
  resetBtn.addEventListener('click', spielNeustart);
}

// Leertaste = Sprung
document.addEventListener('keydown', function(event) {
  if (event.code === 'Space') {
    event.preventDefault();
    if (!spielLaeuft || spielVorbei) {
      spielStarten();
    } else {
      spielerSpringen();
    }
  }
});

// Klick/Touch auf Canvas = Sprung
canvas.addEventListener('click', function() {
  if (!spielLaeuft || spielVorbei) {
    spielStarten();
  } else {
    spielerSpringen();
  }
});

canvas.addEventListener('touchstart', function(event) {
  event.preventDefault();
  if (!spielLaeuft || spielVorbei) {
    spielStarten();
  } else {
    spielerSpringen();
  }
});


// ── Start-Bildschirm beim Laden ──────────────────────────────────
// Spiel startet NICHT automatisch — erst bei Button-Klick
if (canvas) {
  startBildschirmZeichnen();

  var highscoreEl = document.getElementById('game-highscore');
  if (highscoreEl) {
    highscoreEl.textContent = String(highscore).padStart(3, '0');
  }
}
