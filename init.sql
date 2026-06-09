-- init.sql
CREATE DATABASE IF NOT EXISTS bankappli;
USE bankappli;

-- Tables
CREATE TABLE IF NOT EXISTS persons (
    id VARCHAR(255) PRIMARY KEY,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    mot_de_passe VARCHAR(255),
    statut VARCHAR(20),
    date_creation DATE
);

CREATE TABLE IF NOT EXISTS employes (
    id VARCHAR(255) PRIMARY KEY,
    matricule VARCHAR(50),
    poste VARCHAR(100),
    role VARCHAR(20),
    FOREIGN KEY (id) REFERENCES persons(id)
);

CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(255) PRIMARY KEY,
    numero_client VARCHAR(50),
    est_bloque BOOLEAN,
    FOREIGN KEY (id) REFERENCES persons(id)
);

-- =====================================================
-- Admin (mot de passe: admin123)
-- Hash BCrypt valide généré pour "admin123"
-- =====================================================
INSERT INTO persons (id, nom, prenom, email, mot_de_passe, statut, date_creation)
VALUES (
    UUID(),
    'Admin', 'System',
    'admin@bankappli.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWC',
    'ACTIF',
    CURDATE()
);

INSERT INTO employes (id, matricule, poste, role)
VALUES (
    (SELECT id FROM persons WHERE email = 'admin@bankappli.com'),
    'ADMIN001',
    'Administrateur',
    'ADMIN'
);

-- =====================================================
-- Client test (mot de passe: client123)
-- Hash BCrypt valide généré pour "client123"
-- =====================================================
INSERT INTO persons (id, nom, prenom, email, mot_de_passe, statut, date_creation)
VALUES (
    UUID(),
    'Client', 'Test',
    'client@test.com',
    '$2a$10$8K1p/a0dR8ld7mHMmPHvMeicqMz5zKH2RQX/EJgCUGFKF1Yv5TfqG',
    'ACTIF',
    CURDATE()
);

INSERT INTO clients (id, numero_client, est_bloque)
VALUES (
    (SELECT id FROM persons WHERE email = 'client@test.com'),
    'CLI001',
    false
);