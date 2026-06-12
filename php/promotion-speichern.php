<?php
declare(strict_types=1);

/* ============================================================
   promotion-speichern.php — IRONBOUND

   Aufgabe dieser Datei:
   - POST-Daten vom Promotion-Formular empfangen
   - Server-seitig prüfen
   - Doppelte E-Mail-Adressen verhindern
   - Anmeldung in der Datenbank speichern
   - JSON-Antwort an formular-promo.js zurückgeben
   ============================================================ */


/* ─────────────────────────────────────────────────────────────
   1. Antwortformat und Datenbankverbindung
   -------------------------------------------------------------
   Die echte DB-Config liegt auf Plesk ausserhalb des öffentlichen
   Website-Ordners im Ordner private.
   ─────────────────────────────────────────────────────────── */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../private/db-config.php';


/* ─────────────────────────────────────────────────────────────
   2. Einheitliche JSON-Antworten
   -------------------------------------------------------------
   Dadurch muss echo json_encode nicht überall wiederholt werden.
   ─────────────────────────────────────────────────────────── */
function json_antwort(array $daten, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($daten, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}


/* ─────────────────────────────────────────────────────────────
   3. Nur POST erlauben
   -------------------------------------------------------------
   Das Formular sendet Daten, darum ist POST korrekt.
   ─────────────────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_antwort([
        'status'  => 'fehler',
        'meldung' => 'Nur POST erlaubt.'
    ], 405);
}


/* ─────────────────────────────────────────────────────────────
   4. Eingaben lesen und trimmen
   -------------------------------------------------------------
   Wir speichern keine HTML-Entities in der Datenbank. Darum wird hier
   nur getrimmt. HTML-Ausgabe würde später separat escaped werden.
   ─────────────────────────────────────────────────────────── */
$vorname = trim((string)($_POST['vorname'] ?? ''));
$nachname = trim((string)($_POST['nachname'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$plz = trim((string)($_POST['plz'] ?? ''));
$interesse = trim((string)($_POST['interesse'] ?? ''));
$agb = trim((string)($_POST['agb'] ?? '0'));


/* ─────────────────────────────────────────────────────────────
   5. Server-seitige Validierung
   -------------------------------------------------------------
   JS-Validierung ist gut für User-Komfort. PHP muss trotzdem prüfen,
   weil man JS im Browser umgehen kann.
   ─────────────────────────────────────────────────────────── */
if ($vorname === '' || $nachname === '' || $email === '' || $plz === '' || $interesse === '') {
    json_antwort([
        'status'  => 'fehler',
        'meldung' => 'Pflichtfelder fehlen.'
    ], 422);
}

if (!preg_match('/^[\p{L}\s\'\-]{2,}$/u', $vorname)) {
    json_antwort([
        'status'  => 'fehler',
        'meldung' => 'Ungültiger Vorname.'
    ], 422);
}

if (!preg_match('/^[\p{L}\s\'\-]{2,}$/u', $nachname)) {
    json_antwort([
        'status'  => 'fehler',
        'meldung' => 'Ungültiger Nachname.'
    ], 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_antwort([
        'status'  => 'fehler',
        'meldung' => 'Ungültige E-Mail.'
    ], 422);
}

if (!preg_match('/^\d{4}$/', $plz) || (int)$plz < 1000 || (int)$plz > 9999) {
    json_antwort([
        'status'  => 'fehler',
        'meldung' => 'Ungültige PLZ.'
    ], 422);
}

$erlaubteInteressen = ['schwerter', 'schusswaffen', 'bogen', 'messer', 'stangenwaffen', 'digital'];

if (!in_array($interesse, $erlaubteInteressen, true)) {
    json_antwort([
        'status'  => 'fehler',
        'meldung' => 'Ungültige Auswahl.'
    ], 422);
}

if ($agb !== '1') {
    json_antwort([
        'status'  => 'fehler',
        'meldung' => 'AGB und 18+ Bestätigung fehlen.'
    ], 422);
}


try {
    /* ─────────────────────────────────────────────────────────
       6. Datenbankverbindung öffnen
       ─────────────────────────────────────────────────────── */
    $pdo = db_verbinden();


    /* ─────────────────────────────────────────────────────────
       7. Doppelte E-Mail prüfen
       ---------------------------------------------------------
       COUNT(*) ist zuverlässiger als rowCount() bei SELECT-Abfragen.
       ─────────────────────────────────────────────────────── */
    $check = $pdo->prepare('SELECT COUNT(*) FROM promotion_anmeldungen WHERE email = :email');
    $check->execute([
        ':email' => $email
    ]);

    if ((int)$check->fetchColumn() > 0) {
        json_antwort([
            'status' => 'email_vorhanden'
        ], 409);
    }


    /* ─────────────────────────────────────────────────────────
       8. Neue Anmeldung speichern
       ---------------------------------------------------------
       erstellt_am kann in MySQL automatisch per DEFAULT CURRENT_TIMESTAMP
       gesetzt werden.
       ─────────────────────────────────────────────────────── */
    $insert = $pdo->prepare('
        INSERT INTO promotion_anmeldungen (vorname, nachname, email, plz, interesse)
        VALUES (:vorname, :nachname, :email, :plz, :interesse)
    ');

    $insert->execute([
        ':vorname'   => $vorname,
        ':nachname'  => $nachname,
        ':email'     => $email,
        ':plz'       => (int)$plz,
        ':interesse' => $interesse
    ]);


    /* ─────────────────────────────────────────────────────────
       9. Erfolg zurückgeben
       ─────────────────────────────────────────────────────── */
    json_antwort([
        'status' => 'ok'
    ]);

} catch (PDOException $e) {
    error_log($e->getMessage());

    json_antwort([
        'status'  => 'fehler',
        'meldung' => 'Datenbankfehler.'
    ], 500);
}
