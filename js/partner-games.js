/* ============================================================
   partner-games.js — IRONBOUND Digital-Twin-Sektion

   Aufgabe dieser Datei:
   - Partner-Spiele aus php/partner-games.php laden
   - Die bestehenden Badges in promotion.html ersetzen

   Wichtig:
   Die CSS-Klasse partner-badge bleibt gleich. Dadurch ändert sich
   das Aussehen nicht.
   ============================================================ */


document.addEventListener('DOMContentLoaded', function() {
  /* Container mit den bestehenden Game-A/Game-B/Game-C-Badges suchen. */
  var badgeContainer = document.querySelector('.partner-badges');

  /* Falls die Seite diesen Bereich nicht hat, bricht das Skript sauber ab. */
  if (!badgeContainer) {
    return;
  }

  /* Partner-Spiele aus der PHP-API laden. */
  fetch('php/partner-games.php')
    .then(function(antwort) {
      if (!antwort.ok) {
        throw new Error('Partner-Games-API nicht erreichbar.');
      }

      return antwort.json();
    })
    .then(function(daten) {
      if (daten.status !== 'ok' || !Array.isArray(daten.games) || daten.games.length === 0) {
        return;
      }

      /* Nur wenn echte Daten vorhanden sind, ersetzen wir die Platzhalter. */
      badgeContainer.innerHTML = '';

      daten.games.forEach(function(game) {
        var badge = document.createElement('span');
        badge.className = 'partner-badge';
        badge.textContent = game.name;
        badgeContainer.appendChild(badge);
      });
    })
    .catch(function() {
      /* Wenn die API nicht funktioniert, bleiben die bestehenden Platzhalter sichtbar. */
    });
});
