/* ============================================================
   shop.js — IRONBOUND Arsenal-Seite
   Interaktive Elemente:
   - Live-Suche: keyup filtert Produkte in Echtzeit
   - Filter-Chips: Klick zeigt/versteckt Produktkarten
   - Preis-Slider: zeigt aktuellen Wert
   ============================================================ */


// ── FILTER-CHIPS ────────────────────────────────────────────────

var filterChips = document.querySelectorAll('.filter-chip');
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

for (var i = 0; i < filterChips.length; i++) {
  filterChips[i].addEventListener('click', function() {

    // Alle Chips deaktivieren
    for (var j = 0; j < filterChips.length; j++) {
      filterChips[j].classList.remove('aktiv');
    }

    // Geklickten Chip aktivieren
    this.classList.add('aktiv');

    var filter = this.getAttribute('data-filter');

    // Karten ein-/ausblenden
    for (var k = 0; k < alleKarten.length; k++) {
      var karte = alleKarten[k];
      var tags = karte.getAttribute('data-filter');

      if (filter === 'alle') {
        karte.classList.remove('versteckt');
      } else {
        if (tags.indexOf(filter) !== -1) {
          karte.classList.remove('versteckt');
        } else {
          karte.classList.add('versteckt');
        }
      }
    }

    anzeigenAktualisieren();
  });
}


// ── LIVE-SUCHE ──────────────────────────────────────────────────

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

  // Filter-Chips zurücksetzen auf "Alle"
  for (var j = 0; j < filterChips.length; j++) {
    filterChips[j].classList.remove('aktiv');
  }
  document.querySelector('[data-filter="alle"]').classList.add('aktiv');

  anzeigenAktualisieren();
}

// Bei jeder Tasteneingabe suchen
sucheEingabe.addEventListener('keyup', sucheAusfuehren);

// Bei Klick auf Suchen-Button
sucheBtn.addEventListener('click', sucheAusfuehren);


// ── PREIS-SLIDER ────────────────────────────────────────────────

var preisSlider = document.getElementById('preis-slider');
var preisWert = document.getElementById('preis-wert');

if (preisSlider) {
  preisSlider.addEventListener('input', function() {
    preisWert.textContent = this.value;
  });
}
