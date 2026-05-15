/**
 * nav.js — Ironbound
 * Interaktives Element ①: Navigation (Hamburger-Menü)
 * Trigger: Klick auf Hamburger → Slide-in Menü öffnet/schliesst
 */

(function () {
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('main-nav');

  if (!hamburger || !nav) return;

  // Toggle Menü auf/zu
  hamburger.addEventListener('click', function () {
    const isOpen = nav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-label', isOpen ? 'Menü schliessen' : 'Menü öffnen');
  });

  // Klick ausserhalb schliesst das Menü
  document.addEventListener('click', function (e) {
    if (!hamburger.contains(e.target) && !nav.contains(e.target)) {
      nav.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });

  // Resize: Wenn Fenster grösser wird, Menü schliessen
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) {
      nav.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });

  // Scroll: Header schrumpft minimal (Klasse hinzufügen)
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
})();
