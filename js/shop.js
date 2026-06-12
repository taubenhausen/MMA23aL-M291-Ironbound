/* ============================================================
   shop.js — IRONBOUND Arsenal-Seite
   Interaktive Elemente:
   - Live-Suche: keyup filtert Produkte in Echtzeit
   ============================================================ */


// ── LIVE-SUCHE ──────────────────────────────────────────────────

var alleKarten = document.querySelectorAll('.inventar-karte');
var ergebnisAnzahl = document.getElementById('ergebnis-anzahl');
var keineTrefferMsg = document.getElementById('keine-treffer');

function sichtbareKartenZaehlen() {
  var anzahl = 0;
  for (var i = 0; i < alleKarten.length; i++) {
    if (!alleKarten[i].classList.contains('versteckt')) {
      anzahl = anzahl + 1;
    }
  }
  return anzahl;
}

function anzeigenAktualisieren() {
  var anzahl = sichtbareKartenZaehlen();
  ergebnisAnzahl.textContent = anzahl + ' Produkte im Inventar';

  if (anzahl === 0) {
    keineTrefferMsg.style.display = 'block';
  } else {
    keineTrefferMsg.style.display = 'none';
  }
}

var sucheEingabe = document.getElementById('suche-eingabe');
var sucheBtn = document.getElementById('suche-btn');

function sucheAusfuehren() {
  var suchbegriff = sucheEingabe.value.toLowerCase().trim();

  for (var i = 0; i < alleKarten.length; i++) {
    var karte = alleKarten[i];
    var name = karte.querySelector('.karten-name').textContent.toLowerCase();
    var kategorie = karte.querySelector('.karten-kategorie').textContent.toLowerCase();

    if (suchbegriff === '') {
      karte.classList.remove('versteckt');
    } else {
      if (name.indexOf(suchbegriff) !== -1 || kategorie.indexOf(suchbegriff) !== -1) {
        karte.classList.remove('versteckt');
      } else {
        karte.classList.add('versteckt');
      }
    }
  }

  anzeigenAktualisieren();
}

// Bei jeder Tasteneingabe suchen
sucheEingabe.addEventListener('keyup', sucheAusfuehren);

// Bei Klick auf Suchen-Button
sucheBtn.addEventListener('click', sucheAusfuehren);


