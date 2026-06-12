/* ============================================================
   shop.js — IRONBOUND Arsenal-Seite

   Aufgabe dieser Datei:
   - Produkte im Raster anzeigen
   - Filter-Chips auswerten
   - Suche auswerten
   - Optional Sortierung und Preis-Slider unterstützen
   - Fallback-Produkte anzeigen, falls PHP/DB nicht erreichbar ist

   Wichtig:
   Die CSS-Klassen bleiben gleich wie vorher. Darum bleibt das
   Aussehen der Produktkarten unverändert.
   ============================================================ */


/* ─────────────────────────────────────────────────────────────
   1. Fallback-Produkte
   -------------------------------------------------------------
   Diese Daten werden genutzt, wenn die PHP-API nicht erreichbar ist,
   zum Beispiel beim lokalen Öffnen der HTML-Datei oder auf GitHub Pages.
   ─────────────────────────────────────────────────────────── */
var FALLBACK_PRODUKTE = [
  { id: 1, nummer: '001', name: 'Gladius Romanus', kategorie: 'Schwerter · Einsteiger', filter_tags: 'schwerter einsteiger digital', preis: 249, skill_level: 'Einsteiger', skill_pct: 35, digital_twin: true, bestseller: false, bild: 'img/prod1-placeholder.svg' },
  { id: 2, nummer: '002', name: 'M4 Replika', kategorie: 'Schusswaffen · Profi', filter_tags: 'schusswaffen profi', preis: 599, skill_level: 'Profi', skill_pct: 100, digital_twin: false, bestseller: true, bild: 'img/prod2-placeholder.svg' },
  { id: 3, nummer: '003', name: 'Langbogen 60"', kategorie: 'Bögen · Einsteiger', filter_tags: 'bogen einsteiger digital', preis: 189, skill_level: 'Einsteiger', skill_pct: 30, digital_twin: true, bestseller: false, bild: 'img/prod3-placeholder.svg' },
  { id: 4, nummer: '004', name: 'Kampfmesser', kategorie: 'Messer · Fortgeschritten', filter_tags: 'messer fortgeschritten', preis: 149, skill_level: 'Fortgeschritten', skill_pct: 65, digital_twin: false, bestseller: false, bild: 'img/prod4-placeholder.svg' },
  { id: 5, nummer: '005', name: 'Armbrust Pro', kategorie: 'Bögen · Fortgeschritten', filter_tags: 'bogen fortgeschritten digital', preis: 399, skill_level: 'Fortgeschritten', skill_pct: 70, digital_twin: true, bestseller: false, bild: 'img/prod5-placeholder.svg' },
  { id: 6, nummer: '006', name: 'Speer Replika', kategorie: 'Stangenwaffen · Einsteiger', filter_tags: 'stangenwaffen einsteiger', preis: 99, skill_level: 'Einsteiger', skill_pct: 20, digital_twin: false, bestseller: false, bild: 'img/prod6-placeholder.svg' }
];


/* ─────────────────────────────────────────────────────────────
   2. Aktueller Zustand der Shop-Seite
   -------------------------------------------------------------
   Diese Variablen merken sich, welcher Filter, welche Sortierung und
   welche Produktliste gerade aktiv sind.
   ─────────────────────────────────────────────────────────── */
var shopProdukte = [];
var aktiverFilter = 'alle';
var aktiverSort = 'relevanz';


/* ─────────────────────────────────────────────────────────────
   3. Fallback-Daten filtern
   -------------------------------------------------------------
   Die Datenbank filtert serverseitig. Der Fallback muss im Browser
   gefiltert werden, weil dort kein PHP läuft.
   ─────────────────────────────────────────────────────────── */
function fallbackFiltern(filter) {
  if (!filter || filter === 'alle') {
    return FALLBACK_PRODUKTE.map(window.IRONBOUND.produktNormalisieren);
  }

  return FALLBACK_PRODUKTE
    .filter(function (produkt) {
      return String(produkt.filter_tags).indexOf(filter) !== -1;
    })
    .map(window.IRONBOUND.produktNormalisieren);
}


/* ─────────────────────────────────────────────────────────────
   4. Produktkarte als HTML bauen
   -------------------------------------------------------------
   Diese Funktion erzeugt dieselbe HTML-Struktur wie vorher.
   Dadurch bleiben CSS, Animationen und Hover-Effekte erhalten.
   ─────────────────────────────────────────────────────────── */
function produktKarteHtml(produkt) {
  var p = window.IRONBOUND.produktNormalisieren(produkt);
  var htmlEscapen = window.IRONBOUND.htmlEscapen;

  var badge = '';
  if (p.digital_twin) {
    badge = '<span class="twin-abzeichen">🎮 Twin</span>';
  } else if (p.bestseller) {
    badge = '<span class="bestseller-abzeichen">Bestseller</span>';
  }

  var skillLvl = '1';
  if (p.skill_level === 'Fortgeschritten') {
    skillLvl = '2';
  }
  if (p.skill_level === 'Profi') {
    skillLvl = '3';
  }

  return (
    '<div class="inventar-karte" data-filter="' + htmlEscapen(p.filter_tags) + '" data-preis="' + htmlEscapen(p.preis) + '">' +
    '<div class="karten-nummer">' + htmlEscapen(p.nummer) + '</div>' +

    '<div class="karten-bild">' +
    '<img src="' + htmlEscapen(p.bild) + '" alt="' + htmlEscapen(p.name) + '">' +
    badge +
    '</div>' +

    '<div class="karten-inhalt">' +
    '<div class="karten-kategorie">' + htmlEscapen(p.kategorie) + '</div>' +
    '<div class="karten-name">' + htmlEscapen(p.name) + '</div>' +

    '<div class="skill-balken">' +
    '<div class="skill-fuellung" style="width:' + htmlEscapen(p.skill_pct) + '%;"></div>' +
    '</div>' +
    '<span class="skill-text">LVL ' + skillLvl + ' — ' + htmlEscapen(p.skill_level) + '</span>' +

    '<div class="karten-fuss">' +
    '<span class="karten-preis">' + window.IRONBOUND.preisFormatieren(p.preis) + '</span>' +
    '<button class="btn btn-klein" type="button">+ Inventar</button>' +
    '</div>' +
    '</div>' +
    '</div>'
  );
}


/* ─────────────────────────────────────────────────────────────
   5. Produktliste in das Raster schreiben
   -------------------------------------------------------------
   Wenn keine Produkte vorhanden sind, wird die vorhandene Meldung
   «Keine Produkte gefunden» eingeblendet.
   ─────────────────────────────────────────────────────────── */
function rasterRendern(produkte) {
  var raster = document.getElementById('inventar-raster');
  var ergebnisAnzahl = document.getElementById('ergebnis-anzahl');
  var keineTrefferMsg = document.getElementById('keine-treffer');

  if (!raster) {
    return;
  }

  if (!produkte || produkte.length === 0) {
    raster.innerHTML = '';

    if (ergebnisAnzahl) {
      ergebnisAnzahl.textContent = '0 Produkte im Inventar';
    }

    if (keineTrefferMsg) {
      keineTrefferMsg.style.display = 'block';
    }

    return;
  }

  var html = '';
  for (var i = 0; i < produkte.length; i++) {
    html = html + produktKarteHtml(produkte[i]);
  }

  raster.innerHTML = html;

  if (ergebnisAnzahl) {
    ergebnisAnzahl.textContent = produkte.length + ' Produkte im Inventar';
  }

  if (keineTrefferMsg) {
    keineTrefferMsg.style.display = 'none';
  }
}


/* ─────────────────────────────────────────────────────────────
   6. Produkte laden
   -------------------------------------------------------------
   Ablauf:
   1. Fallback sofort anzeigen
   2. Danach echte DB-Daten laden
   3. Wenn DB klappt, ersetzt die echte Liste den Fallback
   ─────────────────────────────────────────────────────────── */
function produkteLaden() {
  var sucheEingabe = document.getElementById('suche-eingabe');
  var suchbegriff = sucheEingabe ? sucheEingabe.value.trim() : '';

  shopProdukte = fallbackFiltern(aktiverFilter);
  rasterRendern(shopProdukte);
  preisfilterAnwenden();

  window.IRONBOUND.produkteVonApiLaden({
    filter: aktiverFilter,
    sort: aktiverSort,
    suche: suchbegriff
  })
    .then(function (produkte) {
      shopProdukte = produkte;
      rasterRendern(shopProdukte);
      preisfilterAnwenden();
    })
    .catch(function () {
      /* Kein Server oder DB-Fehler: Fallback bleibt sichtbar. */
    });
}


/* ─────────────────────────────────────────────────────────────
   7. Suche im Browser anwenden
   -------------------------------------------------------------
   Während dem Tippen wird zuerst clientseitig gefiltert. Zusätzlich
   kann die PHP-API beim nächsten Laden ebenfalls mit dem Suchbegriff
   arbeiten.
   ─────────────────────────────────────────────────────────── */
function sucheAusfuehren() {
  var sucheEingabe = document.getElementById('suche-eingabe');
  var suchbegriff = sucheEingabe ? sucheEingabe.value.toLowerCase().trim() : '';

  if (suchbegriff === '') {
    rasterRendern(shopProdukte);
    preisfilterAnwenden();
    return;
  }

  var gefilterteProdukte = shopProdukte.filter(function (produkt) {
    var name = String(produkt.name || '').toLowerCase();
    var kategorie = String(produkt.kategorie || '').toLowerCase();
    var tags = String(produkt.filter_tags || '').toLowerCase();

    return name.indexOf(suchbegriff) !== -1 ||
      kategorie.indexOf(suchbegriff) !== -1 ||
      tags.indexOf(suchbegriff) !== -1;
  });

  rasterRendern(gefilterteProdukte);
  preisfilterAnwenden();
}


/* ─────────────────────────────────────────────────────────────
   8. Optionalen Preisfilter anwenden
   -------------------------------------------------------------
   Deine aktuelle shop.html hat keinen Preis-Slider. Die Funktion bleibt
   aber erhalten, falls ihr ihn später wieder einfügt.
   ─────────────────────────────────────────────────────────── */
function preisfilterAnwenden() {
  var preisSlider = document.getElementById('preis-slider');
  var preisWert = document.getElementById('preis-wert');
  var ergebnisAnzahl = document.getElementById('ergebnis-anzahl');
  var keineTrefferMsg = document.getElementById('keine-treffer');

  if (!preisSlider) {
    return;
  }

  var maxPreis = Number(preisSlider.value || 0);
  var karten = document.querySelectorAll('.inventar-karte');
  var sichtbar = 0;

  for (var i = 0; i < karten.length; i++) {
    var preis = Number(karten[i].getAttribute('data-preis') || 0);

    if (preis <= maxPreis) {
      karten[i].classList.remove('versteckt');
      sichtbar = sichtbar + 1;
    } else {
      karten[i].classList.add('versteckt');
    }
  }

  if (preisWert) {
    preisWert.textContent = String(maxPreis);
  }

  if (ergebnisAnzahl) {
    ergebnisAnzahl.textContent = sichtbar + ' Produkte im Inventar';
  }

  if (keineTrefferMsg) {
    keineTrefferMsg.style.display = sichtbar === 0 ? 'block' : 'none';
  }
}


/* ─────────────────────────────────────────────────────────────
   9. Filter aus URL lesen
   -------------------------------------------------------------
   Links wie shop.html?kat=schwerter oder shop.html?filter=digital
   setzen direkt den passenden Filter-Chip aktiv.
   ─────────────────────────────────────────────────────────── */
function filterAusUrlLesen() {
  var urlParams = new URLSearchParams(window.location.search);
  var filterAusUrl = urlParams.get('filter') || urlParams.get('kat');

  if (filterAusUrl) {
    aktiverFilter = filterAusUrl;
  }
}


/* ─────────────────────────────────────────────────────────────
   10. Filter-Chips optisch aktualisieren
   -------------------------------------------------------------
   Nur ein Chip darf die Klasse «aktiv» haben.
   ─────────────────────────────────────────────────────────── */
function aktiveFilterklasseSetzen() {
  var filterChips = document.querySelectorAll('.filter-chip');

  for (var i = 0; i < filterChips.length; i++) {
    var chip = filterChips[i];
    var chipFilter = chip.getAttribute('data-filter');

    if (chipFilter === aktiverFilter) {
      chip.classList.add('aktiv');
    } else {
      chip.classList.remove('aktiv');
    }
  }
}


/* ─────────────────────────────────────────────────────────────
   11. Events einrichten
   -------------------------------------------------------------
   Hier werden alle Klicks, Eingaben und Änderungen verbunden.
   ─────────────────────────────────────────────────────────── */
function eventsEinrichten() {
  var filterChips = document.querySelectorAll('.filter-chip');
  var sucheEingabe = document.getElementById('suche-eingabe');
  var sucheBtn = document.getElementById('suche-btn');
  var sortAuswahl = document.getElementById('sort-auswahl');
  var preisSlider = document.getElementById('preis-slider');

  for (var i = 0; i < filterChips.length; i++) {
    filterChips[i].addEventListener('click', function () {
      aktiverFilter = this.getAttribute('data-filter') || 'alle';

      if (sucheEingabe) {
        sucheEingabe.value = '';
      }

      aktiveFilterklasseSetzen();
      produkteLaden();
    });
  }

  if (sucheEingabe) {
    sucheEingabe.addEventListener('keyup', sucheAusfuehren);
  }

  if (sucheBtn) {
    sucheBtn.addEventListener('click', sucheAusfuehren);
  }

  if (sortAuswahl) {
    sortAuswahl.addEventListener('change', function () {
      aktiverSort = this.value;
      produkteLaden();
    });
  }

  if (preisSlider) {
    preisSlider.addEventListener('input', preisfilterAnwenden);
  }
}


/* ─────────────────────────────────────────────────────────────
   12. Start der Shop-Seite
   -------------------------------------------------------------
   Erst wenn die HTML-Seite geladen ist, werden Filter gelesen,
   Events verbunden und Produkte geladen.
   ─────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  filterAusUrlLesen();
  aktiveFilterklasseSetzen();
  eventsEinrichten();
  produkteLaden();
});
