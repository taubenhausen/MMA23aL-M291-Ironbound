/* ============================================================
   formular-newsletter.js — IRONBOUND
   Newsletter-Formular Validierung + DB-Speicherung via PHP

   Felder und Validierungsregeln:
   - Vorname:   Pflicht, min. 2 Zeichen
   - Nachname:  Pflicht, min. 2 Zeichen
   - E-Mail:    Pflicht, muss @ und . enthalten
   - PLZ:       Optional, wenn ausgefüllt: 4-stellige Zahl (1000-9999)
   - Interesse: Optional
   ============================================================ */


var nlFormular = document.getElementById('newsletter-form');

if (nlFormular) {

  // ── Hilfsfunktionen ──────────────────────────────────────────

  function fehlerZeigen(feldId, meldung) {
    var feld = document.getElementById(feldId);
    var span = document.getElementById('fehler-' + feldId);
    if (feld) { feld.classList.add('feld-fehler'); feld.classList.remove('feld-ok'); }
    if (span) { span.textContent = meldung; }
  }

  function fehlerLoeschen(feldId) {
    var feld = document.getElementById(feldId);
    var span = document.getElementById('fehler-' + feldId);
    if (feld) { feld.classList.remove('feld-fehler'); feld.classList.add('feld-ok'); }
    if (span) { span.textContent = ''; }
  }

  function emailGueltig(email) {
    return email.indexOf('@') !== -1 && email.indexOf('.') !== -1;
  }

  function plzGueltig(plz) {
    // PLZ: nur Zahlen, zwischen 1000 und 9999
    var zahl = parseInt(plz);
    return !isNaN(zahl) && zahl >= 1000 && zahl <= 9999;
  }


  // ── Echtzeit-Validierung bei Eingabe ─────────────────────────

  document.getElementById('feld-vorname').addEventListener('input', function() {
    if (this.classList.contains('feld-fehler') && this.value.trim().length >= 2) {
      fehlerLoeschen('feld-vorname');
    }
  });

  document.getElementById('feld-nachname').addEventListener('input', function() {
    if (this.classList.contains('feld-fehler') && this.value.trim().length >= 2) {
      fehlerLoeschen('feld-nachname');
    }
  });

  document.getElementById('feld-email').addEventListener('input', function() {
    if (this.classList.contains('feld-fehler') && emailGueltig(this.value.trim())) {
      fehlerLoeschen('feld-email');
    }
  });

  document.getElementById('feld-plz').addEventListener('input', function() {
    var wert = this.value.trim();
    if (this.classList.contains('feld-fehler') && (wert === '' || plzGueltig(wert))) {
      fehlerLoeschen('feld-plz');
    }
  });


  // ── Submit ───────────────────────────────────────────────────

  nlFormular.addEventListener('submit', function(event) {
    event.preventDefault();

    // Felder auslesen
    var vorname  = document.getElementById('feld-vorname').value.trim();
    var nachname = document.getElementById('feld-nachname').value.trim();
    var email    = document.getElementById('feld-email').value.trim();
    var plz      = document.getElementById('feld-plz').value.trim();

    var fehler = 0;

    // Vorname prüfen
    if (vorname === '') {
      fehlerZeigen('feld-vorname', 'Bitte gib deinen Vornamen ein.');
      fehler = fehler + 1;
    } else if (vorname.length < 2) {
      fehlerZeigen('feld-vorname', 'Mindestens 2 Zeichen erforderlich.');
      fehler = fehler + 1;
    } else {
      fehlerLoeschen('feld-vorname');
    }

    // Nachname prüfen
    if (nachname === '') {
      fehlerZeigen('feld-nachname', 'Bitte gib deinen Nachnamen ein.');
      fehler = fehler + 1;
    } else if (nachname.length < 2) {
      fehlerZeigen('feld-nachname', 'Mindestens 2 Zeichen erforderlich.');
      fehler = fehler + 1;
    } else {
      fehlerLoeschen('feld-nachname');
    }

    // E-Mail prüfen
    if (email === '') {
      fehlerZeigen('feld-email', 'Bitte gib deine E-Mail-Adresse ein.');
      fehler = fehler + 1;
    } else if (!emailGueltig(email)) {
      fehlerZeigen('feld-email', 'Bitte gib eine gültige E-Mail ein (z.B. max@example.ch).');
      fehler = fehler + 1;
    } else {
      fehlerLoeschen('feld-email');
    }

    // PLZ prüfen (nur wenn ausgefüllt)
    if (plz !== '' && !plzGueltig(plz)) {
      fehlerZeigen('feld-plz', 'Bitte gib eine gültige CH-Postleitzahl ein (1000–9999).');
      fehler = fehler + 1;
    } else {
      fehlerLoeschen('feld-plz');
    }

    // Wenn Fehler vorhanden: abbrechen
    if (fehler > 0) {
      return;
    }

    // ── Daten an PHP senden (DB-Speicherung) ─────────────────

    var spinner = document.getElementById('spinner-newsletter');
    var erfolgMsg = document.getElementById('erfolg-newsletter');
    var emailVorhandenMsg = document.getElementById('fehler-email-vorhanden');
    var submitBtn = nlFormular.querySelector('[type="submit"]');

    // Spinner anzeigen, Button deaktivieren
    spinner.style.display = 'block';
    submitBtn.disabled = true;
    erfolgMsg.style.display = 'none';
    emailVorhandenMsg.style.display = 'none';

    // Formulardaten zusammenstellen
    var daten = new FormData();
    daten.append('vorname',   vorname);
    daten.append('nachname',  nachname);
    daten.append('email',     email);
    daten.append('plz',       plz);
    daten.append('interesse', document.getElementById('feld-interesse').value);

    // fetch: Daten an PHP-Datei senden
    fetch('php/newsletter-speichern.php', {
      method: 'POST',
      body: daten
    })
    .then(function(antwort) {
      return antwort.json();
    })
    .then(function(daten) {

      // Spinner verstecken
      spinner.style.display = 'none';
      submitBtn.disabled = false;

      if (daten.status === 'ok') {
        // Erfolg
        erfolgMsg.style.display = 'block';
        nlFormular.reset();
        // Feld-Klassen entfernen
        var felder = nlFormular.querySelectorAll('input, select');
        for (var i = 0; i < felder.length; i++) {
          felder[i].classList.remove('feld-ok', 'feld-fehler');
        }
        setTimeout(function() {
          erfolgMsg.style.display = 'none';
        }, 5000);

      } else if (daten.status === 'email_vorhanden') {
        // E-Mail bereits in DB
        emailVorhandenMsg.style.display = 'block';
        fehlerZeigen('feld-email', 'Diese E-Mail-Adresse ist bereits registriert.');

      } else {
        // Allgemeiner Fehler
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
