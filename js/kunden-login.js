/* ============================================================
   kunden-login.js — IRONBOUND
   ------------------------------------------------------------
   Diese Datei steuert die Kundenregistrierung und den Login.

   Wichtig:
   - Die Seite lädt nach erfolgreicher Registrierung/Login neu bzw.
     wechselt zum Shop.
   - Die Daten werden über php/kunden-login.php in der Tabelle Kunden
     verarbeitet.
   ============================================================ */

/* ------------------------------------------------------------
   Kurze Hilfsfunktion für Elemente
   ------------------------------------------------------------ */
function feld(id) {
  return document.getElementById(id);
}

/* ------------------------------------------------------------
   Fehlermeldung bei einem Formularfeld anzeigen
   ------------------------------------------------------------ */
function feldFehlerSetzen(input, fehlerElement, meldung) {
  if (input) {
    input.classList.add('feld-fehler');
    input.classList.remove('feld-ok');
  }

  if (fehlerElement) {
    fehlerElement.textContent = meldung;
  }
}

/* ------------------------------------------------------------
   Formularfeld als gültig markieren
   ------------------------------------------------------------ */
function feldOkSetzen(input, fehlerElement) {
  if (input) {
    input.classList.remove('feld-fehler');
    input.classList.add('feld-ok');
  }

  if (fehlerElement) {
    fehlerElement.textContent = '';
  }
}

/* ------------------------------------------------------------
   Allgemeine Meldung unter dem Formular anzeigen
   ------------------------------------------------------------ */
function meldungSetzen(id, text, anzeigen) {
  var element = feld(id);
  if (!element) return;

  element.textContent = text;
  element.style.display = anzeigen ? 'block' : 'none';
}

/* ------------------------------------------------------------
   Button/Spinner während dem Speichern steuern
   ------------------------------------------------------------ */
function ladezustandSetzen(aktiv) {
  var spinner = feld('spinner-kunden-login');
  var registerBtn = feld('registrieren-submit-btn');
  var loginBtn = feld('login-submit-btn');

  if (spinner) {
    spinner.style.display = aktiv ? 'block' : 'none';
  }

  if (registerBtn) {
    registerBtn.disabled = aktiv;
  }

  if (loginBtn) {
    loginBtn.disabled = aktiv;
  }
}

/* ------------------------------------------------------------
   Registrierung prüfen
   ------------------------------------------------------------ */
function registrierungIstGueltig() {
  var gueltig = true;

  var vorname = feld('k-vorname');
  var nachname = feld('k-nachname');
  var email = feld('k-email');
  var telefon = feld('k-telefonnummer');
  var passwort = feld('k-passwort');
  var agb = feld('k-agb');

  if (!vorname.value.trim() || vorname.value.trim().length < 2) {
    feldFehlerSetzen(vorname, feld('fehler-k-vorname'), 'Bitte mindestens 2 Zeichen eingeben.');
    gueltig = false;
  } else {
    feldOkSetzen(vorname, feld('fehler-k-vorname'));
  }

  if (!nachname.value.trim() || nachname.value.trim().length < 2) {
    feldFehlerSetzen(nachname, feld('fehler-k-nachname'), 'Bitte mindestens 2 Zeichen eingeben.');
    gueltig = false;
  } else {
    feldOkSetzen(nachname, feld('fehler-k-nachname'));
  }

  if (!email.value.trim() || !email.value.includes('@')) {
    feldFehlerSetzen(email, feld('fehler-k-email'), 'Bitte eine gültige E-Mail-Adresse eingeben.');
    gueltig = false;
  } else {
    feldOkSetzen(email, feld('fehler-k-email'));
  }

  if (!telefon.value.trim()) {
    feldFehlerSetzen(telefon, feld('fehler-k-telefonnummer'), 'Bitte eine Telefonnummer eingeben.');
    gueltig = false;
  } else {
    feldOkSetzen(telefon, feld('fehler-k-telefonnummer'));
  }

  if (!passwort.value || passwort.value.length < 8) {
    feldFehlerSetzen(passwort, feld('fehler-k-passwort'), 'Das Passwort muss mindestens 8 Zeichen lang sein.');
    gueltig = false;
  } else {
    feldOkSetzen(passwort, feld('fehler-k-passwort'));
  }

  if (!agb.checked) {
    feldFehlerSetzen(agb, feld('fehler-k-agb'), 'Bitte AGB und 18+ bestätigen.');
    gueltig = false;
  } else {
    feldOkSetzen(agb, feld('fehler-k-agb'));
  }

  return gueltig;
}

/* ------------------------------------------------------------
   Login prüfen
   ------------------------------------------------------------ */
function loginIstGueltig() {
  var gueltig = true;
  var email = feld('login-email');
  var passwort = feld('login-passwort');

  if (!email.value.trim() || !email.value.includes('@')) {
    feldFehlerSetzen(email, feld('fehler-login-email'), 'Bitte E-Mail eingeben.');
    gueltig = false;
  } else {
    feldOkSetzen(email, feld('fehler-login-email'));
  }

  if (!passwort.value) {
    feldFehlerSetzen(passwort, feld('fehler-login-passwort'), 'Bitte Passwort eingeben.');
    gueltig = false;
  } else {
    feldOkSetzen(passwort, feld('fehler-login-passwort'));
  }

  return gueltig;
}

/* ------------------------------------------------------------
   Registrierung an PHP senden
   ------------------------------------------------------------ */
function registrierungAbsenden(event) {
  event.preventDefault();

  meldungSetzen('kunden-erfolg', '', false);
  meldungSetzen('kunden-fehler', '', false);
  meldungSetzen('fehler-email-vorhanden', '', false);

  if (!registrierungIstGueltig()) {
    return;
  }

  ladezustandSetzen(true);

  var daten = new FormData(feld('kunden-registrieren-form'));
  daten.set('action', 'registrieren');
  daten.set('agb', feld('k-agb').checked ? '1' : '0');

  fetch('php/kunden-login.php', {
    method: 'POST',
    body: daten
  })
    .then(function(antwort) { return antwort.json(); })
    .then(function(daten) {
      if (daten.status === 'ok') {
        meldungSetzen('kunden-erfolg', '✔ Kundenkonto erstellt. Du wirst zum Shop weitergeleitet.', true);
        window.location.href = daten.redirect || 'shop.html';
        return;
      }

      if (daten.status === 'email_vorhanden') {
        meldungSetzen('fehler-email-vorhanden', '✖ Diese E-Mail-Adresse ist bereits registriert.', true);
        return;
      }

      meldungSetzen('kunden-fehler', daten.meldung || 'Die Registrierung ist fehlgeschlagen.', true);
    })
    .catch(function() {
      meldungSetzen('kunden-fehler', 'Datenbankfehler.', true);
    })
    .finally(function() {
      ladezustandSetzen(false);
    });
}

/* ------------------------------------------------------------
   Login an PHP senden
   ------------------------------------------------------------ */
function loginAbsenden(event) {
  event.preventDefault();

  meldungSetzen('kunden-erfolg', '', false);
  meldungSetzen('kunden-fehler', '', false);

  if (!loginIstGueltig()) {
    return;
  }

  ladezustandSetzen(true);

  var daten = new FormData(feld('kunden-login-form'));
  daten.set('action', 'login');

  fetch('php/kunden-login.php', {
    method: 'POST',
    body: daten
  })
    .then(function(antwort) { return antwort.json(); })
    .then(function(daten) {
      if (daten.status === 'ok') {
        meldungSetzen('kunden-erfolg', '✔ Login erfolgreich. Du wirst zum Shop weitergeleitet.', true);
        window.location.href = daten.redirect || 'shop.html';
        return;
      }

      meldungSetzen('kunden-fehler', daten.meldung || 'Login nicht möglich.', true);
    })
    .catch(function() {
      meldungSetzen('kunden-fehler', 'Datenbankfehler.', true);
    })
    .finally(function() {
      ladezustandSetzen(false);
    });
}


/* ------------------------------------------------------------
   Passwort anzeigen / verstecken
   ------------------------------------------------------------
   Die Passwortfelder bleiben optisch normale Formularfelder.
   Mit dem Augen-Button kann der Inhalt kurz sichtbar gemacht
   und wieder verdeckt werden.
   ------------------------------------------------------------ */
function passwortToggleEinrichten() {
  var buttons = document.querySelectorAll('.passwort-toggle');

  buttons.forEach(function(button) {
    button.addEventListener('click', function() {
      var zielId = button.getAttribute('data-target');
      var input = feld(zielId);
      if (!input) return;

      var istVerdeckt = input.type === 'password';
      input.type = istVerdeckt ? 'text' : 'password';
      button.textContent = istVerdeckt ? '🙈' : '👁';
      button.setAttribute('aria-label', istVerdeckt ? 'Passwort verstecken' : 'Passwort anzeigen');
    });
  });
}

/* ------------------------------------------------------------
   Start: Events verbinden
   ------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', function() {
  passwortToggleEinrichten();

  var registrierenForm = feld('kunden-registrieren-form');
  var loginForm = feld('kunden-login-form');

  if (registrierenForm) {
    registrierenForm.addEventListener('submit', registrierungAbsenden);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', loginAbsenden);
  }
});
