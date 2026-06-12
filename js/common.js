/* ============================================================
   common.js — IRONBOUND
   Wird auf ALLEN drei Seiten eingebunden (index, shop, promotion).
   Zuständig für:
   1. Hamburger-Menü (öffnen / schliessen)
   2. Klick ausserhalb schliesst Menü
   3. Fenstergrösse-Änderung schliesst Menü
   4. Header-Schatten beim Scrollen
   5. Aktiven Nav-Link automatisch erkennen und markieren
   ============================================================ */


/* ── Elemente aus dem HTML holen ───────────────────────────────
   getElementById: sucht Element mit dieser id.
   Gibt das HTML-Element-Objekt zurück.
   ─────────────────────────────────────────────────────────── */
var hamburgerBtn = document.getElementById('hamburger-btn');
/* Das button-Element mit id="hamburger-btn". */

var navLinks = document.getElementById('nav-links');
/* Das nav-Element mit id="nav-links". */

var siteHeader = document.getElementById('site-header');
/* Das header-Element mit id="site-header". */


/* ── 1. HAMBURGER-MENÜ: öffnen / schliessen ───────────────────
   addEventListener('click', function): führt die Funktion
   jedes Mal aus wenn auf hamburgerBtn geklickt wird.
   ─────────────────────────────────────────────────────────── */
hamburgerBtn.addEventListener('click', function() {

  var istOffen = navLinks.classList.contains('offen');
  /* classList.contains('offen'): gibt true zurück wenn Klasse vorhanden, sonst false. */

  if (istOffen) {
    /* Menü ist offen → schliessen. */
    navLinks.classList.remove('offen');
    /* classList.remove: entfernt CSS-Klasse vom Element. */
    hamburgerBtn.classList.remove('offen');
    /* Hamburger zurück zu drei Strichen (kein X mehr). */
  } else {
    /* Menü ist zu → öffnen. */
    navLinks.classList.add('offen');
    /* classList.add: fügt CSS-Klasse hinzu → .nav-links.offen wird sichtbar. */
    hamburgerBtn.classList.add('offen');
    /* Hamburger animiert zu X (CSS regelt die Animation). */
  }

});


/* ── 2. KLICK AUSSERHALB: Menü schliessen ─────────────────────
   Listener auf dem gesamten Dokument.
   Jeder Klick irgendwo auf der Seite löst dies aus.
   ─────────────────────────────────────────────────────────── */
document.addEventListener('click', function(event) {
  /* event = das Klick-Event-Objekt. */
  /* event.target = das Element das geklickt wurde. */

  var klickAufButton = hamburgerBtn.contains(event.target);
  /* .contains(): gibt true zurück wenn event.target innerhalb von hamburgerBtn ist. */

  var klickAufNav = navLinks.contains(event.target);
  /* Prüft ob der Klick innerhalb der Navigation war. */

  if (!klickAufButton && !klickAufNav) {
    /* ! = logisches NICHT. Klick war weder auf Button noch auf Nav. */
    navLinks.classList.remove('offen');
    hamburgerBtn.classList.remove('offen');
    /* Menü schliessen. */
  }

});


/* ── 3. FENSTERGRÖSSE: Menü auf Desktop schliessen ────────────
   Wenn User Fenster vergrössert: Menü automatisch schliessen.
   ─────────────────────────────────────────────────────────── */
window.addEventListener('resize', function() {
  /* resize = Event wenn Fenstergrösse geändert wird. */

  if (window.innerWidth > 900) {
    /* window.innerWidth = aktuelle Fensterbreite in Pixeln. */
    /* > 900: Desktop-Breite → Hamburger nicht mehr nötig. */
    navLinks.classList.remove('offen');
    hamburgerBtn.classList.remove('offen');
  }

});


/* ── 4. SCROLL: Schatten beim Header hinzufügen ───────────────
   Wenn gescrollt: Header bekommt Schatten (visuell tieferliegend).
   ─────────────────────────────────────────────────────────── */
window.addEventListener('scroll', function() {
  /* scroll = Event bei jeder Scroll-Bewegung. */

  if (window.scrollY > 50) {
    /* window.scrollY = wie viele Pixel nach unten gescrollt wurde. */
    /* > 50: mehr als 50px gescrollt → Schatten. */
    siteHeader.classList.add('gescrollt');
    /* .site-header.gescrollt hat box-shadow in common.css. */
  } else {
    siteHeader.classList.remove('gescrollt');
    /* Ganz oben → kein Schatten. */
  }

});


/* ── 5. AKTIVEN NAV-LINK ERKENNEN ─────────────────────────────
   Vergleicht die aktuelle URL mit den href-Attributen der Links.
   Setzt automatisch die Klasse "aktiv" auf den richtigen Link.
   ─────────────────────────────────────────────────────────── */

var aktuelleSeite = window.location.pathname.split('/').pop();
/* window.location.pathname = z.B. "/ironbound/shop.html" */
/* .split('/') = Array aus den Teilen: ["", "ironbound", "shop.html"] */
/* .pop() = letztes Element: "shop.html" */

var alleNavLinks = document.querySelectorAll('.nav-link');
/* querySelectorAll: findet ALLE Elemente mit dieser CSS-Klasse. */
/* Gibt NodeList zurück (wie ein Array). */

for (var i = 0; i < alleNavLinks.length; i++) {
  /* for-Schleife: geht jeden Link durch. i = Index (0, 1, 2, 3). */

  var link = alleNavLinks[i];
  /* Aktueller Link. alleNavLinks[0] = erster Link usw. */

  var linkZiel = link.getAttribute('href').split('#')[0];
  /* getAttribute('href'): liest das href-Attribut aus dem HTML. */
  /* .split('#')[0]: Anker ignorieren. "promotion.html#digital-twin" → "promotion.html" */

  link.classList.remove('aktiv');
  /* Erst alle aktiv-Klassen entfernen (sauber starten). */

  if (linkZiel === aktuelleSeite) {
    /* === = genau gleich (Wert und Typ). */
    link.classList.add('aktiv');
    /* Dieser Link ist die aktuelle Seite → aktiv markieren. */
  }

  /* Sonderfall: Startseite kann "" oder "index.html" sein. */
  if ((aktuelleSeite === '' || aktuelleSeite === 'index.html') && linkZiel === 'index.html') {
    link.classList.add('aktiv');
  }

}
