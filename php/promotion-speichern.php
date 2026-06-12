<?php
/* ============================================================
   promotion-speichern.php — IRONBOUND
   Empfängt POST-Daten vom Promotion-Formular (promotion.html)
   und speichert sie in der Tabelle "promotion_anmeldungen".

   Ablauf:
   1. DB-Konfiguration einbinden
   2. Nur POST-Requests erlauben
   3. Eingaben lesen und bereinigen
   4. Server-seitige Validierung
   5. Datenbankverbindung öffnen (PDO via db-config.php)
   6. E-Mail auf Duplikat prüfen
   7. Neuen Datensatz einfügen
   8. JSON-Antwort zurückgeben

   Gibt JSON zurück:
   {"status": "ok"}              = erfolgreich gespeichert
   {"status": "email_vorhanden"} = E-Mail bereits in DB
   {"status": "fehler", ...}     = Fehler aufgetreten
   ============================================================ */


/* ── Zugangsdaten aus zentraler Config laden ─────────────────── */
require_once 'db-config.php';
/* require_once: bindet db-config.php ein. */
/* Bricht ab wenn Datei nicht gefunden. Nur einmal einbinden. */


/* ── Antwort-Format festlegen ────────────────────────────────── */
header('Content-Type: application/json');


/* ── Nur POST-Requests erlauben ──────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'fehler', 'meldung' => 'Nur POST erlaubt.']);
    exit;
}


/* ── Eingaben lesen und bereinigen ───────────────────────────── */
$vorname   = htmlspecialchars(trim($_POST['vorname']   ?? ''));
$nachname  = htmlspecialchars(trim($_POST['nachname']  ?? ''));
$email     = htmlspecialchars(trim($_POST['email']     ?? ''));
$plz       = htmlspecialchars(trim($_POST['plz']       ?? ''));
$interesse = htmlspecialchars(trim($_POST['interesse'] ?? ''));


/* ── Server-seitige Validierung ──────────────────────────────── */
if (empty($vorname) || empty($nachname) || empty($email) || empty($plz) || empty($interesse)) {
    echo json_encode(['status' => 'fehler', 'meldung' => 'Pflichtfelder fehlen.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    /* filter_var mit FILTER_VALIDATE_EMAIL: robustere E-Mail-Prüfung als strpos. */
    echo json_encode(['status' => 'fehler', 'meldung' => 'Ungueltige E-Mail.']);
    exit;
}

$plz_zahl = intval($plz);
if ($plz_zahl < 1000 || $plz_zahl > 9999) {
    echo json_encode(['status' => 'fehler', 'meldung' => 'Ungueltige PLZ (1000-9999).']);
    exit;
}

$erlaubte_interessen = ['schwerter', 'schusswaffen', 'bogen', 'messer', 'stangenwaffen', 'digital'];
if (!in_array($interesse, $erlaubte_interessen)) {
    /* in_array: prüft ob Wert in Array vorhanden (Whitelist-Prüfung). */
    echo json_encode(['status' => 'fehler', 'meldung' => 'Ungueltige Auswahl.']);
    exit;
}


/* ── Datenbankverbindung öffnen ──────────────────────────────── */
$pdo = db_verbinden();
/* db_verbinden() aus db-config.php: gibt PDO-Objekt zurück. */


/* ── E-Mail bereits vorhanden prüfen ─────────────────────────── */
$check = $pdo->prepare('SELECT id FROM promotion_anmeldungen WHERE email = ?');
$check->execute([$email]);

if ($check->rowCount() > 0) {
    echo json_encode(['status' => 'email_vorhanden']);
    exit;
}


/* ── Neuen Datensatz in promotion_anmeldungen einfügen ───────── */
$insert = $pdo->prepare('
    INSERT INTO promotion_anmeldungen (vorname, nachname, email, plz, interesse)
    VALUES (:vorname, :nachname, :email, :plz, :interesse)
');
/* erstellt_am wird automatisch via DEFAULT CURRENT_TIMESTAMP gesetzt. */

$insert->execute([
    ':vorname'   => $vorname,
    ':nachname'  => $nachname,
    ':email'     => $email,
    ':plz'       => $plz_zahl,
    ':interesse' => $interesse
]);


/* ── Erfolg zurückgeben ──────────────────────────────────────── */
echo json_encode(['status' => 'ok']);
exit;
?>
