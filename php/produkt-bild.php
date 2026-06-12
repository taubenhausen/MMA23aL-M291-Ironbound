<?php
declare(strict_types=1);

/* ============================================================
   produkt-bild.php — IRONBOUND

   Aufgabe dieser Datei:
   - Bilddaten aus der Spalte Produkte.Bild lesen
   - Das Bild direkt an den Browser ausliefern

   Warum separat?
   Die Spalte Bild ist ein longblob. Solche Binärdaten gehören nicht
   in JSON. Darum gibt shop-produkte.php nur eine Bild-URL zurück,
   und diese Datei liefert das eigentliche Bild.
   ============================================================ */

require_once __DIR__ . '/../../private/db-config.php';


/* ─────────────────────────────────────────────────────────────
   1. Produkt-ID sicher aus der URL lesen
   -------------------------------------------------------------
   Nur echte Zahlen zwischen 1 und sehr grossen IDs sind erlaubt.
   ─────────────────────────────────────────────────────────── */
$id = filter_input(
    INPUT_GET,
    'id',
    FILTER_VALIDATE_INT,
    [
        'options' => [
            'min_range' => 1
        ]
    ]
);

if ($id === false || $id === null) {
    http_response_code(400);
    exit('Ungültige Produkt-ID.');
}

try {
    /* ─────────────────────────────────────────────────────────
       2. Bild aus der Datenbank holen
       ---------------------------------------------------------
       Es wird nur die Bild-Spalte geladen, nicht das ganze Produkt.
       ─────────────────────────────────────────────────────── */
    $pdo = db_verbinden();

    $stmt = $pdo->prepare('SELECT Bild FROM Produkte WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $bild = $stmt->fetchColumn();

    if ($bild === false || $bild === null || $bild === '') {
        http_response_code(404);
        exit('Bild nicht gefunden.');
    }


    /* ─────────────────────────────────────────────────────────
       3. Bildtyp erkennen
       ---------------------------------------------------------
       finfo erkennt z.B. image/jpeg, image/png oder image/webp.
       Falls der Typ nicht erkannt wird, nutzen wir JPEG als Fallback.
       ─────────────────────────────────────────────────────── */
    $mime = 'image/jpeg';

    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo !== false) {
            $erkannterMime = finfo_buffer($finfo, $bild);
            finfo_close($finfo);

            if (is_string($erkannterMime) && strpos($erkannterMime, 'image/') === 0) {
                $mime = $erkannterMime;
            }
        }
    }


    /* ─────────────────────────────────────────────────────────
       4. Bild an den Browser senden
       ---------------------------------------------------------
       Cache-Header sorgen dafür, dass Bilder nicht bei jedem Laden
       neu aus der Datenbank geholt werden müssen.
       ─────────────────────────────────────────────────────── */
    header('Content-Type: ' . $mime);
    header('Cache-Control: public, max-age=86400');
    echo $bild;
    exit;

} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    exit('Bild konnte nicht geladen werden.');
}
