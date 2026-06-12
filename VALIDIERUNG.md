# Ironbound — Formular-Validierungskonzept

## Übersicht

Die Formular-Validierung erfolgt **ausschliesslich über JavaScript** (kein HTML5 `required`, kein `type="email"` zur Validierung). Das `novalidate`-Attribut am `<form>`-Tag schaltet die Browser-eigene Validierung aus.

---

## Validierungszeitpunkte

| Zeitpunkt | Auslöser | Verhalten |
|-----------|----------|-----------|
| Beim Verlassen | `blur` Event | Einzelnes Feld sofort geprüft |
| Beim Tippen | `input` Event | Fehler verschwindet wenn korrigiert |
| Beim Absenden | `submit` Event | Alle Felder geprüft |

---

## Formularfelder und Validierungsregeln

### Formular 1: Newsletter (index.html)

| Feld | Typ | Pflicht | Regeln | Fehlermeldung |
|------|-----|---------|--------|---------------|
| Vorname | Text | ✅ Ja | Mindestens 2 Zeichen; nur Buchstaben, Leerzeichen, Bindestriche | «Mindestens 2 Zeichen erforderlich.» / «Nur Buchstaben erlaubt.» |
| Nachname | Text | ✅ Ja | Mindestens 2 Zeichen; nur Buchstaben, Leerzeichen, Bindestriche | «Mindestens 2 Zeichen erforderlich.» |
| E-Mail | Text | ✅ Ja | Gültiges E-Mail-Format: `name@domain.tld` (Regex-Prüfung) | «Bitte gib eine gültige E-Mail-Adresse ein (z. B. max@example.ch).» |

### Formular 2: Kunden-Login (kunden-login.html)

| Feld | Typ | Pflicht | Regeln | Fehlermeldung |
|------|-----|---------|--------|---------------|
| Vorname | Text | ✅ Ja | Mindestens 2 Zeichen; nur Buchstaben, Leerzeichen, Bindestriche | «Mindestens 2 Zeichen erforderlich.» |
| Nachname | Text | ✅ Ja | Mindestens 2 Zeichen; nur Buchstaben, Leerzeichen, Bindestriche | «Mindestens 2 Zeichen erforderlich.» |
| E-Mail | Text | ✅ Ja | Gültiges E-Mail-Format: `name@domain.tld` | «Bitte gib eine gültige E-Mail-Adresse ein.» |
| Waffen-Interesse | Select (Dropdown) | ✅ Ja | Darf nicht auf leerem Standardwert stehen (`value=""`) | «Bitte wähle eine Option.» |
| AGB (Checkbox) | Checkbox | ✅ Ja | Muss angehakt sein | «Bitte akzeptiere die AGB.» |

---

## Verwendete Regex

```javascript
// E-Mail-Validierung
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Name-Validierung (Buchstaben, Umlaute, Leerzeichen, Bindestriche)
const REGEX_NAME = /^[\p{L}\s'\-]{2,}$/u;
```

---

## Visuelles Feedback

| Zustand | Aussehen |
|---------|----------|
| Neutral | Grauer Rahmen |
| Fehler | Roter Rahmen + Fehlermeldung unter dem Feld |
| Korrekt | Grüner Rahmen |
| Erfolg | Grüne Erfolgs-Box erscheint, Formular wird zurückgesetzt |

---

## Technische Umsetzung

```javascript
// Initialisierung (im HTML-Script-Tag):
initFormValidation('promo-form', {
  'p-vorname':   { required: true, minLength: 2 },
  'p-nachname':  { required: true, minLength: 2 },
  'p-email':     { required: true, email: true },
  'p-interesse': { required: true, select: true },
  'p-agb':       { required: true, checkbox: true },
}, 'promo-success');
```

Die Funktion `initFormValidation()` ist in `js/validate.js` definiert und wiederverwendbar für alle Formulare im Projekt.
