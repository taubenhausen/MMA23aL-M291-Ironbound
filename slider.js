/**
 * slider.js — Ironbound
 * Interaktives Element ④: Image Slider
 * Trigger: Klick auf Pfeil-Buttons, Klick auf Dots, automatischer Wechsel (Autoplay)
 */

(function () {
  const slides = document.querySelectorAll('.slide');
  const dots   = document.querySelectorAll('.dot');
  const btnPrev = document.getElementById('slider-prev');
  const btnNext = document.getElementById('slider-next');

  if (!slides.length) return;

  let current = 0;
  let autoTimer = null;

  function showSlide(index) {
    // Wrap around
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;

    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    slides[index].classList.add('active');
    if (dots[index]) dots[index].classList.add('active');

    current = index;
  }

  // Pfeil-Buttons
  if (btnPrev) btnPrev.addEventListener('click', () => { showSlide(current - 1); resetAuto(); });
  if (btnNext) btnNext.addEventListener('click', () => { showSlide(current + 1); resetAuto(); });

  // Dots
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      showSlide(parseInt(dot.dataset.index));
      resetAuto();
    });
  });

  // Autoplay alle 4 Sekunden
  function startAuto() {
    autoTimer = setInterval(() => showSlide(current + 1), 4000);
  }
  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  startAuto();
})();
