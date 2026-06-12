/* ============================================================
   formular-promo.js — IRONBOUND

   Aufgabe dieser Datei:
   - Promotion-Formular prüfen
   - Fehler direkt beim Eingeben entfernen
   - Gültige Daten per fetch() an PHP senden
   - Erfolg, doppelte E-Mail oder Verbindungsfehler anzeigen

   Wichtig:
   Alle bestehenden IDs und CSS-Klassen bleiben gleich. Dadurch bleiben
   Formular-Design, Spinner und Meldungen unverändert.
   ============================================================ */


/* ─────────────────────────────────────────────────────────────
   1. Formular suchen
   -------------------------------------------------------------
   Die Datei ist nur aktiv, wenn das Formular auf der Seite existiert.
   So entstehen keine Fehler, falls die Datei später anders eingebunden wird.
   ─────────────────────────────────────────────────────────── */
var promoFormular = document.getElementById('promo-form');


if (promoFormular) {

  /* ───────────────────────────────────────────────────────────
     2. Einzelne Felder zentral definieren
     -----------------------------------------------------------
     Dadurch schreiben wir die IDs nur einmal und können sie später
     einfacher ändern, falls nötig.
     ───────────────────────────────────────────────────────── */
  var FELDER = {
    vorname: document.getElementById('p-vorname'),
    nachname: document.getElementById('p-nachname'),
    email: document.getElementById('p-email'),
    plz: document.getElementById('p-plz'),
    interesse: document.getElementById('p-interesse'),
    agb: document.getElementById('p-agb')
  };

  var spinner = document.getElementById('spinner-promo');
  var erfolgMsg = document.getElementById('erfolg-promo');
  var emailVorhandenMsg = document.getElementById('fehler-email-vorhanden');
  var submitBtn = document.getElementById('promo-submit-btn');


  /* ───────────────────────────────────────────────────────────
     3. Fehlermeldung anzeigen
     -----------------------------------------------------------
     Die Fehlermeldung steht immer in einem <span> mit der ID
     fehler- plus Feld-ID, zum Beispiel fehler-p-vorname.
     ───────────────────────────────────────────────────────── */
  function fehlerZeigen(feld, meldung) {
    var fehlerText = document.getElementById('fehler-' + feld.id);

    feld.classList.add('feld-fehler');
    feld.classList.remove('feld-ok');

    if (fehlerText) {
      fehlerText.textContent = meldung;
    }
  }


  /* ───────────────────────────────────────────────────────────
     4. Fehlermeldung entfernen
     -----------------------------------------------------------
     Wenn ein Feld korrekt ist, bekommt es die Klasse feld-ok.
     Das CSS zeigt dadurch den grünen Rahmen.
     ───────────────────────────────────────────────────────── */
  function fehlerLoeschen(feld) {
    var fehlerText = document.getElementById('fehler-' + feld.id);

    feld.classList.remove('feld-fehler');
    feld.classList.add('feld-ok');

    if (fehlerText) {
      fehlerText.textContent = '';
    }
  }


  /* ───────────────────────────────────────────────────────────
     5. E-Mail prüfen
     -----------------------------------------------------------
     Diese Prüfung ist bewusst einfach lesbar, aber zuverlässiger als
     nur auf @ und Punkt zu prüfen.
     ───────────────────────────────────────────────────────── */
  function emailGueltig(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }


  /* ───────────────────────────────────────────────────────────
     6. PLZ prüfen
     -----------------------------------------------------------
     Für die Schweiz erwarten wir eine 4-stellige Zahl von 1000-9999.
     ───────────────────────────────────────────────────────── */
  function plzGueltig(plz) {
    return /^\d{4}$/.test(plz) && Number(plz) >= 1000 && Number(plz) <= 9999;
  }


  /* ───────────────────────────────────────────────────────────
     7. Namen prüfen
     -----------------------------------------------------------
     Mindestens 2 Zeichen. Buchstaben, Leerzeichen, Bindestriche und
     Apostrophe sind erlaubt.
     ───────────────────────────────────────────────────────── */
  function nameGueltig(name) {
    return /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-]{2,}$/.test(name);
  }


  /* ───────────────────────────────────────────────────────────
     8. Einzelnes Feld prüfen
     -----------------------------------------------------------
     Diese Funktion wird beim Absenden und bei Eingaben verwendet.
     Sie gibt true zurück, wenn das Feld gültig ist.
     ───────────────────────────────────────────────────────── */
  function feldPruefen(feldName) {
    var feld = FELDER[feldName];

    if (!feld) {
      return true;
    }

    var wert = feld.type === 'checkbox' ? feld.checked : feld.value.trim();

    if (feldName === 'vorname' || feldName === 'nachname') {
      if (wert === '') {
        fehlerZeigen(feld, 'Pflichtfeld — bitte ausfüllen.');
        return false;
      }

      if (!nameGueltig(wert)) {
        fehlerZeigen(feld, 'Mindestens 2 Zeichen, nur Buchstaben erlaubt.');
        return false;
      }

      fehlerLoeschen(feld);
      return true;
    }

    if (feldName === 'email') {
      if (wert === '') {
        fehlerZeigen(feld, 'Pflichtfeld — bitte ausfüllen.');
        return false;
      }

      if (!emailGueltig(wert)) {
        fehlerZeigen(feld, 'Ungültige E-Mail, z.B. max@example.ch.');
        return false;
      }

      fehlerLoeschen(feld);
      return true;
    }

    if (feldName === 'plz') {
      if (wert === '') {
        fehlerZeigen(feld, 'Pflichtfeld — bitte ausfüllen.');
        return false;
      }

      if (!plzGueltig(wert)) {
        fehlerZeigen(feld, 'Ungültige PLZ — bitte 4-stellige Zahl eingeben, z.B. 8000.');
        return false;
      }

      fehlerLoeschen(feld);
      return true;
    }

    if (feldName === 'interesse') {
      if (wert === '') {
        fehlerZeigen(feld, 'Bitte wähle eine Option.');
        return false;
      }

      fehlerLoeschen(feld);
      return true;
    }

    if (feldName === 'agb') {
      if (!wert) {
        fehlerZeigen(feld, 'Bitte bestätige, dass du 18+ bist und die AGB akzeptierst.');
        return false;
      }

      fehlerLoeschen(feld);
      return true;
    }

    return true;
  }


  /* ───────────────────────────────────────────────────────────
     9. Ganzes Formular prüfen
     -----------------------------------------------------------
     Alle Felder werden geprüft. Nur wenn alles stimmt, darf die
     Anfrage an PHP gesendet werden.
     ───────────────────────────────────────────────────────── */
  function formularPruefen() {
    var gueltig = true;
    var feldNamen = ['vorname', 'nachname', 'email', 'plz', 'interesse', 'agb'];

    for (var i = 0; i < feldNamen.length; i++) {
      if (!feldPruefen(feldNamen[i])) {
        gueltig = false;
      }
    }

    return gueltig;
  }


  /* ───────────────────────────────────────────────────────────
     10. Ladezustand anzeigen oder verstecken
     -----------------------------------------------------------
     Während dem Speichern wird der Button deaktiviert und der Spinner
     angezeigt. So klickt man nicht mehrfach auf Absenden.
     ───────────────────────────────────────────────────────── */
  function ladezustandSetzen(istAmLaden) {
    if (spinner) {
      spinner.style.display = istAmLaden ? 'block' : 'none';
    }

    if (submitBtn) {
      submitBtn.disabled = istAmLaden;
    }
  }


  /* ───────────────────────────────────────────────────────────
     11. Meldungen zurücksetzen
     -----------------------------------------------------------
     Vor jedem neuen Sendeversuch werden alte Erfolg- und Fehlerboxen
     ausgeblendet.
     ───────────────────────────────────────────────────────── */
  function meldungenZuruecksetzen() {
    if (erfolgMsg) {
      erfolgMsg.style.display = 'none';
    }

    if (emailVorhandenMsg) {
      emailVorhandenMsg.style.display = 'none';
    }
  }


  /* ───────────────────────────────────────────────────────────
     12. FormData für PHP bauen
     -----------------------------------------------------------
     Die Namen müssen zu promotion-speichern.php passen.
     ───────────────────────────────────────────────────────── */
  function formDatenBauen() {
    var daten = new FormData();

    daten.append('vorname', FELDER.vorname.value.trim());
    daten.append('nachname', FELDER.nachname.value.trim());
    daten.append('email', FELDER.email.value.trim());
    daten.append('plz', FELDER.plz.value.trim());
    daten.append('interesse', FELDER.interesse.value);
    daten.append('agb', FELDER.agb.checked ? '1' : '0');

    return daten;
  }


  /* ───────────────────────────────────────────────────────────
     13. Formular nach Erfolg zurücksetzen
     -----------------------------------------------------------
     Nach erfolgreicher Speicherung wird das Formular geleert und die
     grünen/roten Rahmen werden entfernt.
     ───────────────────────────────────────────────────────── */
  function formularZuruecksetzen() {
    promoFormular.reset();

    var felder = promoFormular.querySelectorAll('input, select');
    for (var i = 0; i < felder.length; i++) {
      felder[i].classList.remove('feld-ok', 'feld-fehler');
    }

    var fehlerTexte = promoFormular.querySelectorAll('.fehler-text');
    for (var j = 0; j < fehlerTexte.length; j++) {
      fehlerTexte[j].textContent = '';
    }
  }


  /* ───────────────────────────────────────────────────────────
     14. Daten an PHP senden
     -----------------------------------------------------------
     PHP speichert die Anmeldung in der Datenbank und sendet eine
     JSON-Antwort zurück.
     ───────────────────────────────────────────────────────── */
  function anmeldungSpeichern() {
    ladezustandSetzen(true);
    meldungenZuruecksetzen();

    fetch('php/promotion-speichern.php', {
      method: 'POST',
      body: formDatenBauen()
    })
      .then(function (antwort) {
        return antwort.json();
      })
      .then(function (daten) {
        ladezustandSetzen(false);

        if (daten.status === 'ok') {
          if (erfolgMsg) {
            erfolgMsg.style.display = 'block';
          }

          formularZuruecksetzen();

          setTimeout(function () {
            if (erfolgMsg) {
              erfolgMsg.style.display = 'none';
            }
          }, 5000);

          return;
        }

        if (daten.status === 'email_vorhanden') {
          if (emailVorhandenMsg) {
            emailVorhandenMsg.style.display = 'block';
          }

          fehlerZeigen(FELDER.email, 'Diese E-Mail-Adresse ist bereits registriert.');
          return;
        }

        alert(daten.meldung || 'Fehler beim Speichern. Bitte versuche es erneut.');
      })
      .catch(function () {
        ladezustandSetzen(false);
        alert('Verbindungsfehler. Bitte versuche es erneut.');
      });
  }


  /* ───────────────────────────────────────────────────────────
     15. Echtzeit-Validierung einrichten
     -----------------------------------------------------------
     Wenn ein Feld rot ist und korrigiert wird, verschwindet der Fehler
     sofort. Das ist die bestehende Funktionalität, nur sauberer gebündelt.
     ───────────────────────────────────────────────────────── */
  FELDER.vorname.addEventListener('input', function () { feldPruefen('vorname'); });
  FELDER.nachname.addEventListener('input', function () { feldPruefen('nachname'); });
  FELDER.email.addEventListener('input', function () { feldPruefen('email'); });
  FELDER.plz.addEventListener('input', function () { feldPruefen('plz'); });
  FELDER.interesse.addEventListener('change', function () { feldPruefen('interesse'); });
  FELDER.agb.addEventListener('change', function () { feldPruefen('agb'); });


  /* ───────────────────────────────────────────────────────────
     16. Submit abfangen
     -----------------------------------------------------------
     Der Browser lädt die Seite nicht neu. Stattdessen prüft JS die
     Eingaben und sendet sie per fetch() an PHP.
     ───────────────────────────────────────────────────────── */
  promoFormular.addEventListener('submit', function (event) {
    event.preventDefault();

    meldungenZuruecksetzen();

    if (!formularPruefen()) {
      return;
    }

    anmeldungSpeichern();
  });

}
