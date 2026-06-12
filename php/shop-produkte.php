<?php
declare(strict_types=1);

/* ============================================================
   shop-produkte.php — IRONBOUND

   Aufgabe dieser Datei:
   - Produkte aus eurer bestehenden Plesk-Datenbank lesen
   - Filter, Suche, Sortierung und Limit verarbeiten
   - Die Daten so umformen, dass shop.js und index.js nichts ändern müssen

   Wichtig:
   Eure Tabelle Produkte hat KEINE Spalten wie aktiv, filter_tags,
   skill_pct, digital_twin oder bestseller. Diese Werte werden hier
   aus den vorhandenen Tabellen abgeleitet.
   ============================================================ */


/* ─────────────────────────────────────────────────────────────
   1. Antwortformat festlegen
   -------------------------------------------------------------
   Diese Datei gibt immer JSON zurück, nie HTML.
   ─────────────────────────────────────────────────────────── */
header('Content-Type: application/json; charset=utf-8');


/* ─────────────────────────────────────────────────────────────
   2. Private Datenbank-Konfiguration laden
   -------------------------------------------------------------
   Diese Datei liegt öffentlich in:
   /ironbound.mma23.bbzwinf.ch/php/shop-produkte.php

   Die Zugangsdaten liegen privat in:
   /private/db-config.php

   Deshalb gehen wir zwei Ebenen hoch und dann in /private.
   ─────────────────────────────────────────────────────────── */
require_once __DIR__ . '/../../private/db-config.php';


/* ─────────────────────────────────────────────────────────────
   3. Einheitliche JSON-Antwort zurückgeben
   -------------------------------------------------------------
   So sehen Erfolg und Fehler immer gleich aus.
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
   Diese API liest nur Produkte. Speichern oder Löschen ist hier
   bewusst nicht erlaubt.
   ─────────────────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_antwort([
        'status'  => 'fehler',
        'meldung' => 'Nur GET erlaubt.'
    ], 405);
}


/* ─────────────────────────────────────────────────────────────
   5. Text klein schreiben
   -------------------------------------------------------------
   Die Funktion hilft uns beim Bauen von Filter-Tags. Falls mbstring
   auf dem Server nicht aktiv ist, funktioniert strtolower als Ersatz.
   ─────────────────────────────────────────────────────────── */
function text_klein(string $text): string
{
    if (function_exists('mb_strtolower')) {
        return mb_strtolower($text, 'UTF-8');
    }

    return strtolower($text);
}


/* ─────────────────────────────────────────────────────────────
   6. Prüfen, ob ein Text ein Wort enthält
   -------------------------------------------------------------
   Das ist lesbarer als viele verschachtelte strpos-Abfragen.
   ─────────────────────────────────────────────────────────── */
function enthaelt_eines_von(string $text, array $woerter): bool
{
    foreach ($woerter as $wort) {
        if ($wort !== '' && strpos($text, $wort) !== false) {
            return true;
        }
    }

    return false;
}


/* ─────────────────────────────────────────────────────────────
   7. Skill-Level für die Anzeige ableiten
   -------------------------------------------------------------
   In eurer Tabelle gibt es kein skill_level und kein skill_pct.
   Damit die bestehenden Balken und Animationen trotzdem gleich
   funktionieren, leiten wir diese Werte aus Kategorie/Text ab.
   ─────────────────────────────────────────────────────────── */
function skill_daten_ableiten(string $name, string $kategorie, string $beschreibung): array
{
    $text = text_klein($name . ' ' . $kategorie . ' ' . $beschreibung);

    if (enthaelt_eines_von($text, ['profi', 'schusswaffe', 'schusswaffen', 'm4', 'gewehr', 'pistole'])) {
        return ['level' => 'Profi', 'pct' => 100];
    }

    if (enthaelt_eines_von($text, ['fortgeschritten', 'messer', 'armbrust'])) {
        return ['level' => 'Fortgeschritten', 'pct' => 65];
    }

    if (enthaelt_eines_von($text, ['bogen', 'bögen'])) {
        return ['level' => 'Fortgeschritten', 'pct' => 60];
    }

    return ['level' => 'Einsteiger', 'pct' => 35];
}


/* ─────────────────────────────────────────────────────────────
   8. Filter-Tags für JavaScript erzeugen
   -------------------------------------------------------------
   shop.js filtert Produkte mit filter_tags. Eure DB hat diese Spalte
   nicht. Darum erzeugen wir die Tags aus Name, Kategorie, Beschreibung
   und der Digital-Twin-Verknüpfung.
   ─────────────────────────────────────────────────────────── */
function filter_tags_bauen(string $name, string $kategorie, string $beschreibung, string $skillLevel, bool $digitalTwin): string
{
    $text = text_klein($name . ' ' . $kategorie . ' ' . $beschreibung);
    $tags = [];

    if (enthaelt_eines_von($text, ['schwert', 'schwerter', 'gladius'])) {
        $tags[] = 'schwerter';
    }

    if (enthaelt_eines_von($text, ['schusswaffe', 'schusswaffen', 'm4', 'gewehr', 'pistole'])) {
        $tags[] = 'schusswaffen';
    }

    if (enthaelt_eines_von($text, ['messer', 'dolch', 'klinge'])) {
        $tags[] = 'messer';
    }

    if (enthaelt_eines_von($text, ['bogen', 'bögen', 'langbogen', 'armbrust'])) {
        $tags[] = 'bogen';
    }

    if ($skillLevel === 'Fortgeschritten') {
        $tags[] = 'fortgeschritten';
    }

    if ($skillLevel === 'Profi') {
        $tags[] = 'profi';
    }

    if ($digitalTwin) {
        $tags[] = 'digital';
    }

    return implode(' ', array_values(array_unique($tags)));
}


try {
    /* ─────────────────────────────────────────────────────────
       9. Datenbankverbindung öffnen
       ---------------------------------------------------------
       db_verbinden() kommt aus Basisverzeichnis/private/db-config.php.
       ─────────────────────────────────────────────────────── */
    $pdo = db_verbinden();


    /* ─────────────────────────────────────────────────────────
       10. Basis-Query mit Digital-Twin-Daten
       ---------------------------------------------------------
       Produkte kommt aus eurer Tabelle Produkte.
       Digital-Twin-Infos kommen aus Digitales_Produkt und Partner_Games.

       Wichtig:
       Wir holen NICHT die Spalte Bild direkt in JSON. Bilder als BLOB
       wären für JSON zu gross und unübersichtlich. Stattdessen liefert
       produkt-bild.php das Bild separat aus.
       ─────────────────────────────────────────────────────── */
    $sql = '
        SELECT
            p.id,
            p.name,
            p.kategorie,
            p.preis,
            p.hersteller,
            p.lagerbestand,
            p.erstellungsdatum,
            p.Beschreibung,
            CASE
                WHEN p.Bild IS NOT NULL AND OCTET_LENGTH(p.Bild) > 0 THEN 1
                ELSE 0
            END AS hat_bild,
            COALESCE(dg.digital_anzahl, 0) AS digital_anzahl,
            COALESCE(dg.partner_games, "") AS partner_games
        FROM Produkte p
        LEFT JOIN (
            SELECT
                dp.produkt_id,
                COUNT(pg.id) AS digital_anzahl,
                GROUP_CONCAT(DISTINCT pg.name ORDER BY pg.name SEPARATOR ", ") AS partner_games
            FROM Digitales_Produkt dp
            INNER JOIN Partner_Games pg
                ON pg.id = dp.game_id
               AND pg.aktivstatus = 1
            GROUP BY dp.produkt_id
        ) dg ON dg.produkt_id = p.id
        WHERE 1 = 1
    ';

    $params = [];


    /* ─────────────────────────────────────────────────────────
       11. Filter aus der URL verarbeiten
       ---------------------------------------------------------
       Eure HTML-Chips nutzen Werte wie schwerter, schusswaffen,
       messer, bogen, einsteiger und digital.

       Da es keine filter_tags-Spalte gibt, übersetzen wir diese Filter
       auf die vorhandenen Spalten.
       ─────────────────────────────────────────────────────── */
    $filter = trim((string)($_GET['filter'] ?? $_GET['kat'] ?? ''));

    if ($filter !== '' && $filter !== 'alle') {
        switch ($filter) {
            case 'digital':
                $sql .= ' AND COALESCE(dg.digital_anzahl, 0) > 0';
                break;

            case 'schwerter':
                $sql .= ' AND (LOWER(p.kategorie) LIKE :filter_schwerter OR LOWER(p.name) LIKE :filter_gladius)';
                $params[':filter_schwerter'] = '%schwert%';
                $params[':filter_gladius'] = '%gladius%';
                break;

            case 'schusswaffen':
                $sql .= ' AND (
                    LOWER(p.kategorie) LIKE :filter_schusswaffen
                    OR LOWER(p.name)      LIKE :filter_schusswaffen
                    OR LOWER(p.Beschreibung) LIKE :filter_schusswaffen
                    OR LOWER(p.name)      LIKE :filter_m4
                    OR LOWER(p.name)      LIKE :filter_gewehr
                    OR LOWER(p.name)      LIKE :filter_pistole
                    OR LOWER(p.name)      LIKE :filter_karabiner
                    OR LOWER(p.name)      LIKE :filter_revolver
                    OR LOWER(p.Beschreibung) LIKE :filter_m4
                    OR LOWER(p.Beschreibung) LIKE :filter_gewehr
                    OR LOWER(p.Beschreibung) LIKE :filter_pistole
                    OR LOWER(p.Beschreibung) LIKE :filter_karabiner
                    OR LOWER(p.Beschreibung) LIKE :filter_revolver
                )';
                $params[':filter_schusswaffen'] = '%schusswaff%';
                $params[':filter_m4'] = '%m4%';
                $params[':filter_gewehr'] = '%gewehr%';
                $params[':filter_pistole'] = '%pistole%';
                $params[':filter_karabiner'] = '%karabiner%';
                $params[':filter_revolver'] = '%revolver%';
                break;

            case 'messer':
                $sql .= ' AND (LOWER(p.kategorie) LIKE :filter_messer OR LOWER(p.name) LIKE :filter_messer)';
                $params[':filter_messer'] = '%messer%';
                break;

            case 'bogen':
                $sql .= ' AND (
                    LOWER(p.kategorie) LIKE :filter_bogen
                    OR LOWER(p.kategorie) LIKE :filter_boegen
                    OR LOWER(p.name) LIKE :filter_bogen
                    OR LOWER(p.name) LIKE :filter_armbrust
                )';
                $params[':filter_bogen'] = '%bogen%';
                $params[':filter_boegen'] = '%bögen%';
                $params[':filter_armbrust'] = '%armbrust%';
                break;

        }
    }


    /* ─────────────────────────────────────────────────────────
       12. Suche verarbeiten
       ---------------------------------------------------------
       Gesucht wird in den echten DB-Feldern, die ihr habt:
       Name, Kategorie, Hersteller und Beschreibung.
       ─────────────────────────────────────────────────────── */
    $suche = trim((string)($_GET['suche'] ?? ''));

    if ($suche !== '') {
        $sql .= ' AND (
            LOWER(p.name) LIKE :suche
            OR LOWER(p.kategorie) LIKE :suche
            OR LOWER(p.hersteller) LIKE :suche
            OR LOWER(p.Beschreibung) LIKE :suche
        )';
        $params[':suche'] = '%' . text_klein($suche) . '%';
    }


    /* ─────────────────────────────────────────────────────────
       13. Sortierung festlegen
       ---------------------------------------------------------
       Nur erlaubte Werte werden verwendet. Dadurch kann niemand über
       die URL eigenen SQL-Code einschleusen.
       ─────────────────────────────────────────────────────── */
    $sort = trim((string)($_GET['sort'] ?? 'relevanz'));

    switch ($sort) {
        case 'preis-asc':
            $sql .= ' ORDER BY p.preis ASC';
            break;

        case 'preis-desc':
            $sql .= ' ORDER BY p.preis DESC';
            break;

        case 'neu':
            $sql .= ' ORDER BY p.erstellungsdatum DESC, p.id DESC';
            break;

        default:
            $sql .= ' ORDER BY p.id ASC';
            break;
    }


    /* ─────────────────────────────────────────────────────────
       14. Optionales Limit verarbeiten
       ---------------------------------------------------------
       index.js nutzt z.B. limit=3 für die Startseite.
       ─────────────────────────────────────────────────────── */
    $limit = filter_input(
        INPUT_GET,
        'limit',
        FILTER_VALIDATE_INT,
        [
            'options' => [
                'min_range' => 1,
                'max_range' => 100
            ]
        ]
    );

    if ($limit !== false && $limit !== null) {
        $sql .= ' LIMIT ' . (int)$limit;
    }


    /* ─────────────────────────────────────────────────────────
       15. Query ausführen
       ---------------------------------------------------------
       Prepared Statements schützen alle dynamischen Werte.
       ─────────────────────────────────────────────────────── */
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $dbProdukte = $stmt->fetchAll();


    /* ─────────────────────────────────────────────────────────
       16. Daten für JavaScript passend machen
       ---------------------------------------------------------
       JS und CSS bleiben unverändert. Diese API liefert genau die
       Felder, die eure bestehenden Produktkarten erwarten.
       ─────────────────────────────────────────────────────── */
    $produkte = [];

    foreach ($dbProdukte as $produkt) {
        $id = (int)$produkt['id'];
        $name = (string)($produkt['name'] ?? 'Unbekanntes Produkt');
        $kategorieRoh = (string)($produkt['kategorie'] ?? '');
        $beschreibung = (string)($produkt['Beschreibung'] ?? '');
        $digitalTwin = ((int)($produkt['digital_anzahl'] ?? 0)) > 0;
        $hatBild = ((int)($produkt['hat_bild'] ?? 0)) === 1;

        $skill = skill_daten_ableiten($name, $kategorieRoh, $beschreibung);
        $skillLevel = $skill['level'];
        $skillPct = $skill['pct'];

        $produkte[] = [
            'id' => $id,
            'nummer' => str_pad((string)$id, 3, '0', STR_PAD_LEFT),
            'name' => $name,
            'kategorie' => trim($kategorieRoh . ' · ' . $skillLevel, ' ·'),
            'kategorie_roh' => $kategorieRoh,
            'preis' => (float)($produkt['preis'] ?? 0),
            'hersteller' => (string)($produkt['hersteller'] ?? ''),
            'lagerbestand' => (int)($produkt['lagerbestand'] ?? 0),
            'erstellungsdatum' => (string)($produkt['erstellungsdatum'] ?? ''),
            'beschreibung' => $beschreibung,
            'skill_level' => $skillLevel,
            'skill_pct' => $skillPct,
            'digital_twin' => $digitalTwin,
            'bestseller' => false,
            'partner_games' => (string)($produkt['partner_games'] ?? ''),
            'filter_tags' => filter_tags_bauen($name, $kategorieRoh, $beschreibung, $skillLevel, $digitalTwin),
            'bild' => $hatBild
                ? 'php/produkt-bild.php?id=' . $id
                : 'img/prod' . (($id - 1) % 6 + 1) . '-placeholder.svg'
        ];
    }


    /* ─────────────────────────────────────────────────────────
       17. Erfolgreiche Antwort zurückgeben
       ─────────────────────────────────────────────────────── */
    json_antwort([
        'status'   => 'ok',
        'produkte' => $produkte
    ]);

} catch (PDOException $e) {
    /* Der echte Fehler steht nur im Server-Log, nicht öffentlich im Browser. */
    error_log($e->getMessage());

    json_antwort([
        'status'  => 'fehler',
        'meldung' => 'Datenbankfehler.'
    ], 500);
}
