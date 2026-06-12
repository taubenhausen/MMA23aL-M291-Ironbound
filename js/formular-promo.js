/* ============================================================
   formular-promo.js — IRONBOUND
   Promotion-Formular Validierung + DB-Speicherung

   Felder und Validierungsregeln:
   - Vorname:    Pflicht, min. 2 Zeichen
   - Nachname:   Pflicht, min. 2 Zeichen
   - E-Mail:     Pflicht, muss @ und . enthalten
   - PLZ:        Pflicht, 4-stellige Zahl (1000-9999)
   - Interesse:  Pflicht, darf nicht leer sein
   - AGB:        Pflicht, muss angehakt sein
   ============================================================ */


var promoFormular = document.getElementById('promo-form');

if (promoFormular) {

  // ── Hilfsfunktionen ──────────────────────────────────────────

  function pFehlerZeigen(feldId, meldung) {
    var feld = document.getElementById(feldId);
    var span = document.getElementById('fehler-' + feldId);
    if (feld) { feld.classList.add('feld-fehler'); feld.classList.remove('feld-ok'); }
    if (span) { span.textContent = meldung; }
  }

  function pFehlerLoeschen(feldId) {
    var feld = document.getElementById(feldId);
    var span = document.getElementById('fehler-' + feldId);
    if (feld) { feld.classList.remove('feld-fehler'); feld.classList.add('feld-ok'); }
    if (span) { span.textContent = ''; }
  }

  function emailGueltig(email) {
    return email.indexOf('@') !== -1 && email.indexOf('.') !== -1;
  }

  function plzGueltig(plz) {
    var zahl = parseInt(plz);
    return !isNaN(zahl) && zahl >= 1000 && zahl <= 9999;
  }


  // ── Echtzeit-Validierung ─────────────────────────────────────

  document.getElementById('p-vorname').addEventListener('input', function() {
    if (this.classList.contains('feld-fehler') && this.value.trim().length >= 2) {
      pFehlerLoeschen('p-vorname');
    }
  });

  document.getElementById('p-nachname').addEventListener('input', function() {
    if (this.classList.contains('feld-fehler') && this.value.trim().length >= 2) {
      pFehlerLoeschen('p-nachname');
    }
  });

  document.getElementById('p-email').addEventListener('input', function() {
    if (this.classList.contains('feld-fehler') && emailGueltig(this.value.trim())) {
      pFehlerLoeschen('p-email');
    }
  });

  document.getElementById('p-plz').addEventListener('input', function() {
    if (this.classList.contains('feld-fehler') && plzGueltig(this.value.trim())) {
      pFehlerLoeschen('p-plz');
    }
  });

  document.getElementById('p-interesse').addEventListener('change', function() {
    if (this.classList.contains('feld-fehler') && this.value !== '') {
      pFehlerLoeschen('p-interesse');
    }
  });


  // ── Submit ───────────────────────────────────────────────────

  promoFormular.addEventListener('submit', function(event) {
    event.preventDefault();

    var vorname   = document.getElementById('p-vorname').value.trim();
    var nachname  = document.getElementById('p-nachname').value.trim();
    var email     = document.getElementById('p-email').value.trim();
    var plz       = document.getElementById('p-plz').value.trim();
    var interesse = document.getElementById('p-interesse').value;
    var agb       = document.getElementById('p-agb').checked;

    var fehler = 0;

    // Vorname
    if (vorname === '') {
      pFehlerZeigen('p-vorname', 'Pflichtfeld — bitte ausfüllen.');
      fehler = fehler + 1;
    } else if (vorname.length < 2) {
      pFehlerZeigen('p-vorname', 'Mindestens 2 Zeichen erforderlich.');
      fehler = fehler + 1;
    } else {
      pFehlerLoeschen('p-vorname');
    }

    // Nachname
    if (nachname === '') {
      pFehlerZeigen('p-nachname', 'Pflichtfeld — bitte ausfüllen.');
      fehler = fehler + 1;
    } else if (nachname.length < 2) {
      pFehlerZeigen('p-nachname', 'Mindestens 2 Zeichen erforderlich.');
      fehler = fehler + 1;
    } else {
      pFehlerLoeschen('p-nachname');
    }

    // E-Mail
    if (email === '') {
      pFehlerZeigen('p-email', 'Pflichtfeld — bitte ausfüllen.');
      fehler = fehler + 1;
    } else if (!emailGueltig(email)) {
      pFehlerZeigen('p-email', 'Ungültige E-Mail (z.B. max@example.ch).');
      fehler = fehler + 1;
    } else {
      pFehlerLoeschen('p-email');
    }

    // PLZ (Pflichtfeld auf dieser Seite)
    if (plz === '') {
      pFehlerZeigen('p-plz', 'Pflichtfeld — bitte ausfüllen.');
      fehler = fehler + 1;
    } else if (!plzGueltig(plz)) {
      pFehlerZeigen('p-plz', 'Ungültige PLZ — bitte 4-stellige Zahl eingeben (z.B. 8000).');
      fehler = fehler + 1;
    } else {
      pFehlerLoeschen('p-plz');
    }

    // Interesse (Dropdown)
    if (interesse === '') {
      pFehlerZeigen('p-interesse', 'Bitte wähle eine Option.');
      fehler = fehler + 1;
    } else {
      pFehlerLoeschen('p-interesse');
    }

    // AGB Checkbox
    if (!agb) {
      pFehlerZeigen('p-agb', 'Bitte bestätige, dass du 18+ bist und die AGB akzeptierst.');
      fehler = fehler + 1;
    } else {
      pFehlerLoeschen('p-agb');
    }

    if (fehler > 0) {
      return;
    }

    // ── Daten an PHP senden ──────────────────────────────────

    var spinner        = document.getElementById('spinner-promo');
    var erfolgMsg      = document.getElementById('erfolg-promo');
    var emailMsg       = document.getElementById('fehler-email-vorhanden');
    var submitBtn      = document.getElementById('promo-submit-btn');

    spinner.style.display = 'block';
    submitBtn.disabled = true;
    erfolgMsg.style.display = 'none';
    emailMsg.style.display = 'none';

    var daten = new FormData();
    daten.append('vorname',   vorname);
    daten.append('nachname',  nachname);
    daten.append('email',     email);
    daten.append('plz',       plz);
    daten.append('interesse', interesse);

    fetch('php/promotion-speichern.php', {
      method: 'POST',
      body: daten
    })
    .then(function(antwort) {
      return antwort.json();
    })
    .then(function(daten) {

      spinner.style.display = 'none';
      submitBtn.disabled = false;

      if (daten.status === 'ok') {
        erfolgMsg.style.display = 'block';
        promoFormular.reset();
        var felder = promoFormular.querySelectorAll('input, select');
        for (var i = 0; i < felder.length; i++) {
          felder[i].classList.remove('feld-ok', 'feld-fehler');
        }
        setTimeout(function() {
          erfolgMsg.style.display = 'none';
        }, 5000);

      } else if (daten.status === 'email_vorhanden') {
        emailMsg.style.display = 'block';
        pFehlerZeigen('p-email', 'Diese E-Mail-Adresse ist bereits registriert.');

      } else {
        alert('Fehler beim Speichern. Bitte versuche es erneut.');
      }

    })
    .catch(function() {
      spinner.style.display = 'none';
      submitBtn.disabled = false;
      alert('Verbindungsfehler. Bitte versuche es erneut.');
    });

  });

}
