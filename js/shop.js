/* ============================================================
   shop.js — IRONBOUND Arsenal-Seite
   Dynamisch: lädt Produkte via fetch() von shop-produkte.php
   Interaktive Elemente:
   - Filter-Chips: Klick filtert über PHP-API
   - Live-Suche: keyup filtert client-seitig auf geladenen Karten
   - Preis-Slider: blendet teure Produkte aus
   - Sortierung: neu laden mit sort-Parameter
   ============================================================ */


/* ── Statische Fallback-Produkte ───────────────────────────────
   Werden verwendet wenn die PHP-API nicht erreichbar ist
   (z. B. GitHub Pages ohne Server).
   ─────────────────────────────────────────────────────────── */
var FALLBACK_PRODUKTE = [
  { id:1, nummer:'001', name:'Gladius Romanus',  kategorie:'Schwerter · Einsteiger',    filter_tags:'schwerter einsteiger digital',   preis:249, skill_level:'Einsteiger',    skill_pct:35,  digital_twin:true,  bestseller:false, bild:'img/prod1-placeholder.svg' },
  { id:2, nummer:'002', name:'M4 Replika',       kategorie:'Schusswaffen · Profi',       filter_tags:'schusswaffen profi',             preis:599, skill_level:'Profi',         skill_pct:100, digital_twin:false, bestseller:true,  bild:'img/prod2-placeholder.svg' },
  { id:3, nummer:'003', name:'Langbogen 60"',    kategorie:'Bögen · Einsteiger',         filter_tags:'bogen einsteiger digital',       preis:189, skill_level:'Einsteiger',    skill_pct:30,  digital_twin:true,  bestseller:false, bild:'img/prod3-placeholder.svg' },
  { id:4, nummer:'004', name:'Kampfmesser',      kategorie:'Messer · Fortgeschritten',   filter_tags:'messer fortgeschritten',         preis:149, skill_level:'Fortgeschritten',skill_pct:65, digital_twin:false, bestseller:false, bild:'img/prod4-placeholder.svg' },
  { id:5, nummer:'005', name:'Armbrust Pro',     kategorie:'Bögen · Fortgeschritten',    filter_tags:'bogen fortgeschritten digital',  preis:399, skill_level:'Fortgeschritten',skill_pct:70, digital_twin:true,  bestseller:false, bild:'img/prod5-placeholder.svg' },
  { id:6, nummer:'006', name:'Speer Replika',    kategorie:'Stangenwaffen · Einsteiger', filter_tags:'stangenwaffen einsteiger',       preis:99,  skill_level:'Einsteiger',    skill_pct:20,  digital_twin:false, bestseller:false, bild:'img/prod6-placeholder.svg' }
];

/* Fallback-Daten client-seitig nach Filter filtern */
function fallbackAnwenden(filter) {
  if (!filter || filter === 'alle') { return FALLBACK_PRODUKTE; }
  return FALLBACK_PRODUKTE.filter(function(p) {
    return p.filter_tags.indexOf(filter) !== -1;
  });
}


/* ── Globale Variablen ─────────────────────────────────────────
   Werden befüllt sobald Produkte geladen sind.
   ─────────────────────────────────────────────────────────── */
var aktuelleProdukte = [];
/* Array mit allen Produktobjekten die zuletzt von der API kamen. */

var aktiverFilter    = 'alle';
var aktiverSort      = 'relevanz';


/* ── DOM-Elemente ──────────────────────────────────────────────
   Einmal holen, mehrfach verwenden.
   ─────────────────────────────────────────────────────────── */
var raster          = document.getElementById('inventar-raster');
var ergebnisAnzahl  = document.getElementById('ergebnis-anzahl');
var keineTrefferMsg = document.getElementById('keine-treffer');
var filterChips     = document.querySelectorAll('.filter-chip');
var sucheEingabe    = document.getElementById('suche-eingabe');
var sucheBtn        = document.getElementById('suche-btn');
var sortAuswahl     = document.getElementById('sort-auswahl');
var preisSlider     = document.getElementById('preis-slider');
var preisWert       = document.getElementById('preis-wert');


/* ── HILFSFUNKTION: Produkt-HTML erstellen ────────────────────
   Baut das HTML einer Inventar-Karte aus einem Produktobjekt.
   ─────────────────────────────────────────────────────────── */
function produktKarteHtml(p) {
  /* Badge-HTML vorbereiten */
  var badge = '';
  if (p.digital_twin) {
    badge = '<span class="twin-abzeichen">🎮 Twin</span>';
  } else if (p.bestseller) {
    badge = '<span class="bestseller-abzeichen">Bestseller</span>';
  }

  /* Skill-Level-Nummer für Anzeige ableiten */
  var skillLvl = '1';
  if (p.skill_level === 'Fortgeschritten') { skillLvl = '2'; }
  if (p.skill_level === 'Profi')           { skillLvl = '3'; }

  /* Preis formatieren: 249 → "249.–" */
  var preisFormatiert = 'CHF ' + parseFloat(p.preis).toFixed(0) + '.–';

  return (
    '<div class="inventar-karte"' +
         ' data-filter="' + p.filter_tags + '"' +
         ' data-preis="'  + p.preis       + '">' +

      '<div class="karten-nummer">' + p.nummer + '</div>' +

      '<div class="karten-bild">' +
        '<img src="' + p.bild + '" alt="' + p.name + '">' +
        badge +
      '</div>' +

      '<div class="karten-inhalt">' +
        '<div class="karten-kategorie">' + p.kategorie + '</div>' +
        '<div class="karten-name">'      + p.name      + '</div>' +

        '<div class="skill-balken">' +
          '<div class="skill-fuellung" style="width:' + p.skill_pct + '%;"></div>' +
        '</div>' +
        '<span class="skill-text">LVL ' + skillLvl + ' — ' + p.skill_level + '</span>' +

        '<div class="karten-fuss">' +
          '<span class="karten-preis">' + preisFormatiert + '</span>' +
          '<button class="btn btn-klein">+ Inventar</button>' +
        '</div>' +
      '</div>' +

    '</div>'
  );
}


/* ── HILFSFUNKTION: Raster rendern ────────────────────────────
   Nimmt Array von Produktobjekten und schreibt HTML ins Raster.
   ─────────────────────────────────────────────────────────── */
function rasterRendern(produkte) {
  if (!raster) { return; }

  if (produkte.length === 0) {
    raster.innerHTML = '';
    if (keineTrefferMsg) { keineTrefferMsg.style.display = 'block'; }
    if (ergebnisAnzahl)  { ergebnisAnzahl.textContent = '0 Produkte im Inventar'; }
    return;
  }

  if (keineTrefferMsg) { keineTrefferMsg.style.display = 'none'; }

  var html = '';
  for (var i = 0; i < produkte.length; i++) {
    html += produktKarteHtml(produkte[i]);
  }
  raster.innerHTML = html;
  /* innerHTML: setzt den gesamten HTML-Inhalt des Elements. */

  if (ergebnisAnzahl) {
    ergebnisAnzahl.textContent = produkte.length + ' Produkte im Inventar';
  }
}


/* ── HILFSFUNKTION: Laden-Spinner im Raster ───────────────────
   Zeigt Lade-Animation während fetch() läuft.
   ─────────────────────────────────────────────────────────── */
function rasterLadeAnimation(anzeigen) {
  if (!raster) { return; }
  if (anzeigen) {
    raster.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:3rem;">' +
        '<div class="spinner" style="margin:0 auto;"></div>' +
        '<p style="margin-top:1rem;color:var(--farbe-text-grau)">Laden…</p>' +
      '</div>';
  }
}


/* ── HAUPTFUNKTION: Produkte von PHP-API laden ────────────────
   Sendet GET-Request an shop-produkte.php mit optionalen
   Parametern für Filter und Sortierung.
   ─────────────────────────────────────────────────────────── */
function produkteLaden(filter, sort) {
  filter = filter || 'alle';
  sort   = sort   || 'relevanz';

  rasterLadeAnimation(true);

  /* URL mit Parametern aufbauen */
  var url = 'php/shop-produkte.php?sort=' + encodeURIComponent(sort);
  if (filter !== 'alle') {
    url += '&filter=' + encodeURIComponent(filter);
  }

  fetch(url)
    .then(function(antwort) {
      return antwort.json();
    })
    .then(function(daten) {
      if (daten.status === 'ok') {
        aktuelleProdukte = daten.produkte;
        /* Zwischenspeichern für client-seitige Suche und Preisfilter. */
        rasterRendern(aktuelleProdukte);
        preisfilterAnwenden();
      } else {
        /* DB-Fehler: Fallback-Daten verwenden */
        aktuelleProdukte = fallbackAnwenden(filter);
        rasterRendern(aktuelleProdukte);
        preisfilterAnwenden();
      }
    })
    .catch(function() {
      /* Kein Server / PHP nicht verfügbar: Fallback-Daten verwenden */
      aktuelleProdukte = fallbackAnwenden(filter);
      rasterRendern(aktuelleProdukte);
      preisfilterAnwenden();
    });
}


/* ── FILTER-CHIPS ──────────────────────────────────────────────
   Klick → aktiven Filter setzen → neu von API laden.
   ─────────────────────────────────────────────────────────── */
for (var i = 0; i < filterChips.length; i++) {
  filterChips[i].addEventListener('click', function() {
    /* Alten aktiven Chip deaktivieren */
    for (var j = 0; j < filterChips.length; j++) {
      filterChips[j].classList.remove('aktiv');
    }
    this.classList.add('aktiv');

    aktiverFilter = this.getAttribute('data-filter');
    /* Suchfeld leeren wenn Filter gewechselt wird */
    if (sucheEingabe) { sucheEingabe.value = ''; }

    produkteLaden(aktiverFilter, aktiverSort);
  });
}


/* ── LIVE-SUCHE ────────────────────────────────────────────────
   Filtert client-seitig in aktuelleProdukte (kein neuer fetch).
   ─────────────────────────────────────────────────────────── */
function sucheAusfuehren() {
  var suchbegriff = sucheEingabe ? sucheEingabe.value.toLowerCase().trim() : '';

  if (suchbegriff === '') {
    /* Leere Suche: alle geladenen Produkte zeigen */
    rasterRendern(aktuelleProdukte);
    preisfilterAnwenden();
    return;
  }

  /* Filter-Chips auf "Alle" zurücksetzen */
  for (var j = 0; j < filterChips.length; j++) {
    filterChips[j].classList.remove('aktiv');
  }
  var alleChip = document.querySelector('[data-filter="alle"]');
  if (alleChip) { alleChip.classList.add('aktiv'); }

  var gefiltert = [];
  for (var i = 0; i < aktuelleProdukte.length; i++) {
    var p    = aktuelleProdukte[i];
    var name = p.name.toLowerCase();
    var kat  = p.kategorie.toLowerCase();
    if (name.indexOf(suchbegriff) !== -1 || kat.indexOf(suchbegriff) !== -1) {
      gefiltert.push(p);
    }
  }

  rasterRendern(gefiltert);
  preisfilterAnwenden();
}

if (sucheEingabe) {
  sucheEingabe.addEventListener('keyup', sucheAusfuehren);
}
if (sucheBtn) {
  sucheBtn.addEventListener('click', sucheAusfuehren);
}


/* ── SORTIERUNG ────────────────────────────────────────────────
   Änderung → neu von API laden mit neuem sort-Parameter.
   ─────────────────────────────────────────────────────────── */
if (sortAuswahl) {
  sortAuswahl.addEventListener('change', function() {
    aktiverSort = this.value;
    produkteLaden(aktiverFilter, aktiverSort);
  });
}


/* ── PREIS-SLIDER ──────────────────────────────────────────────
   Client-seitig: blendet Karten aus die über dem Maximalpreis liegen.
   ─────────────────────────────────────────────────────────── */
function preisfilterAnwenden() {
  if (!preisSlider) { return; }
  var maxPreis = parseInt(preisSlider.value);
  var karten   = document.querySelectorAll('.inventar-karte');

  var sichtbar = 0;
  for (var i = 0; i < karten.length; i++) {
    var preis = parseFloat(karten[i].getAttribute('data-preis'));
    if (preis <= maxPreis) {
      karten[i].classList.remove('versteckt');
      sichtbar++;
    } else {
      karten[i].classList.add('versteckt');
    }
  }

  if (ergebnisAnzahl) {
    ergebnisAnzahl.textContent = sichtbar + ' Produkte im Inventar';
  }
  if (keineTrefferMsg) {
    keineTrefferMsg.style.display = (sichtbar === 0) ? 'block' : 'none';
  }
}

if (preisSlider) {
  preisSlider.addEventListener('input', function() {
    if (preisWert) { preisWert.textContent = this.value; }
    preisfilterAnwenden();
  });
}


/* ── START: Seite geladen → Produkte holen ────────────────────
   URL-Parameter auslesen: shop.html?kat=schwerter setzt Filter.
   ─────────────────────────────────────────────────────────── */
var urlParams   = new URLSearchParams(window.location.search);
/* URLSearchParams: liest GET-Parameter aus der Browser-URL. */
var katParam    = urlParams.get('kat');
/* urlParams.get('kat'): liest den Wert von ?kat=... */

if (katParam) {
  aktiverFilter = katParam;
  /* Passenden Chip aktivieren */
  var chip = document.querySelector('[data-filter="' + katParam + '"]');
  if (chip) {
    for (var k = 0; k < filterChips.length; k++) {
      filterChips[k].classList.remove('aktiv');
    }
    chip.classList.add('aktiv');
  }
}

produkteLaden(aktiverFilter, aktiverSort);
/* Sofort beim Laden der Seite: Produkte von der DB holen. */
