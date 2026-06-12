<?php
declare(strict_types=1);

/* ============================================================
   kunden-login.php — IRONBOUND
   ------------------------------------------------------------
   Diese Datei ist die zentrale API für Kundenfunktionen.

   Sie nutzt die bestehende Tabelle "Kunden" und erstellt KEINE
   neue SQL-Tabelle.

   Unterstützte Aktionen:
   - action=registrieren  → neuer Kunde wird in Kunden gespeichert
   - action=login         → Kunde wird eingeloggt
   - action=logout        → Session wird beendet
   - action=status        → aktueller Login-Status wird zurückgegeben
   ============================================================ */

header('Content-Type: application/json; charset=utf-8');
session_start();

require_once __DIR__ . '/../../private/db-config.php';

/* ------------------------------------------------------------
   Einheitliche JSON-Antwort senden
   ------------------------------------------------------------ */
function json_antwort(array $daten, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($daten, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* ------------------------------------------------------------
   POST- oder GET-Wert lesen
   ------------------------------------------------------------ */
function request_wert(string $name, string $standard = ''): string
{
    return trim((string)($_POST[$name] ?? $_GET[$name] ?? $standard));
}

/* ------------------------------------------------------------
   Kunde in der Session speichern
   ------------------------------------------------------------ */
function kunde_in_session_setzen(array $kunde): void
{
    $_SESSION['kunden_id'] = (int)$kunde['id'];
    $_SESSION['kunden_name'] = trim((string)$kunde['vorname'] . ' ' . (string)$kunde['nachname']);
    $_SESSION['kunden_email'] = (string)$kunde['email'];
}

$action = request_wert('action', 'status');

try {
    $pdo = db_verbinden();

    /* --------------------------------------------------------
       Status zurückgeben
       --------------------------------------------------------
       Damit common.js weiss, ob oben "Kunden-Login" oder der
       Kundenname angezeigt werden soll.
       -------------------------------------------------------- */
    if ($action === 'status') {
        json_antwort([
            'status' => 'ok',
            'eingeloggt' => isset($_SESSION['kunden_id']),
            'kunde' => isset($_SESSION['kunden_id']) ? [
                'id' => (int)$_SESSION['kunden_id'],
                'name' => (string)($_SESSION['kunden_name'] ?? ''),
                'email' => (string)($_SESSION['kunden_email'] ?? '')
            ] : null
        ]);
    }

    /* --------------------------------------------------------
       Logout
       --------------------------------------------------------
       Die Session wird geleert. Danach ist kein Kunde mehr
       eingeloggt.
       -------------------------------------------------------- */
    if ($action === 'logout') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool)$params['secure'], (bool)$params['httponly']);
        }
        session_destroy();

        json_antwort([
            'status' => 'ok',
            'meldung' => 'Du wurdest ausgeloggt.'
        ]);
    }

    /* --------------------------------------------------------
       Registrierung
       --------------------------------------------------------
       Das Formular erstellt einen neuen Datensatz in Kunden.
       Passwörter werden mit password_hash() gesichert.
       -------------------------------------------------------- */
    if ($action === 'registrieren') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_antwort(['status' => 'fehler', 'meldung' => 'Nur POST erlaubt.'], 405);
        }

        $vorname = request_wert('vorname');
        $nachname = request_wert('nachname');
        $email = request_wert('email');
        $telefonnummer = request_wert('telefonnummer', request_wert('telefon'));
        $passwort = request_wert('passwort');
        $agb = request_wert('agb');

        if ($vorname === '' || $nachname === '' || $email === '' || $passwort === '') {
            json_antwort(['status' => 'fehler', 'meldung' => 'Bitte alle Pflichtfelder ausfüllen.'], 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_antwort(['status' => 'fehler', 'meldung' => 'Bitte eine gültige E-Mail-Adresse eingeben.'], 400);
        }

        if (strlen($passwort) < 8) {
            json_antwort(['status' => 'fehler', 'meldung' => 'Das Passwort muss mindestens 8 Zeichen lang sein.'], 400);
        }

        if ($agb !== '1' && $agb !== 'on') {
            json_antwort(['status' => 'fehler', 'meldung' => 'Bitte AGB und 18+ bestätigen.'], 400);
        }

        $check = $pdo->prepare('SELECT COUNT(*) FROM Kunden WHERE email = :email');
        $check->execute([':email' => $email]);

        if ((int)$check->fetchColumn() > 0) {
            json_antwort(['status' => 'email_vorhanden', 'meldung' => 'Diese E-Mail-Adresse ist bereits registriert.'], 409);
        }

        $passwortHash = password_hash($passwort, PASSWORD_DEFAULT);

        $insert = $pdo->prepare('
            INSERT INTO Kunden
                (letztes_einloggen, registrierungsdatum, passwort, telefonnummer, vorname, nachname, email, anzahl_einkaufe)
            VALUES
                (NULL, CURDATE(), :passwort, :telefonnummer, :vorname, :nachname, :email, 0)
        ');

        $insert->execute([
            ':passwort' => $passwortHash,
            ':telefonnummer' => $telefonnummer,
            ':vorname' => $vorname,
            ':nachname' => $nachname,
            ':email' => $email
        ]);

        $kundeId = (int)$pdo->lastInsertId();
        kunde_in_session_setzen([
            'id' => $kundeId,
            'vorname' => $vorname,
            'nachname' => $nachname,
            'email' => $email
        ]);

        json_antwort([
            'status' => 'ok',
            'meldung' => 'Kundenkonto wurde erstellt.',
            'redirect' => 'shop.html'
        ]);
    }

    /* --------------------------------------------------------
       Login
       --------------------------------------------------------
       Die E-Mail wird gesucht. Danach wird das Passwort geprüft.
       Für alte Testdaten erlauben wir zusätzlich einen Klartext-
       Vergleich, falls frühere Passwörter noch nicht gehasht wurden.
       -------------------------------------------------------- */
    if ($action === 'login') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_antwort(['status' => 'fehler', 'meldung' => 'Nur POST erlaubt.'], 405);
        }

        $email = request_wert('email');
        $passwort = request_wert('passwort');

        if ($email === '' || $passwort === '') {
            json_antwort(['status' => 'fehler', 'meldung' => 'Bitte E-Mail und Passwort eingeben.'], 400);
        }

        $stmt = $pdo->prepare('SELECT * FROM Kunden WHERE email = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        $kunde = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$kunde) {
            json_antwort(['status' => 'fehler', 'meldung' => 'Login nicht möglich.'], 401);
        }

        $gespeichertesPasswort = (string)($kunde['passwort'] ?? '');
        $passwortOk = password_verify($passwort, $gespeichertesPasswort) || hash_equals($gespeichertesPasswort, $passwort);

        if (!$passwortOk) {
            json_antwort(['status' => 'fehler', 'meldung' => 'Login nicht möglich.'], 401);
        }

        $update = $pdo->prepare('UPDATE Kunden SET letztes_einloggen = NOW() WHERE id = :id');
        $update->execute([':id' => (int)$kunde['id']]);

        kunde_in_session_setzen($kunde);

        json_antwort([
            'status' => 'ok',
            'meldung' => 'Login erfolgreich.',
            'redirect' => 'shop.html'
        ]);
    }

    json_antwort(['status' => 'fehler', 'meldung' => 'Unbekannte Aktion.'], 400);

} catch (PDOException $e) {
    error_log($e->getMessage());
    json_antwort(['status' => 'fehler', 'meldung' => 'Datenbankfehler.'], 500);
}
