<?php
declare(strict_types=1);

/* ============================================================
   db-config.example.php — IRONBOUND

   Diese Datei ist nur eine Vorlage für GitHub.
   Die echte Datei heisst db-config.php und liegt nur auf Plesk hier:

   Basisverzeichnis/private/db-config.php

   Die echte Datei darf NICHT in GitHub committed werden.
   ============================================================ */


/* ─────────────────────────────────────────────────────────────
   Zentrale Datenbankverbindung
   -------------------------------------------------------------
   Diese Funktion wird von shop-produkte.php und kunden-login.php
   mit require_once geladen.
   ─────────────────────────────────────────────────────────── */
function db_verbinden(): PDO
{
    $dbHost = 'localhost';
    $dbName = 'Ironbound';
    $dbBenutzer = 'BENUTZER_HIER';
    $dbPasswort = 'PASSWORT_HIER';

    return new PDO(
        "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4",
        $dbBenutzer,
        $dbPasswort,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
}
