/**
 * shop.js — Ironbound
 * Interaktives Element ④ (Live-Suche) + ⑤ (Filter-Chips, Animationen)
 *
 * Funktionen:
 *  - Chip-Filter: Klick auf Chip filtert Produktkarten
 *  - Live-Suche: keyup auf Suchfeld filtert nach Produktname/Kategorie
 *  - Preis-Range: Slider zeigt aktuellen Wert
 *  - Scroll-Animation: Produktkarten faden beim Scrollen ein (⑤)
 */

(function () {

  // ── Filter Chips ──────────────────────────────────────────────────────────
  const chips   = document.querySelectorAll('.chip');
  const cards   = document.querySelectorAll('.product-card');
  const countEl = document.querySelector('.result-count');

  function updateCount() {
    const visible = document.querySelectorAll('.product-card:not(.hidden)').length;
    if (countEl) countEl.textContent = `${visible} Produkte gefunden`;
  }

  chips.forEach(chip => {
    chip.addEventListener('click', function () {
      chips.forEach(c => c.classList.remove('active'));
      this.classList.add('active');

      const filter = this.dataset.filter;

      cards.forEach(card => {
        if (filter === 'alle') {
          card.classList.remove('hidden');
        } else {
          const tags = card.dataset.filter || '';
          if (tags.includes(filter)) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        }
      });

      updateCount();
    });
  });

  // ── Live-Suche ────────────────────────────────────────────────────────────
  const searchInput = document.getElementById('search-input');
  const searchBtn   = document.getElementById('search-btn');

  function doSearch() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    cards.forEach(card => {
      const name = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
      const cat  = card.querySelector('.product-cat')?.textContent.toLowerCase() || '';

      if (!query || name.includes(query) || cat.includes(query)) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });

    updateCount();

    // Filter-Chips zurücksetzen auf "Alle"
    chips.forEach(c => c.classList.remove('active'));
    const allChip = document.querySelector('[data-filter="alle"]');
    if (allChip) allChip.classList.add('active');
  }

  if (searchInput) {
    searchInput.addEventListener('keyup', doSearch);
  }
  if (searchBtn) {
    searchBtn.addEventListener('click', doSearch);
  }

  // ── Preis-Range Anzeige ───────────────────────────────────────────────────
  const priceRange = document.getElementById('price-range');
  const priceVal   = document.getElementById('price-val');

  if (priceRange && priceVal) {
    priceRange.addEventListener('input', function () {
      priceVal.textContent = this.value;
    });
  }

  // ── Scroll-Animation: Karten einblenden ⑤ ────────────────────────────────
  const allCards = document.querySelectorAll('.product-card');

  // Initiales CSS für Animation
  allCards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `opacity 0.4s ease ${i * 0.07}s, transform 0.4s ease ${i * 0.07}s`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  allCards.forEach(card => observer.observe(card));

  // hidden-Klasse im CSS
  const style = document.createElement('style');
  style.textContent = '.product-card.hidden { display: none !important; }';
  document.head.appendChild(style);

  updateCount();

})();
