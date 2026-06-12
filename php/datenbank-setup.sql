-- ============================================================
-- datenbank-setup.sql — IRONBOUND
-- Dieses File in Plesk unter Datenbanken > phpMyAdmin ausführen.
-- Reihenfolge beachten: Tabellen erst erstellen, dann befüllen.
-- ============================================================


-- ── Tabelle: Promotion-Anmeldungen ────────────────────────────
-- Speichert alle Einträge vom Formular auf promotion.html
CREATE TABLE IF NOT EXISTS promotion_anmeldungen (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  vorname      VARCHAR(100)  NOT NULL,
  nachname     VARCHAR(100)  NOT NULL,
  email        VARCHAR(255)  NOT NULL UNIQUE,
  plz          SMALLINT      NOT NULL,
  interesse    VARCHAR(50)   NOT NULL,
  erstellt_am  DATETIME      DEFAULT CURRENT_TIMESTAMP
);


-- ── Tabelle: Produkte (Shop) ──────────────────────────────────
-- Speichert alle Artikel die im Arsenal (shop.html) angezeigt werden.
-- JS lädt diese per fetch() aus shop-produkte.php
CREATE TABLE IF NOT EXISTS Produkte (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nummer       CHAR(3)       NOT NULL,           -- z.B. "001"
  name         VARCHAR(200)  NOT NULL,
  kategorie    VARCHAR(100)  NOT NULL,            -- z.B. "Schwerter · Einsteiger"
  filter_tags  VARCHAR(200)  NOT NULL,            -- Leerzeichen-getrennt: "schwerter einsteiger digital"
  preis        DECIMAL(10,2) NOT NULL,
  skill_level  VARCHAR(50)   NOT NULL,            -- "Einsteiger" / "Fortgeschritten" / "Profi"
  skill_pct    TINYINT       NOT NULL DEFAULT 30, -- Balken-Füllstand in %
  digital_twin TINYINT(1)    NOT NULL DEFAULT 0,  -- 1 = hat Digital-Twin-Badge
  bestseller   TINYINT(1)    NOT NULL DEFAULT 0,  -- 1 = Bestseller-Badge
  bild         VARCHAR(255)  NOT NULL DEFAULT 'img/prod1-placeholder.svg',
  aktiv        TINYINT(1)    NOT NULL DEFAULT 1   -- 0 = nicht anzeigen
);


-- ── Beispiel-Produkte (gleiche 6 wie vorher hard-coded) ───────
INSERT INTO Produkte
  (nummer, name, kategorie, filter_tags, preis, skill_level, skill_pct, digital_twin, bestseller, bild)
VALUES
  ('001', 'Gladius Romanus',  'Schwerter · Einsteiger',     'schwerter einsteiger digital',      249.00, 'Einsteiger',    35, 1, 0, 'img/prod1-placeholder.svg'),
  ('002', 'M4 Replika',       'Schusswaffen · Profi',        'schusswaffen profi',                599.00, 'Profi',        100, 0, 1, 'img/prod2-placeholder.svg'),
  ('003', 'Langbogen 60"',    'Bögen · Einsteiger',          'bogen einsteiger digital',          189.00, 'Einsteiger',    30, 1, 0, 'img/prod3-placeholder.svg'),
  ('004', 'Kampfmesser',      'Messer · Fortgeschritten',    'messer fortgeschritten',            149.00, 'Fortgeschritten',65, 0, 0, 'img/prod4-placeholder.svg'),
  ('005', 'Armbrust Pro',     'Bögen · Fortgeschritten',     'bogen fortgeschritten digital',     399.00, 'Fortgeschritten',70, 1, 0, 'img/prod5-placeholder.svg'),
  ('006', 'Speer Replika',    'Stangenwaffen · Einsteiger',  'stangenwaffen einsteiger',           99.00, 'Einsteiger',    20, 0, 0, 'img/prod6-placeholder.svg');
