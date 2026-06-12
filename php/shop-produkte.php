<?php
declare(strict_types=1);

/* ============================================================
   shop-produkte.php — IRONBOUND

   Aufgabe dieser Datei:
   - Produkte aus der Plesk-Datenbank lesen
   - Filter, Suche, Sortierung und Limit verarbeiten
   - Die Daten als JSON an shop.js und index.js zurückgeben

   Wichtig:
   Die echten Datenbank-Zugangsdaten stehen NICHT in dieser Datei.
   Sie liegen auf Plesk ausserhalb des öffentlichen Website-Ordners:
   Basisverzeichnis/private/db-config.php
   ============================================================ */


/* ─────────────────────────────────────────────────────────────
   1. Antwortformat festlegen
   -------------------------------------------------------------
   Diese Datei gibt immer JSON zurück, nie HTML.
   ─────────────────────────────────────────────────────────── */
header('Content-Type: application/json; charset=utf-8');


/* ─────────────────────────────────────────────────────────────
   2. Zentrale Datenbankverbindung laden
   -------------------------------------------------------------
   Diese PHP-Datei liegt öffentlich in:
   /ironbound.mma23.bbzwinf.ch/php/shop-produkte.php

   Die private Config liegt daneben im Basisverzeichnis:
   /private/db-config.php

   Darum geht der Pfad zwei Ebenen hoch und dann in /private.
   ─────────────────────────────────────────────────────────── */
require_once __DIR__ . '/../../private/db-config.php';


/* ─────────────────────────────────────────────────────────────
   3. Kleine Hilfsfunktion für JSON-Antworten
   -------------------------------------------------------------
   So sind alle Antworten gleich aufgebaut.
   ─────────────────────────────────────────────────────────── */
function json_antwort(array $daten, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($daten, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}


/* ─────────────────────────────────────────────────────────────
   4. Nur GET erlauben
   -------------------------------------------------------------
   Produkte werden nur gelesen. Deshalb ist GET die passende Methode.
   ─────────────────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_antwort([
        'status'  => 'fehler',
        'meldung' => 'Nur GET erlaubt.'
    ], 405);
}


try {
    /* ─────────────────────────────────────────────────────────
       5. Verbindung zur Datenbank öffnen
       ---------------------------------------------------------
       db_verbinden() kommt aus private/db-config.php.
       ─────────────────────────────────────────────────────── */
    $pdo = db_verbinden();


    /* ─────────────────────────────────────────────────────────
       6. Basis-Query vorbereiten
       ---------------------------------------------------------
       SELECT * wird hier bewusst verwendet, weil eure Produktkarten
       mehrere Spalten brauchen. Die Ausgabe wird danach normalisiert.

       WICHTIG: Falls eure Tabelle klein geschrieben ist, dann hier
       Produkte durch produkte ersetzen.
       ─────────────────────────────────────────────────────── */
    $sql = 'SELECT * FROM Produkte WHERE aktiv = 1';
    $params = [];


    /* ─────────────────────────────────────────────────────────
       7. Kategorie-Filter verarbeiten
       ---------------------------------------------------------
       Beispiele:
       ?filter=schwerter
       ?kat=schwerter  wird ebenfalls akzeptiert, weil eure Links
       auf der Startseite aktuell kat verwenden.
       ─────────────────────────────────────────────────────── */
    $filter = trim((string)($_GET['filter'] ?? $_GET['kat'] ?? ''));

    if ($filter !== '' && $filter !== 'alle') {
        $sql .= ' AND LOWER(filter_tags) LIKE :filter';
        $params[':filter'] = '%' . mb_strtolower($filter, 'UTF-8') . '%';
    }


    /* ─────────────────────────────────────────────────────────
       8. Textsuche verarbeiten
       ---------------------------------------------------------
       Gesucht wird in Name, Kategorie und Filter-Tags.
       ─────────────────────────────────────────────────────── */
    $suche = trim((string)($_GET['suche'] ?? ''));

    if ($suche !== '') {
        $sql .= ' AND (
            LOWER(name) LIKE :suche
            OR LOWER(kategorie) LIKE :suche
            OR LOWER(filter_tags) LIKE :suche
        )';
        $params[':suche'] = '%' . mb_strtolower($suche, 'UTF-8') . '%';
    }


    /* ─────────────────────────────────────────────────────────
       9. Bestseller-Filter für die Startseite
       ---------------------------------------------------------
       Optional möglich über:
       ?bestseller=1
       ─────────────────────────────────────────────────────── */
    $bestseller = trim((string)($_GET['bestseller'] ?? ''));

    if ($bestseller === '1') {
        $sql .= ' AND bestseller = 1';
    }


    /* ─────────────────────────────────────────────────────────
       10. Sortierung sicher auswählen
       ---------------------------------------------------------
       Die Sortierung wird nicht direkt aus der URL in SQL eingesetzt.
       Stattdessen erlauben wir nur feste Werte.
       ─────────────────────────────────────────────────────── */
    $sort = trim((string)($_GET['sort'] ?? 'relevanz'));

    switch ($sort) {
        case 'preis-asc':
            $sql .= ' ORDER BY preis ASC';
            break;

        case 'preis-desc':
            $sql .= ' ORDER BY preis DESC';
            break;

        case 'neu':
            $sql .= ' ORDER BY id DESC';
            break;

        default:
            $sql .= ' ORDER BY id ASC';
            break;
    }


    /* ─────────────────────────────────────────────────────────
       11. Optionales Limit verarbeiten
       ---------------------------------------------------------
       index.js kann damit z.B. nur 3 Produkte laden.
       Das Limit wird als Zahl geprüft und nie als Text in SQL übernommen.
       ─────────────────────────────────────────────────────── */
    $limit = filter_input(
        INPUT_GET,
        'limit',
        FILTER_VALIDATE_INT,
        [
            'options' => [
                'min_range' => 1,
                'max_range' => 50
            ]
        ]
    );

    if ($limit !== false && $limit !== null) {
        $sql .= ' LIMIT ' . (int)$limit;
    }


    /* ─────────────────────────────────────────────────────────
       12. Query ausführen
       ---------------------------------------------------------
       Prepared Statements schützen die dynamischen Werte vor SQL-Injection.
       ─────────────────────────────────────────────────────── */
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $produkte = $stmt->fetchAll();


    /* ─────────────────────────────────────────────────────────
       13. Produktdaten für JavaScript vereinheitlichen
       ---------------------------------------------------------
       JS erwartet bestimmte Felder. Hier ergänzen wir sinnvolle
       Standardwerte, falls ein Feld in der DB leer ist.
       ─────────────────────────────────────────────────────── */
    foreach ($produkte as &$produkt) {
        $id = (int)($produkt['id'] ?? 0);
        $skillPct = (int)($produkt['skill_pct'] ?? 0);

        $produkt['id'] = $id;
        $produkt['nummer'] = $produkt['nummer'] ?? str_pad((string)$id, 3, '0', STR_PAD_LEFT);
        $produkt['name'] = (string)($produkt['name'] ?? 'Unbekanntes Produkt');
        $produkt['kategorie'] = (string)($produkt['kategorie'] ?? '');
        $produkt['filter_tags'] = (string)($produkt['filter_tags'] ?? '');
        $produkt['preis'] = (float)($produkt['preis'] ?? 0);
        $produkt['skill_pct'] = $skillPct;
        $produkt['digital_twin'] = (bool)($produkt['digital_twin'] ?? false);
        $produkt['bestseller'] = (bool)($produkt['bestseller'] ?? false);
        $produkt['aktiv'] = (bool)($produkt['aktiv'] ?? true);

        /* JS nutzt bild. Falls die DB bild_url hat, wird es hier übernommen. */
        if (!isset($produkt['bild']) && isset($produkt['bild_url'])) {
            $produkt['bild'] = $produkt['bild_url'];
        }

        if (!isset($produkt['bild']) || trim((string)$produkt['bild']) === '') {
            $produkt['bild'] = 'img/prod1-placeholder.svg';
        }

        /* Skill-Level wird aus skill_pct abgeleitet, falls kein Text in der DB steht. */
        if (!isset($produkt['skill_level']) || trim((string)$produkt['skill_level']) === '') {
            if ($skillPct >= 85) {
                $produkt['skill_level'] = 'Profi';
            } elseif ($skillPct >= 55) {
                $produkt['skill_level'] = 'Fortgeschritten';
            } else {
                $produkt['skill_level'] = 'Einsteiger';
            }
        }
    }
    unset($produkt);


    /* ─────────────────────────────────────────────────────────
       14. Erfolgreiche Antwort zurückgeben
       ─────────────────────────────────────────────────────── */
    json_antwort([
        'status'   => 'ok',
        'produkte' => $produkte
    ]);

} catch (PDOException $e) {
    /* Der echte Fehler wird nur im Server-Log gespeichert. */
    error_log($e->getMessage());

    json_antwort([
        'status'  => 'fehler',
        'meldung' => 'Datenbankfehler.'
    ], 500);
}
