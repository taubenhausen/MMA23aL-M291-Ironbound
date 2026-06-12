/* ============================================================
   common.js — IRONBOUND
   Wird auf allen Seiten geladen.

   Diese Datei enthält nur Funktionen, die mehrere Seiten brauchen:
   1. Mobile-Navigation öffnen und schliessen
   2. Header beim Scrollen markieren
   3. Aktiven Navigationslink automatisch setzen
   4. Gemeinsame Hilfsfunktionen für Produkte und API-Aufrufe
   ============================================================ */


/* ─────────────────────────────────────────────────────────────
   1. Gemeinsamer Namensraum
   -------------------------------------------------------------
   Wir legen gemeinsame Funktionen in window.IRONBOUND ab.
   Vorteil: index.js und shop.js können dieselben Funktionen nutzen,
   ohne dass Code doppelt geschrieben werden muss.
   ─────────────────────────────────────────────────────────── */
window.IRONBOUND = window.IRONBOUND || {};


/* ─────────────────────────────────────────────────────────────
   2. Texte sicher in HTML einsetzen
   -------------------------------------------------------------
   Daten aus der Datenbank werden nie direkt als HTML eingesetzt.
   Diese Funktion ersetzt Sonderzeichen, damit kein fremder HTML-Code
   aus der Datenbank ausgeführt werden kann.
   ─────────────────────────────────────────────────────────── */
window.IRONBOUND.htmlEscapen = function (wert) {
  return String(wert ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};


/* ─────────────────────────────────────────────────────────────
   3. Preis einheitlich formatieren
   -------------------------------------------------------------
   Aus 249 wird zum Beispiel: CHF 249.–
   So sehen Preise auf Startseite und Shop gleich aus.
   ─────────────────────────────────────────────────────────── */
window.IRONBOUND.preisFormatieren = function (preis) {
  var zahl = Number(preis || 0);
  return 'CHF ' + zahl.toFixed(0) + '.–';
};


/* ─────────────────────────────────────────────────────────────
   4. Produktdaten vereinheitlichen
   -------------------------------------------------------------
   Die Datenbank kann z.B. bild_url liefern, die alte JS-Struktur
   nutzt aber bild. Diese Funktion macht daraus ein einheitliches
   Produktobjekt, damit die HTML-Ausgabe stabil bleibt.
   ─────────────────────────────────────────────────────────── */
window.IRONBOUND.produktNormalisieren = function (produkt) {
  var id = Number(produkt.id || 0);
  var skillPct = Number(produkt.skill_pct || 0);

  /* Skill-Level ableiten, falls die Datenbank keinen Text liefert. */
  var skillLevel = produkt.skill_level;
  if (!skillLevel) {
    if (skillPct >= 85) {
      skillLevel = 'Profi';
    } else if (skillPct >= 55) {
      skillLevel = 'Fortgeschritten';
    } else {
      skillLevel = 'Einsteiger';
    }
  }

  return {
    id: id,
    nummer: produkt.nummer || String(id).padStart(3, '0'),
    name: produkt.name || 'Unbekanntes Produkt',
    kategorie: produkt.kategorie || '',
    filter_tags: String(produkt.filter_tags || '').toLowerCase(),
    preis: Number(produkt.preis || 0),
    skill_level: skillLevel,
    skill_pct: skillPct,
    digital_twin: produkt.digital_twin === true || produkt.digital_twin === 1 || produkt.digital_twin === '1',
    bestseller: produkt.bestseller === true || produkt.bestseller === 1 || produkt.bestseller === '1',
    bild: produkt.bild || produkt.bild_url || 'img/prod1-placeholder.svg'
  };
};


/* ─────────────────────────────────────────────────────────────
   5. Produkte von der PHP-API laden
   -------------------------------------------------------------
   Diese Funktion baut die URL zur PHP-Datei und gibt ein Array mit
   Produkten zurück. Wenn die API nicht erreichbar ist, wird ein
   Fehler ausgelöst. index.js und shop.js entscheiden dann selbst,
   ob sie Fallback-Produkte anzeigen.
   ─────────────────────────────────────────────────────────── */
window.IRONBOUND.produkteVonApiLaden = function (optionen) {
  optionen = optionen || {};

  var parameter = new URLSearchParams();

  if (optionen.filter && optionen.filter !== 'alle') {
    parameter.set('filter', optionen.filter);
  }

  if (optionen.suche) {
    parameter.set('suche', optionen.suche);
  }

  if (optionen.sort) {
    parameter.set('sort', optionen.sort);
  }

  if (optionen.limit) {
    parameter.set('limit', optionen.limit);
  }

  if (optionen.bestseller) {
    parameter.set('bestseller', '1');
  }

  /* Relativer Pfad: funktioniert in Plesk auch dann, wenn die Seite in einem Unterordner liegt. */
  var url = 'php/shop-produkte.php';
  var query = parameter.toString();
  if (query !== '') {
    url = url + '?' + query;
  }

  return fetch(url)
    .then(function (antwort) {
      if (!antwort.ok) {
        throw new Error('API-Antwort war nicht erfolgreich.');
      }
      return antwort.json();
    })
    .then(function (daten) {
      if (daten.status !== 'ok' || !Array.isArray(daten.produkte)) {
        throw new Error(daten.meldung || 'Ungültige API-Antwort.');
      }

      return daten.produkte.map(window.IRONBOUND.produktNormalisieren);
    });
};


/* ─────────────────────────────────────────────────────────────
   6. Start, sobald die HTML-Seite bereit ist
   -------------------------------------------------------------
   Dadurch greifen wir erst auf Buttons und Navigation zu, wenn der
   Browser die Elemente wirklich geladen hat.
   ─────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {

  /* Wichtige Elemente aus dem HTML holen. */
  var hamburgerBtn = document.getElementById('hamburger-btn');
  var navLinks = document.getElementById('nav-links');
  var siteHeader = document.getElementById('site-header');

  /* Falls eine Seite ausnahmsweise keine Navigation hat, bricht die Datei sauber ab. */
  if (!hamburgerBtn || !navLinks || !siteHeader) {
    return;
  }


  /* ── Mobile-Menü öffnen oder schliessen ───────────────────── */
  hamburgerBtn.addEventListener('click', function (event) {
    event.stopPropagation();

    navLinks.classList.toggle('offen');
    hamburgerBtn.classList.toggle('offen');
  });


  /* ── Klick ausserhalb der Navigation schliesst das Menü ───── */
  document.addEventListener('click', function (event) {
    var klickAufButton = hamburgerBtn.contains(event.target);
    var klickAufNav = navLinks.contains(event.target);

    if (!klickAufButton && !klickAufNav) {
      navLinks.classList.remove('offen');
      hamburgerBtn.classList.remove('offen');
    }
  });


  /* ── Bei Desktop-Breite wird das Mobile-Menü geschlossen ──── */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) {
      navLinks.classList.remove('offen');
      hamburgerBtn.classList.remove('offen');
    }
  });


  /* ── Header bekommt beim Scrollen einen Schatten ──────────── */
  function headerStatusAktualisieren() {
    if (window.scrollY > 50) {
      siteHeader.classList.add('gescrollt');
    } else {
      siteHeader.classList.remove('gescrollt');
    }
  }

  window.addEventListener('scroll', headerStatusAktualisieren);
  headerStatusAktualisieren();


  /* ── Aktiven Link in der Navigation automatisch setzen ────── */
  var aktuelleSeite = window.location.pathname.split('/').pop() || 'index.html';
  var alleNavLinks = document.querySelectorAll('.nav-link');

  for (var i = 0; i < alleNavLinks.length; i++) {
    var link = alleNavLinks[i];
    var linkZiel = link.getAttribute('href').split('#')[0];

    link.classList.remove('aktiv');

    if (linkZiel === aktuelleSeite) {
      link.classList.add('aktiv');
    }
  }

});
