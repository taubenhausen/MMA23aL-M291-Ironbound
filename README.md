# Ironbound — Waffen-Shop
**Modul M290 — Gruppe: Jan, Enea, Tina, Sofija**

## Projektstruktur

```
ironbound/
├── index.html           ← Homepage (Hero, Sortiment, Promotionen, Newsletter-Formular)
├── shop.html            ← Shop / Produktliste (Suche, Filter, Produktraster)
├── promotion.html       ← Promotion Page (Formular + Versus Runner Game)
├── css/
│   └── style.css        ← Alle Styles (dark theme, responsive 500–1400px)
├── js/
│   ├── nav.js           ← Navigation ① (Hamburger-Menü, Scroll-Effekt)
│   ├── validate.js      ← Formular-Validierung ② (nur JavaScript, kein HTML5)
│   ├── slider.js        ← Image Slider ④ (Autoplay, Dots, Pfeile)
│   ├── shop.js          ← Live-Suche ④ + Filter-Chips + Scroll-Animationen ⑤
│   └── game.js          ← Versus Runner Game ③ (Canvas 2D)
├── img/
│   ├── logo-placeholder.svg
│   ├── hero-placeholder.svg
│   ├── promo1-3-placeholder.svg
│   ├── promo-banner-placeholder.svg
│   └── prod1-6-placeholder.svg
└── VALIDIERUNG.md       ← Validierungskonzept (Dokumentation)
```

## Interaktive Elemente (5 Pflicht-Elemente)

| # | Element | Datei | Trigger |
|---|---------|-------|---------|
| ① | Navigation / Hamburger-Menü | `js/nav.js` | Klick |
| ② | Formular-Validierung + DB | `js/validate.js` | blur, input, submit |
| ③ | Versus Runner Game | `js/game.js` | Spacebar, Klick, Touch |
| ④ | Image Slider + Live-Suche | `js/slider.js`, `js/shop.js` | Klick, keyup |
| ⑤ | Hamburger-Animation + Scroll-Fade | `js/nav.js`, `js/shop.js` | Scroll, Klick |

## Deployment auf GitHub Pages

1. Repository erstellen: `ironbound`
2. Alle Dateien pushen
3. Settings → Pages → Branch: `main` → Save
4. URL: `https://username.github.io/ironbound/`

## Deployment auf Plesk

1. Dateien per FTP in `/httpdocs/` hochladen
2. Oder Git-Deploy in Plesk unter «Git» konfigurieren
3. Kein Build-Schritt nötig — reines HTML/CSS/JS

## Responsive Breakpoints

- Mobile: 500px+
- Tablet: bis 900px (Hamburger-Menü, 2-spaltige Grids)
- Desktop: bis 1400px (volle Navigation, 3-4-spaltige Grids)
