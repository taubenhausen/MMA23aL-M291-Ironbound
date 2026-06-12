<?php
declare(strict_types=1);

/* ============================================================
   partner-games.php — IRONBOUND

   Aufgabe dieser Datei:
   - Aktive Partner-Spiele aus der Tabelle Partner_Games lesen
   - Die Daten als JSON an die Digital-Twin-Sektion zurückgeben
   ============================================================ */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../private/db-config.php';

function json_antwort(array $daten, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($daten, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_antwort([
        'status'  => 'fehler',
        'meldung' => 'Nur GET erlaubt.'
    ], 405);
}

try {
    $pdo = db_verbinden();

    /* Nur aktive Games werden auf der Website angezeigt. */
    $stmt = $pdo->query('
        SELECT id, name
        FROM Partner_Games
        WHERE aktivstatus = 1
        ORDER BY name ASC
    ');

    $games = $stmt->fetchAll();

    foreach ($games as &$game) {
        $game['id'] = (int)$game['id'];
        $game['name'] = (string)$game['name'];
    }
    unset($game);

    json_antwort([
        'status' => 'ok',
        'games'  => $games
    ]);

} catch (PDOException $e) {
    error_log($e->getMessage());

    json_antwort([
        'status'  => 'fehler',
        'meldung' => 'Partner-Spiele konnten nicht geladen werden.'
    ], 500);
}
