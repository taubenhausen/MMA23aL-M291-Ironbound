/**
 * validate.js — Ironbound
 * Interaktives Element ②: Formular-Validierung (nur JavaScript, keine HTML5-Validierung)
 *
 * Validierungskonzept / Dokumentation:
 * ─────────────────────────────────────────────────────────────────────────
 * Feld            │ Regeln
 * ────────────────┼────────────────────────────────────────────────────────
 * Vorname         │ required, minLength: 2, nur Buchstaben/Bindestriche
 * Nachname        │ required, minLength: 2, nur Buchstaben/Bindestriche
 * E-Mail          │ required, gültiges E-Mail-Format (Regex)
 * Waffen-Interesse│ required, Dropdown darf nicht auf leerem Wert stehen
 * AGB (Checkbox)  │ required, muss angehakt sein
 * ─────────────────────────────────────────────────────────────────────────
 * Validierungszeitpunkt:
 *   - Beim Absenden (submit): alle Felder geprüft
 *   - Beim Verlassen eines Feldes (blur): einzelnes Feld geprüft (Echtzeit-Feedback)
 *   - Beim Tippen (input): Fehler werden sofort gelöscht wenn korrigiert
 *
 * Fehlermeldungen: rot unter dem Feld
 * Erfolg: grüner Rahmen, Formular wird zurückgesetzt
 */

/**
 * initFormValidation(formId, rules, successId)
 *
 * @param {string} formId    - ID des <form>-Elements
 * @param {object} rules     - Objekt mit Feld-IDs als Keys und Regel-Objekten als Values
 * @param {string} successId - ID des Erfolgs-Div
 *
 * Regel-Objekte:
 *   { required: true }
 *   { required: true, minLength: 2 }
 *   { required: true, email: true }
 *   { required: true, select: true }    // Dropdown
 *   { required: true, checkbox: true }  // Checkbox
 */
function initFormValidation(formId, rules, successId) {
  const form = document.getElementById(formId);
  if (!form) return;

  // ── Validierungsregeln ──────────────────────────────────────────────────

  const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const REGEX_NAME  = /^[A-Za-zÀ-öø-ÿÄÖÜäöüß\s'\-]{2,}$/;

  function validateField(id, rule) {
    const el = document.getElementById(id);
    const errEl = document.getElementById('err-' + id);
    if (!el) return true;

    const val = el.type === 'checkbox' ? el.checked : el.value.trim();
    let error = '';

    // Pflichtfeld leer?
    if (rule.required) {
      if (rule.checkbox && !val) {
        error = 'Bitte akzeptiere die AGB.';
      } else if (rule.select && !val) {
        error = 'Bitte wähle eine Option.';
      } else if (!rule.checkbox && !rule.select && val === '') {
        error = 'Dieses Feld ist erforderlich.';
      }
    }

    // Mindestlänge
    if (!error && rule.minLength && val.length < rule.minLength) {
      error = `Mindestens ${rule.minLength} Zeichen erforderlich.`;
    }

    // Name-Format
    if (!error && rule.minLength && !rule.email) {
      if (!REGEX_NAME.test(val)) {
        error = 'Nur Buchstaben, Leerzeichen und Bindestriche erlaubt.';
      }
    }

    // E-Mail-Format
    if (!error && rule.email && val !== '') {
      if (!REGEX_EMAIL.test(val)) {
        error = 'Bitte gib eine gültige E-Mail-Adresse ein (z. B. max@example.ch).';
      }
    }

    // Feedback anzeigen
    if (errEl) errEl.textContent = error;

    if (!rule.checkbox) {
      el.classList.toggle('input-error', !!error);
      el.classList.toggle('input-ok', !error && val !== '');
    }

    return !error;
  }

  // ── Blur-Validierung (Echtzeit, einzelnes Feld) ─────────────────────────

  Object.entries(rules).forEach(([id, rule]) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('blur', () => validateField(id, rule));

    // Beim Tippen: Fehler sofort löschen wenn behoben
    el.addEventListener('input', () => {
      const errEl = document.getElementById('err-' + id);
      const val = el.type === 'checkbox' ? el.checked : el.value.trim();
      if (val) {
        // Nur validieren wenn bereits Fehler angezeigt wird
        if (errEl && errEl.textContent) {
          validateField(id, rule);
        }
      }
    });
  });

  // ── Submit-Validierung ───────────────────────────────────────────────────

  form.addEventListener('submit', function (e) {
    e.preventDefault(); // Kein HTML5-Submit

    let allValid = true;

    Object.entries(rules).forEach(([id, rule]) => {
      const fieldValid = validateField(id, rule);
      if (!fieldValid) allValid = false;
    });

    if (allValid) {
      // Erfolg anzeigen
      const successEl = document.getElementById(successId);
      if (successEl) {
        successEl.style.display = 'block';
        setTimeout(() => { successEl.style.display = 'none'; }, 4000);
      }

      // Formular zurücksetzen
      form.reset();
      Object.keys(rules).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.remove('input-error', 'input-ok');
        }
        const errEl = document.getElementById('err-' + id);
        if (errEl) errEl.textContent = '';
      });
    } else {
      // Zum ersten Fehlerfeld scrollen
      const firstError = form.querySelector('.input-error');
      if (firstError) firstError.focus();
    }
  });
}
