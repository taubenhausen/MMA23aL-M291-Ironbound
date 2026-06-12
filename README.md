# Ironbound — Waffen-Shop
**Modul M290 — Gruppe: Jan, Enea, Tina, Sofija**

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
4. URL: `https://username.github.io/ironbound/](https://github.com/taubenhausen/MMA23aL-M291-Ironbound/`

## Deployment auf Plesk

1. Dateien per FTP in `/ironbound.mma23.bbzwinf.ch` hochladen
2. Oder Git-Deploy in Plesk unter «Git» konfigurieren
3. Kein Build-Schritt nötig — reines HTML/CSS/JS

## Responsive Breakpoints

- Mobile: 500px+
- Tablet: bis 900px (Hamburger-Menü, 2-spaltige Grids)
- Desktop: bis 1400px (volle Navigation, 3-4-spaltige Grids)
