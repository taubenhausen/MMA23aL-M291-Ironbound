<?php
/* ============================================================
   shop-produkte.php — IRONBOUND
   API-Endpoint für die Arsenal-Seite (shop.html)

   Gibt alle aktiven Produkte aus der Tabelle "Produkte" als
   JSON zurück. JS in shop.js holt diese Daten via fetch()
   und rendert die Produktkarten dynamisch ins HTML.

   URL-Parameter (optional):
   ?filter=schwerter   → nur Produkte mit passendem filter_tags
   ?sort=preis-asc     → Sortierung: preis-asc, preis-desc, neu
   ?suche=gladius      → Textsuche in Name und Kategorie

   Gibt JSON zurück:
   {"status":"ok","produkte":[...]}   = Erfolg
   {"status":"fehler","meldung":"..."} = Fehler
   ============================================================ */

require_once 'db-config.php';

header('Content-Type: application/json');
/* CORS-Header damit JS auf gleicher Domain zugreifen kann. */
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['status' => 'fehler', 'meldung' => 'Nur GET erlaubt.']);
    exit;
}

$pdo = db_verbinden();

/* ── Basis-Query ─────────────────────────────────────────────── */
$sql    = 'SELECT * FROM Produkte WHERE aktiv = 1';
$params = [];

/* ── Optional: Filter nach Kategorie-Tag ─────────────────────── */
$filter = trim($_GET['filter'] ?? '');
if ($filter !== '' && $filter !== 'alle') {
    $sql .= ' AND filter_tags LIKE :filter';
    $params[':filter'] = '%' . $filter . '%';
}

/* ── Optional: Textsuche ─────────────────────────────────────── */
$suche = trim($_GET['suche'] ?? '');
if ($suche !== '') {
    $sql .= ' AND (name LIKE :suche OR kategorie LIKE :suche2)';
    $params[':suche']  = '%' . $suche . '%';
    $params[':suche2'] = '%' . $suche . '%';
}

/* ── Sortierung ──────────────────────────────────────────────── */
$sort = trim($_GET['sort'] ?? 'relevanz');
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
}

/* ── Query ausführen ─────────────────────────────────────────── */
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$produkte = $stmt->fetchAll();
/* fetchAll() mit PDO::FETCH_ASSOC (gesetzt in db-config.php): */
/* gibt Array von assoziativen Arrays zurück. */

/* ── Typen konvertieren für JS ───────────────────────────────── */
foreach ($produkte as &$p) {
    $p['id']           = (int)   $p['id'];
    $p['preis']        = (float) $p['preis'];
    $p['skill_pct']    = (int)   $p['skill_pct'];
    $p['digital_twin'] = (bool)  $p['digital_twin'];
    $p['bestseller']   = (bool)  $p['bestseller'];
    $p['aktiv']        = (bool)  $p['aktiv'];
}
unset($p);
/* unset($p): Referenz aufheben — gute Praxis nach foreach mit &. */

echo json_encode(['status' => 'ok', 'produkte' => $produkte]);
exit;
?>
