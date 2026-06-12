<?php
/* ============================================================
   newsletter-speichern.php — IRONBOUND
   Empfängt POST-Daten vom Newsletter-Formular
   und speichert sie in der MySQL-Datenbank.

   Verbindung via PDO (sicher: Prepared Statements)
   Gibt JSON zurück: {"status": "ok"} oder {"status": "fehler"}
   ============================================================ */

// ── Datenbankverbindung ─────────────────────────────────────────
// ANPASSEN: Zugangsdaten aus Plesk-Datenbank eintragen

$db_host     = 'localhost';
$db_name     = 'ironbound_db';   // Datenbank-Name aus Plesk
$db_benutzer = 'ironboundteam'; // DB-Benutzer aus Plesk
$db_passwort = 'Otwertka12.';  // DB-Passwort aus Plesk


// Antwort immer als JSON
header('Content-Type: application/json');

// Nur POST erlauben
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  echo json_encode(['status' => 'fehler', 'meldung' => 'Nur POST erlaubt.']);
  exit;
}

// ── Eingaben lesen und bereinigen ───────────────────────────────
// htmlspecialchars: verhindert XSS-Angriffe (Sicherheit)

$vorname   = htmlspecialchars(trim($_POST['vorname']   ?? ''));
$nachname  = htmlspecialchars(trim($_POST['nachname']  ?? ''));
$email     = htmlspecialchars(trim($_POST['email']     ?? ''));
$plz       = htmlspecialchars(trim($_POST['plz']       ?? ''));
$interesse = htmlspecialchars(trim($_POST['interesse'] ?? ''));

// ── Server-seitige Validierung ──────────────────────────────────
// Auch auf dem Server validieren (JS kann umgangen werden)

if (empty($vorname) || empty($nachname) || empty($email)) {
  echo json_encode(['status' => 'fehler', 'meldung' => 'Pflichtfelder fehlen.']);
  exit;
}

if (strpos($email, '@') === false || strpos($email, '.') === false) {
  echo json_encode(['status' => 'fehler', 'meldung' => 'Ungültige E-Mail.']);
  exit;
}

// ── Datenbankverbindung öffnen ──────────────────────────────────
try {
  $pdo = new PDO(
    'mysql:host=' . $db_host . ';dbname=' . $db_name . ';charset=utf8',
    $db_benutzer,
    $db_passwort,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
  );
} catch (PDOException $fehler) {
  echo json_encode(['status' => 'fehler', 'meldung' => 'Datenbankverbindung fehlgeschlagen.']);
  exit;
}


// ── Prüfen: E-Mail bereits vorhanden? ──────────────────────────
// Prepared Statement: verhindert SQL-Injection

$abfrage = $pdo->prepare('SELECT id FROM newsletter WHERE email = ?');
$abfrage->execute([$email]);

if ($abfrage->rowCount() > 0) {
  // E-Mail bereits in der Datenbank
  echo json_encode(['status' => 'email_vorhanden']);
  exit;
}


// ── Datensatz einfügen ──────────────────────────────────────────
// Prepared Statement mit benannten Parametern

$einfuegen = $pdo->prepare('
  INSERT INTO newsletter (vorname, nachname, email, plz, interesse, erstellt_am)
  VALUES (:vorname, :nachname, :email, :plz, :interesse, NOW())
');

$einfuegen->execute([
  ':vorname'   => $vorname,
  ':nachname'  => $nachname,
  ':email'     => $email,
  ':plz'       => $plz,
  ':interesse' => $interesse
]);

// Erfolg
echo json_encode(['status' => 'ok']);
exit;
?>
