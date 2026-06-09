-- ============================================================
-- MIGRATION BankAppli v2 — À exécuter sur la base existante
-- ============================================================
USE bankappli;

-- 1. Colonnes solde_avant / solde_apres dans operations_bancaires
ALTER TABLE operations_bancaires
    ADD COLUMN IF NOT EXISTS solde_avant DOUBLE NULL,
    ADD COLUMN IF NOT EXISTS solde_apres DOUBLE NULL;

-- 2. Table OTP tokens
CREATE TABLE IF NOT EXISTS otp_tokens (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    type VARCHAR(30) NOT NULL,
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) NOT NULL DEFAULT 0,
    INDEX idx_otp_email_type (email, type)
);

-- 3. Table codes de transaction client
CREATE TABLE IF NOT EXISTS codes_transaction (
    client_id VARCHAR(255) PRIMARY KEY,
    code_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    actif TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (client_id) REFERENCES persons(id)
);

-- 4. Colonne RIB 24 chiffres dans comptes_bancaires (si pas déjà présente)
ALTER TABLE comptes_bancaires
    MODIFY COLUMN IF EXISTS rib VARCHAR(24) NULL;

-- 5. Colonne employe_valideur dans operations_bancaires (traçabilité)
ALTER TABLE operations_bancaires
    ADD COLUMN IF NOT EXISTS employe_valideur_id VARCHAR(255) NULL,
    ADD CONSTRAINT IF NOT EXISTS fk_op_employe
        FOREIGN KEY (employe_valideur_id) REFERENCES persons(id);

-- 6. Index performance pour findByClientId sur operations
-- (déjà couverts par les FKs mais on s'assure)
CREATE INDEX IF NOT EXISTS idx_cb_client ON comptes_bancaires(client_id);
CREATE INDEX IF NOT EXISTS idx_vir_dest ON virements(compte_destination_id);
CREATE INDEX IF NOT EXISTS idx_vs_dest ON versements(compte_destination_id);
CREATE INDEX IF NOT EXISTS idx_op_date ON operations_bancaires(date_operation DESC);

SELECT 'Migration v2 appliquée avec succès.' AS statut;

-- ── Migration v2.1 — Champs dénormalisés pour performance et fiabilité ──
ALTER TABLE operations_bancaires
    ADD COLUMN IF NOT EXISTS initiateur VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS compte_source_numero VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS compte_dest_numero VARCHAR(50) NULL;
