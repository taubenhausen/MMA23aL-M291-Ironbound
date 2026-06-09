/* ============================================================
   common.js — IRONBOUND
   Wird auf ALLEN Seiten eingebunden.
   Zuständig für: Navigation (Hamburger, Scroll-Verhalten)
   ============================================================ */


// ── Elemente holen ─────────────────────────────────────────────
var hamburgerBtn = document.getElementById('hamburger-btn');
var navLinks = document.getElementById('nav-links');
var siteHeader = document.getElementById('site-header');


// ── HAMBURGER-MENÜ: öffnen / schliessen ────────────────────────
hamburgerBtn.addEventListener('click', function() {

  var istOffen = navLinks.classList.contains('offen');

  if (istOffen) {
    navLinks.classList.remove('offen');
    hamburgerBtn.classList.remove('offen');
  } else {
    navLinks.classList.add('offen');
    hamburgerBtn.classList.add('offen');
  }

});


// ── KLICK AUSSERHALB: Menü schliessen ──────────────────────────
document.addEventListener('click', function(event) {

  var klickAufButton = hamburgerBtn.contains(event.target);
  var klickAufNav = navLinks.contains(event.target);

  if (!klickAufButton && !klickAufNav) {
    navLinks.classList.remove('offen');
    hamburgerBtn.classList.remove('offen');
  }

});


// ── RESIZE: Menü auf Desktop schliessen ────────────────────────
window.addEventListener('resize', function() {

  if (window.innerWidth > 900) {
    navLinks.classList.remove('offen');
    hamburgerBtn.classList.remove('offen');
  }

});


// ── SCROLL: Header-Schatten beim Scrollen ──────────────────────
window.addEventListener('scroll', function() {

  if (window.scrollY > 50) {
    siteHeader.classList.add('gescrollt');
  } else {
    siteHeader.classList.remove('gescrollt');
  }

});


// ── AKTIVEN NAV-LINK hervorheben ────────────────────────────────
// Vergleicht die aktuelle Seite mit den href-Attributen der Links

var aktuelleSeite = window.location.pathname.split('/').pop();

var alleNavLinks = document.querySelectorAll('.nav-link');

for (var i = 0; i < alleNavLinks.length; i++) {
  var link = alleNavLinks[i];
  var linkZiel = link.getAttribute('href').split('#')[0]; // Anker ignorieren

  // Klasse entfernen (falls bereits gesetzt)
  link.classList.remove('aktiv');

  // Aktiv setzen wenn URL übereinstimmt
  if (linkZiel === aktuelleSeite) {
    link.classList.add('aktiv');
  }

  // Startseite: index.html oder leerer Pfad
  if ((aktuelleSeite === '' || aktuelleSeite === 'index.html') && linkZiel === 'index.html') {
    link.classList.add('aktiv');
  }
}
