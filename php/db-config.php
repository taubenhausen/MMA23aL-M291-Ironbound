<?php
/* ============================================================
   db-config.php — IRONBOUND
   Zentrale Datenbankverbindung für alle PHP-Dateien.
   Nur HIER müssen die Zugangsdaten eingetragen werden.

   WICHTIG: Werte aus Plesk übernehmen:
   Plesk → Datenbanken → Ironbound → Datenbankbenutzer verwalten
   ============================================================ */

$db_host     = 'localhost';
/* localhost = Datenbank läuft auf demselben Server wie PHP. */

$db_name     = 'Ironbound';
/* Exakter Datenbankname wie in phpMyAdmin angezeigt. */

$db_benutzer = 'BENUTZER_HIER';
/* Plesk: Datenbanken → Ironbound → Benutzer verwalten. */

$db_passwort = 'PASSWORT_HIER';
/* Das Passwort das beim Erstellen des DB-Benutzers gesetzt wurde. */


/* ── Verbindung herstellen ───────────────────────────────────── */
/* Diese Funktion gibt ein PDO-Objekt zurück oder bricht ab. */

function db_verbinden() {
    global $db_host, $db_name, $db_benutzer, $db_passwort;

    try {
        $pdo = new PDO(
            'mysql:host=' . $db_host . ';dbname=' . $db_name . ';charset=utf8',
            $db_benutzer,
            $db_passwort,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'fehler', 'meldung' => 'Datenbankverbindung fehlgeschlagen.']);
        exit;
    }
}
?>
