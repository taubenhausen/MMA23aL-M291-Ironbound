-- ============================================================
-- datenbank-setup.sql — IRONBOUND
-- Dieses File in Plesk unter Datenbanken > phpMyAdmin ausführen
-- ============================================================


-- Tabelle für Newsletter-Anmeldungen
CREATE TABLE IF NOT EXISTS newsletter (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  vorname      VARCHAR(100)  NOT NULL,
  nachname     VARCHAR(100)  NOT NULL,
  email        VARCHAR(255)  NOT NULL UNIQUE,
  plz          VARCHAR(10)   DEFAULT NULL,
  interesse    VARCHAR(100)  DEFAULT NULL,
  erstellt_am  DATETIME      DEFAULT CURRENT_TIMESTAMP
);


-- Tabelle für Promotion-Anmeldungen
CREATE TABLE IF NOT EXISTS promotion_anmeldungen (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  vorname      VARCHAR(100)  NOT NULL,
  nachname     VARCHAR(100)  NOT NULL,
  email        VARCHAR(255)  NOT NULL UNIQUE,
  plz          VARCHAR(10)   NOT NULL,
  interesse    VARCHAR(100)  NOT NULL,
  erstellt_am  DATETIME      DEFAULT CURRENT_TIMESTAMP
);
