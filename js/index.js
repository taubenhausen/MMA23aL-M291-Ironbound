/* ============================================================
   index.js — IRONBOUND Startseite

   Aufgabe dieser Datei:
   - Die 3 Produktkarten im Bereich «Top Picks» anzeigen
   - Zuerst Fallback-Produkte zeigen, damit die Seite nie leer ist
   - Danach echte Produkte aus der Plesk-Datenbank nachladen
   ============================================================ */


/* ─────────────────────────────────────────────────────────────
   1. Fallback-Produkte
   -------------------------------------------------------------
   Diese Produkte werden sofort angezeigt, falls die PHP-API nicht
   erreichbar ist. Das ist nützlich für lokale Tests oder GitHub Pages.
   ─────────────────────────────────────────────────────────── */
var INDEX_FALLBACK_PRODUKTE = [
  {
    id: 1,
    nummer: '001',
    name: 'Gladius Romanus',
    kategorie: 'Schwerter · Einsteiger',
    filter_tags: 'schwerter einsteiger digital',
    preis: 249,
    skill_level: 'Einsteiger',
    skill_pct: 35,
    digital_twin: true,
    bestseller: false,
    bild: 'img/prod1-placeholder.svg'
  },
  {
    id: 2,
    nummer: '002',
    name: 'M4 Replika',
    kategorie: 'Schusswaffen · Profi',
    filter_tags: 'schusswaffen profi',
    preis: 599,
    skill_level: 'Profi',
    skill_pct: 100,
    digital_twin: false,
    bestseller: true,
    bild: 'img/prod2-placeholder.svg'
  },
  {
    id: 3,
    nummer: '003',
    name: 'Langbogen 60"',
    kategorie: 'Bögen · Einsteiger',
    filter_tags: 'bogen einsteiger digital',
    preis: 189,
    skill_level: 'Einsteiger',
    skill_pct: 30,
    digital_twin: true,
    bestseller: false,
    bild: 'img/prod3-placeholder.svg'
  }
];


/* ─────────────────────────────────────────────────────────────
   2. Einzelne Produktkarte als HTML bauen
   -------------------------------------------------------------
   Die CSS-Klassen bleiben gleich wie vorher. Dadurch ändert sich
   das Aussehen der Karten nicht.
   ─────────────────────────────────────────────────────────── */
function indexProduktkarteHtml(produkt) {
  var p = window.IRONBOUND.produktNormalisieren(produkt);
  var htmlEscapen = window.IRONBOUND.htmlEscapen;

  var badge = '';
  if (p.digital_twin) {
    badge = '<span class="digital-badge">🎮 Twin</span>';
  } else if (p.bestseller) {
    badge = '<span class="bestseller-badge">Bestseller</span>';
  }

  return (
    '<div class="produktkarte">' +
    '<div class="produkt-bild">' +
    '<img src="' + htmlEscapen(p.bild) + '" alt="' + htmlEscapen(p.name) + '">' +
    badge +
    '</div>' +
    '<div class="produkt-info">' +
    '<div class="produkt-kategorie">' + htmlEscapen(p.kategorie) + '</div>' +
    '<div class="produkt-name">' + htmlEscapen(p.name) + '</div>' +
    '<div class="produkt-fuss">' +
    '<span class="produkt-preis">' + window.IRONBOUND.preisFormatieren(p.preis) + '</span>' +
    '<a href="shop.html" class="btn btn-klein">Details</a>' +
    '</div>' +
    '</div>' +
    '</div>'
  );
}


/* ─────────────────────────────────────────────────────────────
   3. Produkt-Raster auf der Startseite füllen
   -------------------------------------------------------------
   Es werden immer nur die ersten 3 Produkte angezeigt.
   ─────────────────────────────────────────────────────────── */
function indexProdukteRendern(produkte) {
  var raster = document.getElementById('index-produkt-raster');

  if (!raster) {
    return;
  }

  var topDreiProdukte = produkte.slice(0, 3);
  var html = '';

  for (var i = 0; i < topDreiProdukte.length; i++) {
    html = html + indexProduktkarteHtml(topDreiProdukte[i]);
  }

  raster.innerHTML = html;
}


/* ─────────────────────────────────────────────────────────────
   4. Produkte laden
   -------------------------------------------------------------
   Zuerst Fallback anzeigen, danach echte DB-Produkte versuchen.
   Falls die Datenbank nicht erreichbar ist, bleibt der Fallback stehen.
   ─────────────────────────────────────────────────────────── */
function indexProdukteLaden() {
  indexProdukteRendern(INDEX_FALLBACK_PRODUKTE);

  window.IRONBOUND.produkteVonApiLaden({
    limit: 3,
    bestseller: false,
    sort: 'neu'
  })
    .then(function (produkte) {
      if (produkte.length > 0) {
        indexProdukteRendern(produkte);
      }
    })
    .catch(function () {
      /* Kein Server oder DB-Fehler: Fallback bleibt sichtbar. */
    });
}


/* ─────────────────────────────────────────────────────────────
   5. Start
   -------------------------------------------------------------
   Die Funktion startet erst, wenn die HTML-Seite fertig geladen ist.
   ─────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', indexProdukteLaden);
