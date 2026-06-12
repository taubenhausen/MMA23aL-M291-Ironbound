/* ============================================================
   game.js — IRONBOUND Versus Runner
   Eigener Code, mindestens 15 Zeilen JS.
   Basiert auf T-Rex-Runner-Konzept, Grafiken auf Waffen-Thema angepasst.
   Startet ERST wenn User auf Start-Button klickt.
   ============================================================ */


// Canvas-Element aus dem HTML holen (das ist das Spielfeld)
var canvas = document.getElementById('game-canvas');

// 2D-Zeichenkontext holen — damit zeichnen wir alle Figuren
var ctx = canvas.getContext('2d');


// Spielzustand: alle false = Spiel läuft noch nicht beim Laden
var spielLaeuft   = false;  // true = Spiel ist aktiv
var spielPausiert = false;  // true = Spiel ist pausiert
var spielVorbei   = false;  // true = Game Over

// frameId speichert die ID von requestAnimationFrame (zum Stoppen)
var frameId = null;

// frameZaehler: erhöht sich jeden Frame — für Score und Spawn-Timing
var frameZaehler = 0;

// score = aktueller Spielstand
var score = 0;

// Highscore aus dem Browser-Speicher laden (bleibt nach Neuladen erhalten)
var highscore = parseInt(localStorage.getItem('ironbound_highscore') || '0');


// Boden-Linie: Y-Koordinate auf dem Canvas wo der Boden ist
var BODEN_Y = 170;

// Spielfeld-Breite aus dem Canvas-Element lesen
var SPIELFELD_BREITE = canvas.width;


// Spieler-Objekt: enthält alle Eigenschaften des Spielers (Schwert-Figur)
var spieler = {
  x: 80,              // X-Position (von links) — fix
  y: BODEN_Y - 50,    // Y-Position (von oben) — ändert sich beim Springen
  breite: 24,         // Breite für Kollisionserkennung
  hoehe: 50,          // Höhe für Kollisionserkennung
  sprungKraft: -13,   // Negativer Wert = nach oben (Y wächst nach unten)
  schwerkraft: 0.7,   // Zieht den Spieler pro Frame nach unten
  geschwindigkeit_y: 0, // Aktuelle vertikale Geschwindigkeit
  amBoden: true       // true = Sprung ist erlaubt
};


// Funktion: Spieler springt (wenn er am Boden ist)
function spielerSpringen() {
  // Nur springen wenn: Spiel läuft, nicht pausiert, und am Boden
  if (spieler.amBoden && spielLaeuft && !spielPausiert) {
    // Sprungkraft anwenden (negativ = nach oben)
    spieler.geschwindigkeit_y = spieler.sprungKraft;
    // Spieler ist jetzt in der Luft
    spieler.amBoden = false;
  }
}


// Funktion: Spieler-Position pro Frame berechnen (Physik)
function spielerAktualisieren() {
  // Schwerkraft auf Geschwindigkeit addieren (pro Frame wird er langsamer/schwerer)
  spieler.geschwindigkeit_y = spieler.geschwindigkeit_y + spieler.schwerkraft;

  // Neue Y-Position berechnen
  spieler.y = spieler.y + spieler.geschwindigkeit_y;

  // Boden-Kollision: Spieler darf nicht unter den Boden fallen
  if (spieler.y >= BODEN_Y - spieler.hoehe) {
    spieler.y = BODEN_Y - spieler.hoehe; // Auf Boden setzen
    spieler.geschwindigkeit_y = 0;       // Bewegung stoppen
    spieler.amBoden = true;              // Springen wieder erlauben
  }
}


// Funktion: Spieler auf dem Canvas zeichnen (Schwert-Silhouette)
function spielerZeichnen() {
  // Klinge: goldenes langes Rechteck
  ctx.fillStyle = '#c8a060';
  ctx.fillRect(spieler.x + 10, spieler.y, 4, spieler.hoehe - 14);

  // Parierstange: graues horizontales Rechteck
  ctx.fillStyle = '#888888';
  ctx.fillRect(spieler.x, spieler.y + spieler.hoehe - 18, spieler.breite, 5);

  // Griff: braunes Rechteck unten
  ctx.fillStyle = '#654321';
  ctx.fillRect(spieler.x + 9, spieler.y + spieler.hoehe - 13, 6, 13);
}


// Hindernisse-Array: wird mit Waffen-Objekten gefüllt
var hindernisse = [];

// Aktuelle Spielgeschwindigkeit (steigt mit Score)
var geschwindigkeit = 4;


// Funktion: neues Hindernis am rechten Rand erstellen
function hindernisErstellen() {
  // Drei mögliche Waffen-Formen (Speer, Schild, Lanze)
  var typen = [
    { breite: 12, hoehe: 45 },
    { breite: 20, hoehe: 28 },
    { breite: 10, hoehe: 55 },
  ];

  // Typ wählen: wechselt alle 100 Frames
  var typ = typen[Math.floor(frameZaehler / 100) % typen.length];

  // Neues Hindernis rechts ausserhalb des sichtbaren Bereichs hinzufügen
  hindernisse.push({
    x: SPIELFELD_BREITE + 20, // Startet rechts ausserhalb
    y: BODEN_Y - typ.hoehe,   // Steht auf dem Boden
    breite: typ.breite,
    hoehe: typ.hoehe
  });
}


// Funktion: alle Hindernisse pro Frame aktualisieren
function hindernisseAktualisieren() {
  // Zufälliges Spawn-Interval zwischen 90 und 110 Frames
  var interval = 90 + Math.floor(Math.random() * 20);

  // Jedes Mal wenn frameZaehler durch interval teilbar ist: neues Hindernis
  if (frameZaehler % interval === 0) {
    hindernisErstellen();
  }

  // Alle Hindernisse nach links bewegen
  for (var i = 0; i < hindernisse.length; i++) {
    hindernisse[i].x = hindernisse[i].x - geschwindigkeit;
  }

  // Hindernisse die links raus sind aus dem Array entfernen (Speicher sparen)
  var neue_liste = [];
  for (var j = 0; j < hindernisse.length; j++) {
    if (hindernisse[j].x + hindernisse[j].breite > 0) {
      neue_liste.push(hindernisse[j]);
    }
  }
  hindernisse = neue_liste;
}


// Funktion: alle Hindernisse zeichnen
function hindernisseZeichnen() {
  ctx.fillStyle = '#888888';
  for (var i = 0; i < hindernisse.length; i++) {
    var h = hindernisse[i];

    // Körper des Hindernisses (Rechteck)
    ctx.fillRect(h.x, h.y, h.breite, h.hoehe);

    // Spitze oben (Dreieck mit Canvas-Pfad)
    ctx.beginPath();                           // Neuen Pfad starten
    ctx.moveTo(h.x + h.breite / 2, h.y - 10); // Spitze oben mittig
    ctx.lineTo(h.x, h.y);                     // Linie zur linken unteren Ecke
    ctx.lineTo(h.x + h.breite, h.y);          // Linie zur rechten unteren Ecke
    ctx.closePath();                           // Pfad schliessen
    ctx.fill();                                // Füllen
  }
}


// Funktion: Kollision zwischen Spieler und Hindernissen prüfen (AABB)
function kollisionPruefen() {
  // Spieler-Box mit kleinem Puffer (damit es nicht zu streng ist)
  var px = spieler.x + 4;
  var py = spieler.y + 4;
  var pb = spieler.breite - 8;
  var ph = spieler.hoehe - 8;

  // Jedes Hindernis prüfen
  for (var i = 0; i < hindernisse.length; i++) {
    var h = hindernisse[i];
    // AABB-Kollision: Rechtecke überschneiden sich wenn alle 4 Bedingungen wahr sind
    if (px < h.x + h.breite && px + pb > h.x && py < h.y + h.hoehe && py + ph > h.y) {
      return true; // Kollision erkannt
    }
  }
  return false; // Keine Kollision
}


// Funktion: Score berechnen und im HUD anzeigen
function scoreAktualisieren() {
  // Score = Frames / 6 (ca. 10 Punkte pro Sekunde bei 60fps)
  score = Math.floor(frameZaehler / 6);

  // Geschwindigkeit alle 20 Punkte erhöhen
  geschwindigkeit = 4 + Math.floor(score / 20) * 0.3;

  // Score-Anzeige im HTML aktualisieren
  var scoreEl = document.getElementById('game-score');
  if (scoreEl) {
    scoreEl.textContent = String(score).padStart(3, '0'); // z.B. "042"
  }

  // Highscore aktualisieren wenn neuer Rekord
  if (score > highscore) {
    highscore = score;
    localStorage.setItem('ironbound_highscore', highscore); // Im Browser speichern
    var highscoreEl = document.getElementById('game-highscore');
    if (highscoreEl) {
      highscoreEl.textContent = String(highscore).padStart(3, '0');
    }
  }
}


// Funktion: Spielfeld-Hintergrund zeichnen
function hintergrundZeichnen() {
  // Dunkler Hintergrund
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(0, 0, SPIELFELD_BREITE, canvas.height);

  // Boden-Linie
  ctx.fillStyle = '#2a2a30';
  ctx.fillRect(0, BODEN_Y, SPIELFELD_BREITE, 4);

  // Bewegende Boden-Muster (erzeugt Lauf-Illusion)
  ctx.fillStyle = '#1a1a20';
  for (var i = 0; i < 6; i++) {
    // Position verschiebt sich mit jedem Frame
    var lx = ((frameZaehler * geschwindigkeit * 0.5) + i * 140) % SPIELFELD_BREITE;
    ctx.fillRect(SPIELFELD_BREITE - lx, BODEN_Y + 2, 50, 2);
  }
}


// Hilfsfunktion: Text auf dem Canvas zeichnen
function textZeichnen(text, x, y, groesse, farbe, ausrichtung) {
  ctx.font = groesse + 'px monospace'; // Schriftgrösse setzen
  ctx.fillStyle = farbe;               // Textfarbe setzen
  ctx.textAlign = ausrichtung || 'left'; // Ausrichtung (left/center/right)
  ctx.fillText(text, x, y);           // Text an Position zeichnen
  ctx.textAlign = 'left';             // Ausrichtung zurücksetzen
}


// Funktion: Start-Bildschirm zeichnen (vor Spielstart)
function startBildschirmZeichnen() {
  hintergrundZeichnen();  // Hintergrund
  spielerZeichnen();      // Spieler anzeigen
  // Anleitung-Text mittig
  textZeichnen('VERSUS RUNNER', SPIELFELD_BREITE / 2, canvas.height / 2 - 20, 18, 'rgba(200,160,96,0.9)', 'center');
  textZeichnen('Drücke STARTEN um zu spielen', SPIELFELD_BREITE / 2, canvas.height / 2 + 14, 13, 'rgba(255,255,255,0.4)', 'center');
}


// Haupt-Game-Loop: wird ca. 60x pro Sekunde aufgerufen
function spielLoop() {
  // Abbruchbedingung: nicht mehr laufen wenn Spiel gestoppt/pausiert/vorbei
  if (!spielLaeuft || spielPausiert || spielVorbei) {
    return;
  }

  frameZaehler = frameZaehler + 1; // Frame-Zähler erhöhen

  // Spiellogik aktualisieren
  spielerAktualisieren();
  hindernisseAktualisieren();
  scoreAktualisieren();

  // Kollision prüfen — wenn true: Spiel beenden
  if (kollisionPruefen()) {
    spielBeenden();
    return;
  }

  // Alles auf den Canvas zeichnen
  hintergrundZeichnen();
  hindernisseZeichnen();
  spielerZeichnen();

  // Score-Anzeige im Canvas (rechts oben)
  textZeichnen('HI ' + String(highscore).padStart(5, '0'), SPIELFELD_BREITE - 12, 20, 12, 'rgba(255,255,255,0.3)', 'right');
  textZeichnen(String(score).padStart(5, '0'), SPIELFELD_BREITE - 12, 38, 14, '#c8a060', 'right');

  // Nächsten Frame anfordern (ca. 60x/Sekunde)
  frameId = requestAnimationFrame(spielLoop);
}


// Funktion: Spiel starten (alles zurücksetzen und loop starten)
function spielStarten() {
  // Alle Variablen auf Ausgangswert setzen
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

  // Game-Over-Meldung verstecken
  var gameMeldung = document.getElementById('game-over-meldung');
  if (gameMeldung) { gameMeldung.style.display = 'none'; }

  // Highscore im HUD anzeigen
  var highscoreEl = document.getElementById('game-highscore');
  if (highscoreEl) { highscoreEl.textContent = String(highscore).padStart(3, '0'); }

  // Laufenden Frame stoppen bevor neuer startet
  cancelAnimationFrame(frameId);

  // Game-Loop starten
  spielLoop();
}


// Funktion: Pause ein/aus
function spielPausieren() {
  if (!spielLaeuft || spielVorbei) { return; } // Nur wenn Spiel läuft

  spielPausiert = !spielPausiert; // Umschalten: true→false oder false→true

  if (!spielPausiert) {
    spielLoop(); // Weiterlaufen
  } else {
    textZeichnen('— PAUSE —', SPIELFELD_BREITE / 2, canvas.height / 2, 18, 'rgba(255,255,255,0.5)', 'center');
  }
}


// Funktion: Spiel beenden (Game Over)
function spielBeenden() {
  spielLaeuft = false;
  spielVorbei = true;
  cancelAnimationFrame(frameId); // Animation stoppen

  // Game-Over-Meldung und Finalscore im HTML anzeigen
  var gameMeldung = document.getElementById('game-over-meldung');
  var finalScore  = document.getElementById('game-final-score');
  if (gameMeldung) { gameMeldung.style.display = 'block'; }
  if (finalScore)  { finalScore.textContent = score; }

  // Roten Schleier über Canvas + Text
  ctx.fillStyle = 'rgba(204, 68, 68, 0.15)';
  ctx.fillRect(0, 0, SPIELFELD_BREITE, canvas.height);
  textZeichnen('GAME OVER', SPIELFELD_BREITE / 2, canvas.height / 2 - 10, 20, '#e07070', 'center');
  textZeichnen('Score: ' + score, SPIELFELD_BREITE / 2, canvas.height / 2 + 20, 14, 'rgba(255,255,255,0.5)', 'center');
}


// Funktion: Neustart (zurück zum Startbildschirm)
function spielNeustart() {
  cancelAnimationFrame(frameId); // Laufenden Loop stoppen
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
  if (gameMeldung) { gameMeldung.style.display = 'none'; }

  var scoreEl = document.getElementById('game-score');
  if (scoreEl) { scoreEl.textContent = '000'; }

  startBildschirmZeichnen(); // Startbildschirm wieder zeigen
}


// Button-Listener: Spiel startet erst bei Klick (Anforderung!)
var startBtn = document.getElementById('game-start-btn');
var pauseBtn = document.getElementById('game-pause-btn');
var resetBtn = document.getElementById('game-reset-btn');

// Start-Button → spielStarten()
if (startBtn) { startBtn.addEventListener('click', spielStarten); }

// Pause-Button → spielPausieren()
if (pauseBtn) { pauseBtn.addEventListener('click', spielPausieren); }

// Reset-Button → spielNeustart()
if (resetBtn) { resetBtn.addEventListener('click', spielNeustart); }


// Leertaste: Springen oder Spiel starten
document.addEventListener('keydown', function(event) {
  if (event.code === 'Space') {
    event.preventDefault(); // Verhindert Seitenscroll bei Leertaste
    if (!spielLaeuft || spielVorbei) {
      spielStarten();    // Noch nicht gestartet → starten
    } else {
      spielerSpringen(); // Bereits läuft → springen
    }
  }
});

// Klick auf Canvas → Springen oder Starten
canvas.addEventListener('click', function() {
  if (!spielLaeuft || spielVorbei) { spielStarten(); }
  else { spielerSpringen(); }
});

// Touch auf Canvas (Mobile) → Springen oder Starten
canvas.addEventListener('touchstart', function(event) {
  event.preventDefault(); // Standard-Touch-Verhalten unterdrücken
  if (!spielLaeuft || spielVorbei) { spielStarten(); }
  else { spielerSpringen(); }
});


// Beim Laden: Startbildschirm zeigen (Spiel startet NICHT automatisch)
if (canvas) {
  startBildschirmZeichnen();
  var highscoreEl = document.getElementById('game-highscore');
  if (highscoreEl) { highscoreEl.textContent = String(highscore).padStart(3, '0'); }
}
