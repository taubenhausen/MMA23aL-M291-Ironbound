<?php
/* ============================================================
   promotion-speichern.php — IRONBOUND
   Empfängt POST-Daten vom Promotion-Formular
   und speichert sie in der MySQL-Datenbank.
   ============================================================ */

$db_host     = 'localhost';
$db_name     = 'ironbound_db';
$db_benutzer = 'ironboundteam';
$db_passwort = 'PASSWORT_HIER';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  echo json_encode(['status' => 'fehler', 'meldung' => 'Nur POST erlaubt.']);
  exit;
}

$vorname   = htmlspecialchars(trim($_POST['vorname']   ?? ''));
$nachname  = htmlspecialchars(trim($_POST['nachname']  ?? ''));
$email     = htmlspecialchars(trim($_POST['email']     ?? ''));
$plz       = htmlspecialchars(trim($_POST['plz']       ?? ''));
$interesse = htmlspecialchars(trim($_POST['interesse'] ?? ''));

// Server-seitige Validierung
if (empty($vorname) || empty($nachname) || empty($email) || empty($plz) || empty($interesse)) {
  echo json_encode(['status' => 'fehler', 'meldung' => 'Pflichtfelder fehlen.']);
  exit;
}

if (strpos($email, '@') === false || strpos($email, '.') === false) {
  echo json_encode(['status' => 'fehler', 'meldung' => 'Ungültige E-Mail.']);
  exit;
}

$plz_zahl = intval($plz);
if ($plz_zahl < 1000 || $plz_zahl > 9999) {
  echo json_encode(['status' => 'fehler', 'meldung' => 'Ungültige PLZ.']);
  exit;
}

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

// E-Mail-Check
$abfrage = $pdo->prepare('SELECT id FROM promotion_anmeldungen WHERE email = ?');
$abfrage->execute([$email]);

if ($abfrage->rowCount() > 0) {
  echo json_encode(['status' => 'email_vorhanden']);
  exit;
}

// Einfügen
$einfuegen = $pdo->prepare('
  INSERT INTO promotion_anmeldungen (vorname, nachname, email, plz, interesse, erstellt_am)
  VALUES (:vorname, :nachname, :email, :plz, :interesse, NOW())
');

$einfuegen->execute([
  ':vorname'   => $vorname,
  ':nachname'  => $nachname,
  ':email'     => $email,
  ':plz'       => $plz,
  ':interesse' => $interesse
]);

echo json_encode(['status' => 'ok']);
exit;
?>
