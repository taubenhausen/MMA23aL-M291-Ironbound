/* ============================================================
   index.js — IRONBOUND Startseite
   Lädt die ersten 3 Produkte aus der Datenbank via fetch()
   und rendert sie als Produktkarten im Bereich "Top Picks".
   Fällt auf statische Daten zurück wenn kein Server vorhanden.
   ============================================================ */


/* ── Statische Fallback-Daten (gleiche Quelle wie shop.js) ───── */
var INDEX_FALLBACK = [
  { name: 'Gladius Romanus',  kategorie: 'Schwerter · Einsteiger',  preis: 249, digital_twin: true,  bestseller: false, bild: 'img/prod1-placeholder.svg' },
  { name: 'M4 Replika',       kategorie: 'Schusswaffen · Profi',     preis: 599, digital_twin: false, bestseller: true,  bild: 'img/prod2-placeholder.svg' },
  { name: 'Langbogen 60"',    kategorie: 'Bögen · Einsteiger',       preis: 189, digital_twin: true,  bestseller: false, bild: 'img/prod3-placeholder.svg' }
];


/* ── HTML einer Produktkarte für die Startseite bauen ────────── */
function indexKarteHtml(p) {
  var badge = '';
  if (p.digital_twin) {
    badge = '<span class="digital-badge">🎮 Twin</span>';
  } else if (p.bestseller) {
    badge = '<span class="bestseller-badge">Bestseller</span>';
  }

  return (
    '<div class="produktkarte">' +
      '<div class="produkt-bild">' +
        '<img src="' + p.bild + '" alt="' + p.name + '">' +
        badge +
      '</div>' +
      '<div class="produkt-info">' +
        '<div class="produkt-kategorie">' + p.kategorie + '</div>' +
        '<div class="produkt-name">'      + p.name      + '</div>' +
        '<div class="produkt-fuss">' +
          '<span class="produkt-preis">CHF ' + parseFloat(p.preis).toFixed(0) + '</span>' +
          '<a href="shop.html" class="btn btn-klein">Details</a>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}


/* ── Raster rendern ───────────────────────────────────────────── */
function indexRasterRendern(produkte) {
  var raster = document.getElementById('index-produkt-raster');
  if (!raster) { return; }

  var top3 = produkte.slice(0, 3);
  var html  = '';
  for (var i = 0; i < top3.length; i++) {
    html += indexKarteHtml(top3[i]);
  }
  raster.innerHTML = html;
}


/* ── Produkte laden ───────────────────────────────────────────── */
function indexProdukteLaden() {
  /* Sofort Fallback rendern — keine leere Seite während fetch läuft */
  indexRasterRendern(INDEX_FALLBACK);

  /* Im Hintergrund von der PHP/DB-API laden */
  fetch('php/shop-produkte.php')
    .then(function(antwort) {
      return antwort.json();
    })
    .then(function(daten) {
      if (daten.status === 'ok' && daten.produkte.length > 0) {
        /* DB-Daten vorhanden: Karten aktualisieren */
        indexRasterRendern(daten.produkte);
      }
    })
    .catch(function() {
      /* PHP nicht erreichbar — Fallback bleibt sichtbar */
    });
}


/* ── Start ────────────────────────────────────────────────────── */
indexProdukteLaden();
