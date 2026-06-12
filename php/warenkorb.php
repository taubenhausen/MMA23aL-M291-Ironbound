<?php
/* ============================================================
   warenkorb.php — IRONBOUND
   ------------------------------------------------------------
   Diese Datei nutzt KEINE neue Tabelle.

   Sie verwendet eure bestehenden Tabellen:
   - Kunden
   - Bestellungen
   - besteht_aus
   - Produkte

   Idee:
   Eine Bestellung mit lieferstatus = "Inventar" und zahlungsstatus
   = "offen" ist der aktuelle Warenkorb des eingeloggten Kunden.
   ============================================================ */

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
session_start();

require_once __DIR__ . '/../../private/db-config.php';

function json_antwort(array $daten, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($daten, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function request_wert(string $name, string $standard = ''): string
{
    return trim((string)($_POST[$name] ?? $_GET[$name] ?? $standard));
}

function kunden_id_oder_fehler(): int
{
    if (!isset($_SESSION['kunden_id'])) {
        json_antwort([
            'status' => 'nicht_eingeloggt',
            'meldung' => 'Bitte zuerst einloggen.'
        ], 401);
    }

    return (int)$_SESSION['kunden_id'];
}

function offene_bestellung_holen_oder_erstellen(PDO $pdo, int $kundenId): int
{
    /* --------------------------------------------------------
       Offene Inventar-Bestellung suchen
       -------------------------------------------------------- */
    $suche = $pdo->prepare('
        SELECT id
        FROM Bestellungen
        WHERE kunden_id = :kunden_id
          AND lieferstatus = "Inventar"
          AND zahlungsstatus = "offen"
        ORDER BY id DESC
        LIMIT 1
    ');
    $suche->execute([':kunden_id' => $kundenId]);
    $bestehendeId = $suche->fetchColumn();

    if ($bestehendeId) {
        return (int)$bestehendeId;
    }

    /* --------------------------------------------------------
       Falls noch kein Warenkorb existiert, legen wir eine neue
       Bestellung an. Alle benötigten Spalten eurer Tabelle werden
       bewusst gesetzt, damit keine NOT-NULL-Probleme entstehen.
       -------------------------------------------------------- */
    $insert = $pdo->prepare('
        INSERT INTO Bestellungen
            (kunden_id, bestelldatum, totale_kosten, lieferstatus, trackingnummer, zahlungsstatus)
        VALUES
            (:kunden_id, CURDATE(), 0, "Inventar", "", "offen")
    ');
    $insert->execute([':kunden_id' => $kundenId]);

    return (int)$pdo->lastInsertId();
}

function warenkorb_summe_aktualisieren(PDO $pdo, int $bestellungId): void
{
    /* --------------------------------------------------------
       Totale Kosten aus Produkte.preis * menge berechnen.
       Dadurch bleibt Bestellungen.totale_kosten automatisch aktuell.
       -------------------------------------------------------- */
    $update = $pdo->prepare('
        UPDATE Bestellungen b
        SET totale_kosten = (
            SELECT COALESCE(SUM(p.preis * ba.menge), 0)
            FROM besteht_aus ba
            INNER JOIN Produkte p ON p.id = ba.produkt_id
            WHERE ba.bestellungen_id = b.id
        )
        WHERE b.id = :bestellung_id
    ');
    $update->execute([':bestellung_id' => $bestellungId]);
}

function warenkorb_daten(PDO $pdo, int $bestellungId): array
{
    $kopf = $pdo->prepare('
        SELECT id, totale_kosten, lieferstatus, zahlungsstatus
        FROM Bestellungen
        WHERE id = :bestellung_id
        LIMIT 1
    ');
    $kopf->execute([':bestellung_id' => $bestellungId]);
    $bestellung = $kopf->fetch(PDO::FETCH_ASSOC) ?: [
        'id' => $bestellungId,
        'totale_kosten' => 0,
        'lieferstatus' => 'Inventar',
        'zahlungsstatus' => 'offen'
    ];

    $positionen = $pdo->prepare('
        SELECT
            p.id,
            p.name,
            p.kategorie,
            p.preis,
            ba.menge,
            (p.preis * ba.menge) AS positions_total
        FROM besteht_aus ba
        INNER JOIN Produkte p ON p.id = ba.produkt_id
        WHERE ba.bestellungen_id = :bestellung_id
        ORDER BY p.name ASC
    ');
    $positionen->execute([':bestellung_id' => $bestellungId]);
    $produkte = $positionen->fetchAll(PDO::FETCH_ASSOC);

    $anzahl = 0;
    foreach ($produkte as $produkt) {
        $anzahl += (int)$produkt['menge'];
    }

    return [
        'bestellung' => $bestellung,
        'produkte' => $produkte,
        'anzahl' => $anzahl
    ];
}

$action = request_wert('action', 'status');

try {
    $pdo = db_verbinden();

    if ($action === 'status') {
        if (!isset($_SESSION['kunden_id'])) {
            json_antwort(['status' => 'ok', 'eingeloggt' => false, 'anzahl' => 0]);
        }

        $kundenId = (int)$_SESSION['kunden_id'];
        $bestellungId = offene_bestellung_holen_oder_erstellen($pdo, $kundenId);
        $daten = warenkorb_daten($pdo, $bestellungId);

        json_antwort([
            'status' => 'ok',
            'eingeloggt' => true,
            'anzahl' => $daten['anzahl'],
            'bestellung' => $daten['bestellung']
        ]);
    }

    if ($action === 'liste') {
        $kundenId = kunden_id_oder_fehler();
        $bestellungId = offene_bestellung_holen_oder_erstellen($pdo, $kundenId);
        $daten = warenkorb_daten($pdo, $bestellungId);
        json_antwort(['status' => 'ok'] + $daten);
    }

    if ($action === 'hinzufuegen') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_antwort(['status' => 'fehler', 'meldung' => 'Nur POST erlaubt.'], 405);
        }

        $kundenId = kunden_id_oder_fehler();
        $produktId = (int)request_wert('produkt_id');

        if ($produktId <= 0) {
            json_antwort(['status' => 'fehler', 'meldung' => 'Ungültiges Produkt.'], 400);
        }

        $produktCheck = $pdo->prepare('SELECT COUNT(*) FROM Produkte WHERE id = :id');
        $produktCheck->execute([':id' => $produktId]);

        if ((int)$produktCheck->fetchColumn() === 0) {
            json_antwort(['status' => 'fehler', 'meldung' => 'Produkt nicht gefunden.'], 404);
        }

        $bestellungId = offene_bestellung_holen_oder_erstellen($pdo, $kundenId);

        $bestehend = $pdo->prepare('
            SELECT menge
            FROM besteht_aus
            WHERE bestellungen_id = :bestellung_id
              AND produkt_id = :produkt_id
            LIMIT 1
        ');
        $bestehend->execute([
            ':bestellung_id' => $bestellungId,
            ':produkt_id' => $produktId
        ]);

        $menge = $bestehend->fetchColumn();

        if ($menge !== false) {
            $update = $pdo->prepare('
                UPDATE besteht_aus
                SET menge = menge + 1
                WHERE bestellungen_id = :bestellung_id
                  AND produkt_id = :produkt_id
            ');
            $update->execute([
                ':bestellung_id' => $bestellungId,
                ':produkt_id' => $produktId
            ]);
        } else {
            $insert = $pdo->prepare('
                INSERT INTO besteht_aus
                    (bestellungen_id, produkt_id, menge)
                VALUES
                    (:bestellung_id, :produkt_id, 1)
            ');
            $insert->execute([
                ':bestellung_id' => $bestellungId,
                ':produkt_id' => $produktId
            ]);
        }

        warenkorb_summe_aktualisieren($pdo, $bestellungId);
        $daten = warenkorb_daten($pdo, $bestellungId);

        json_antwort([
            'status' => 'ok',
            'meldung' => 'Produkt wurde ins Inventar gelegt.'
        ] + $daten);
    }

    json_antwort(['status' => 'fehler', 'meldung' => 'Unbekannte Aktion.'], 400);

} catch (PDOException $e) {
    error_log($e->getMessage());
    json_antwort(['status' => 'fehler', 'meldung' => 'Datenbankfehler.'], 500);
}
