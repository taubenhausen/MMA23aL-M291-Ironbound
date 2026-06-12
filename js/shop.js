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
  { id: 1, nummer: '001', name: 'Gladius Romanus', kategorie: 'Schwerter · Einsteiger', filter_tags: 'schwerter digital', preis: 249, skill_level: 'Einsteiger', skill_pct: 35, digital_twin: true, bestseller: false, bild: 'img/prod1-placeholder.svg' },
  { id: 2, nummer: '002', name: 'M4 Replika', kategorie: 'Schusswaffen · Profi', filter_tags: 'schusswaffen profi digital', preis: 599, skill_level: 'Profi', skill_pct: 100, digital_twin: true, bestseller: true, bild: 'img/prod2-placeholder.svg' },
  { id: 3, nummer: '003', name: 'Langbogen 60"', kategorie: 'Bögen · Einsteiger', filter_tags: 'bogen digital', preis: 189, skill_level: 'Einsteiger', skill_pct: 30, digital_twin: true, bestseller: false, bild: 'img/prod3-placeholder.svg' },
  { id: 4, nummer: '004', name: 'Kampfmesser', kategorie: 'Messer · Fortgeschritten', filter_tags: 'messer fortgeschritten', preis: 149, skill_level: 'Fortgeschritten', skill_pct: 65, digital_twin: false, bestseller: false, bild: 'img/prod4-placeholder.svg' },
  { id: 5, nummer: '005', name: 'Armbrust Pro', kategorie: 'Bögen · Fortgeschritten', filter_tags: 'bogen fortgeschritten digital', preis: 399, skill_level: 'Fortgeschritten', skill_pct: 70, digital_twin: true, bestseller: false, bild: 'img/prod5-placeholder.svg' },
  { id: 6, nummer: '006', name: 'Speer Replika', kategorie: 'Stangenwaffen · Einsteiger', filter_tags: 'stangenwaffen', preis: 99, skill_level: 'Einsteiger', skill_pct: 20, digital_twin: false, bestseller: false, bild: 'img/prod6-placeholder.svg' },
  { id: 7, nummer: '007', name: 'Desert Eagle Replika', kategorie: 'Schusswaffen · Profi', filter_tags: 'schusswaffen profi digital', preis: 749, skill_level: 'Profi', skill_pct: 100, digital_twin: true, bestseller: false, bild: 'img/prod2-placeholder.svg' },
  { id: 8, nummer: '008', name: 'Winchester Karabiner', kategorie: 'Schusswaffen · Profi', filter_tags: 'schusswaffen profi digital', preis: 899, skill_level: 'Profi', skill_pct: 100, digital_twin: true, bestseller: false, bild: 'img/prod2-placeholder.svg' }
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
var aktiveSeite = 1;
var PRODUKTE_PRO_SEITE = 20;
var aktuelleGefilterteProdukte = [];


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
    .filter(function(produkt) {
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
          '<button class="btn btn-klein inventar-btn" type="button" data-produkt-id="' + htmlEscapen(p.id) + '">+ Inventar</button>' +
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
function paginierungRendern() {
  var pagination = document.querySelector('.pagination');
  if (!pagination) return;

  var gesamtSeiten = Math.ceil(aktuelleGefilterteProdukte.length / PRODUKTE_PRO_SEITE);

  pagination.innerHTML = '';

  if (gesamtSeiten <= 1) return;

  for (var s = 1; s <= gesamtSeiten; s++) {
    var btn = document.createElement('button');
    btn.className = 'seite-btn' + (s === aktiveSeite ? ' aktiv' : '');
    btn.textContent = String(s).padStart(2, '0');
    btn.setAttribute('data-seite', s);
    btn.addEventListener('click', function() {
      aktiveSeite = Number(this.getAttribute('data-seite'));
      rasterRendern(aktuelleGefilterteProdukte);
      var topbar = document.querySelector('.produkt-topbar');
      if (topbar) topbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    pagination.appendChild(btn);
  }
}

function rasterRendern(produkte) {
  aktuelleGefilterteProdukte = produkte || [];

  var raster = document.getElementById('inventar-raster');
  var ergebnisAnzahl = document.getElementById('ergebnis-anzahl');
  var keineTrefferMsg = document.getElementById('keine-treffer');

  if (!raster) {
    return;
  }

  if (aktuelleGefilterteProdukte.length === 0) {
    raster.innerHTML = '';

    if (ergebnisAnzahl) {
      ergebnisAnzahl.textContent = '0 Produkte im Inventar';
    }

    if (keineTrefferMsg) {
      keineTrefferMsg.style.display = 'block';
    }

    paginierungRendern();
    return;
  }

  var start = (aktiveSeite - 1) * PRODUKTE_PRO_SEITE;
  var seitenProdukte = aktuelleGefilterteProdukte.slice(start, start + PRODUKTE_PRO_SEITE);

  var html = '';
  for (var i = 0; i < seitenProdukte.length; i++) {
    html = html + produktKarteHtml(seitenProdukte[i]);
  }

  raster.innerHTML = html;

  if (ergebnisAnzahl) {
    ergebnisAnzahl.textContent = aktuelleGefilterteProdukte.length + ' Produkte im Inventar';
  }

  if (keineTrefferMsg) {
    keineTrefferMsg.style.display = 'none';
  }

  paginierungRendern();
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
  .then(function(produkte) {
    shopProdukte = produkte;
    rasterRendern(shopProdukte);
    preisfilterAnwenden();
  })
  .catch(function() {
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
  aktiveSeite = 1;
  var sucheEingabe = document.getElementById('suche-eingabe');
  var suchbegriff = sucheEingabe ? sucheEingabe.value.toLowerCase().trim() : '';

  if (suchbegriff === '') {
    rasterRendern(shopProdukte);
    preisfilterAnwenden();
    return;
  }

  var gefilterteProdukte = shopProdukte.filter(function(produkt) {
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
   Produkt ins Inventar legen
   -------------------------------------------------------------
   Der Button nutzt die bestehenden Tabellen Bestellungen und
   besteht_aus. Wenn kein Kunde eingeloggt ist, wird zur Login-Seite
   weitergeleitet.
   ─────────────────────────────────────────────────────────── */
function produktInsInventarLegen(produktId) {
  var daten = new FormData();
  daten.set('action', 'hinzufuegen');
  daten.set('produkt_id', produktId);

  fetch('php/warenkorb.php', {
    method: 'POST',
    body: daten
  })
    .then(function(antwort) { return antwort.json(); })
    .then(function(daten) {
      if (daten.status === 'nicht_eingeloggt') {
        window.location.href = 'kunden-login.html';
        return;
      }

      if (daten.status !== 'ok') {
        alert(daten.meldung || 'Produkt konnte nicht hinzugefügt werden.');
        return;
      }

      if (window.IRONBOUND && window.IRONBOUND.warenkorbAnzahlAktualisieren) {
        window.IRONBOUND.warenkorbAnzahlAktualisieren();
      }

      alert('Produkt wurde ins Inventar gelegt.');
    })
    .catch(function() {
      alert('Datenbankfehler beim Inventar.');
    });
}

/* ─────────────────────────────────────────────────────────────
   Klicks auf Inventar-Buttons verarbeiten
   -------------------------------------------------------------
   Event-Delegation: Wir hängen nur einen Listener ans Raster.
   Dadurch funktionieren die Buttons auch nach dem Nachladen aus
   der Datenbank.
   ─────────────────────────────────────────────────────────── */
function inventarButtonsEinrichten() {
  var raster = document.getElementById('inventar-raster');

  if (!raster) {
    return;
  }

  raster.addEventListener('click', function(event) {
    var button = event.target.closest('.inventar-btn');

    if (!button) {
      return;
    }

    var produktId = Number(button.getAttribute('data-produkt-id') || 0);

    if (produktId > 0) {
      produktInsInventarLegen(produktId);
    }
  });
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
    filterChips[i].addEventListener('click', function() {
      aktiverFilter = this.getAttribute('data-filter') || 'alle';
      aktiveSeite = 1;

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
    sortAuswahl.addEventListener('change', function() {
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
document.addEventListener('DOMContentLoaded', function() {
  filterAusUrlLesen();
  aktiveFilterklasseSetzen();
  eventsEinrichten();
  inventarButtonsEinrichten();
  produkteLaden();
});
