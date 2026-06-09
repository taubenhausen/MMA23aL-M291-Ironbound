/* ============================================================
   slider.js — IRONBOUND Startseite
   Bild-Slider mit Autoplay, Pfeilen und Punkte-Navigation
   ============================================================ */


var aktuelleSlide = 0;
var anzahlSlides = 3;
var autoplayTimer = null;


function slideAnzeigen(nummer) {

  if (nummer < 0) {
    nummer = anzahlSlides - 1;
  }
  if (nummer >= anzahlSlides) {
    nummer = 0;
  }

  var alleSlides = document.querySelectorAll('.slide');
  for (var i = 0; i < alleSlides.length; i++) {
    alleSlides[i].classList.remove('aktiv');
  }

  var allePunkte = document.querySelectorAll('.punkt');
  for (var j = 0; j < allePunkte.length; j++) {
    allePunkte[j].classList.remove('aktiv');
  }

  document.getElementById('slide-' + nummer).classList.add('aktiv');
  document.getElementById('punkt-' + nummer).classList.add('aktiv');

  aktuelleSlide = nummer;
}


function autoplayStarten() {
  autoplayTimer = setInterval(function() {
    slideAnzeigen(aktuelleSlide + 1);
  }, 4500);
}

function autoplayNeuStarten() {
  clearInterval(autoplayTimer);
  autoplayStarten();
}


// Pfeil-Buttons
var btnZurueck = document.getElementById('slider-zurueck');
var btnWeiter = document.getElementById('slider-weiter');

if (btnZurueck) {
  btnZurueck.addEventListener('click', function() {
    slideAnzeigen(aktuelleSlide - 1);
    autoplayNeuStarten();
  });
}

if (btnWeiter) {
  btnWeiter.addEventListener('click', function() {
    slideAnzeigen(aktuelleSlide + 1);
    autoplayNeuStarten();
  });
}

// Punkte
var allePunkte = document.querySelectorAll('.punkt');
for (var k = 0; k < allePunkte.length; k++) {
  allePunkte[k].addEventListener('click', function() {
    var nummer = parseInt(this.id.replace('punkt-', ''));
    slideAnzeigen(nummer);
    autoplayNeuStarten();
  });
}

autoplayStarten();
