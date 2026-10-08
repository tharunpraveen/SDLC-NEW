/**
 * backend/db/schema.js
 * Production-grade PostgreSQL schema bootstrap, migrations, triggers, and default seeds.
 */

import { pool } from './pool.js';

export async function initSchema() {
  const client = await pool.connect();
  try {
    // Extensions
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`).catch(() => {});

    // ── users ──────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id             VARCHAR(50)  PRIMARY KEY,
        email          VARCHAR(255) UNIQUE NOT NULL,
        password_hash  VARCHAR(255),
        password       VARCHAR(255),
        role           VARCHAR(20)  NOT NULL DEFAULT 'user'
                                   CHECK (role IN ('user','admin','viewer')),
        full_name      VARCHAR(255),
        name           VARCHAR(255),
        gender         VARCHAR(30),
        employee_id    VARCHAR(50),
        business_group VARCHAR(255),
        account        VARCHAR(255),
        is_active      BOOLEAN      NOT NULL DEFAULT true,
        last_login_at  TIMESTAMP,
        created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
      )
    `);

    // Safe column additions for existing tables
    const userCols = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name      VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id    VARCHAR(50)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS business_group VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS account        VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active      BOOLEAN NOT NULL DEFAULT true`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at  TIMESTAMP`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMP NOT NULL DEFAULT NOW()`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash  VARCHAR(255)`,
    ];
    for (const sql of userCols) await client.query(sql).catch(() => {});

    // Sync password → password_hash for existing rows
    await client.query(`UPDATE users SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL`).catch(() => {});
    await client.query(`UPDATE users SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL`).catch(() => {});

    // Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email       ON users (LOWER(email))`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role        ON users (role)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_is_active   ON users (is_active)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users (employee_id)`).catch(() => {});

    // ── questions ─────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id            SERIAL       PRIMARY KEY,
        framework     VARCHAR(10)  NOT NULL DEFAULT 'SDLC'
                                   CHECK (framework IN ('SDLC','AMS')),
        area          VARCHAR(100) NOT NULL,
        sub_area      VARCHAR(300) NOT NULL,
        practice      VARCHAR(400) NOT NULL,
        question_type VARCHAR(50)  NOT NULL DEFAULT 'extent',
        type          VARCHAR(50)  NOT NULL DEFAULT 'extent',
        question_text TEXT         NOT NULL,
        weightage     NUMERIC(4,2) NOT NULL DEFAULT 1.00,
        is_active     BOOLEAN      NOT NULL DEFAULT true,
        sort_order    INT          NOT NULL DEFAULT 0,
        created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
      )
    `);

    const qCols = [
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type VARCHAR(50) NOT NULL DEFAULT 'extent'`,
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS weightage     NUMERIC(4,2) NOT NULL DEFAULT 1.00`,
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_active     BOOLEAN NOT NULL DEFAULT true`,
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS sort_order    INT NOT NULL DEFAULT 0`,
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMP NOT NULL DEFAULT NOW()`,
    ];
    for (const sql of qCols) await client.query(sql).catch(() => {});

    // DB-level unique constraint on questions
    await client.query(`
      ALTER TABLE questions
      ADD CONSTRAINT uq_questions_practice UNIQUE (framework, area, sub_area, practice)
    `).catch(() => {});

    await client.query(`CREATE INDEX IF NOT EXISTS idx_questions_framework ON questions (framework)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_questions_area      ON questions (framework, area)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_questions_active    ON questions (is_active)`);

    // ── assessments ───────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id               VARCHAR(50)   PRIMARY KEY,
        user_id          VARCHAR(50)   NOT NULL,
        user_email       VARCHAR(255),
        project_name     VARCHAR(255)  NOT NULL,
        framework        VARCHAR(10)   NOT NULL DEFAULT 'SDLC'
                                       CHECK (framework IN ('SDLC','AMS')),
        status           VARCHAR(20)   NOT NULL DEFAULT 'completed'
                                       CHECK (status IN ('draft','in_progress','completed','archived')),
        answers          JSONB         NOT NULL DEFAULT '{}',
        scores           JSONB         NOT NULL DEFAULT '{}',
        overall_score    NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
        answer_count     INT           NOT NULL DEFAULT 0,
        remarks          TEXT,
        remarks_provider VARCHAR(50),
        feedback         JSONB,
        created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
      )
    `);

    const aCols = [
      `ALTER TABLE assessments ADD COLUMN IF NOT EXISTS status       VARCHAR(20) NOT NULL DEFAULT 'completed'`,
      `ALTER TABLE assessments ADD COLUMN IF NOT EXISTS answer_count INT NOT NULL DEFAULT 0`,
      `ALTER TABLE assessments ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP NOT NULL DEFAULT NOW()`,
    ];
    for (const sql of aCols) await client.query(sql).catch(() => {});

    // Add FK from assessments.user_id → users.id
    await client.query(`
      ALTER TABLE assessments ADD CONSTRAINT fk_assessments_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `).catch(() => {});

    await client.query(`CREATE INDEX IF NOT EXISTS idx_assessments_user_id    ON assessments (user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_assessments_framework  ON assessments (framework)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_assessments_status     ON assessments (status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments (created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_assessments_user_fw    ON assessments (user_id, framework)`);

    // ── assessment_reports ────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS assessment_reports (
        id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        assessment_id       VARCHAR(50)  NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
        provider            VARCHAR(50),
        model               VARCHAR(100),
        prompt_version      VARCHAR(20)  NOT NULL DEFAULT 'v1.0',
        report_json         JSONB,
        generation_status   VARCHAR(20)  NOT NULL DEFAULT 'pending'
                                         CHECK (generation_status IN ('pending','generating','completed','failed','fallback')),
        error_message       TEXT,
        generation_time_ms  INT,
        retry_count         SMALLINT     NOT NULL DEFAULT 0,
        created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
      )
    `);

    const rCols = [
      `ALTER TABLE assessment_reports ADD COLUMN IF NOT EXISTS error_message      TEXT`,
      `ALTER TABLE assessment_reports ADD COLUMN IF NOT EXISTS generation_time_ms INT`,
      `ALTER TABLE assessment_reports ADD COLUMN IF NOT EXISTS retry_count        SMALLINT NOT NULL DEFAULT 0`,
    ];
    for (const sql of rCols) await client.query(sql).catch(() => {});

    await client.query(`CREATE INDEX IF NOT EXISTS idx_reports_assessment_id ON assessment_reports (assessment_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reports_status        ON assessment_reports (generation_status)`);

    // ── feedback ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id             VARCHAR(50)  PRIMARY KEY,
        assessment_id  VARCHAR(50)  NOT NULL,
        user_id        VARCHAR(50)  NOT NULL,
        user_email     VARCHAR(255),
        rating         SMALLINT     NOT NULL DEFAULT 3,
        comments       TEXT,
        created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()`).catch(() => {});
    await client.query(`ALTER TABLE feedback ADD CONSTRAINT fk_feedback_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE`).catch(() => {});
    await client.query(`ALTER TABLE feedback ADD CONSTRAINT fk_feedback_user       FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`).catch(() => {});
    await client.query(`ALTER TABLE feedback ADD CONSTRAINT chk_feedback_rating CHECK (rating >= 1 AND rating <= 5)`).catch(() => {});
    await client.query(`ALTER TABLE feedback ADD CONSTRAINT uq_feedback_user_assessment UNIQUE (assessment_id, user_id)`).catch(() => {});

    await client.query(`CREATE INDEX IF NOT EXISTS idx_feedback_assessment_id ON feedback (assessment_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_feedback_user_id       ON feedback (user_id)`);

    // ── settings ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id                  INT          PRIMARY KEY DEFAULT 1,
        active_ai_provider  VARCHAR(50)  NOT NULL DEFAULT 'expert'
                                         CHECK (active_ai_provider IN ('openai','gemini','claude','ollama','expert')),
        api_keys            JSONB        NOT NULL DEFAULT '{"openai":"","gemini":"","claude":""}',
        api_endpoints       JSONB        NOT NULL DEFAULT '{"openai":"","gemini":"","claude":"","ollama":""}',
        ollama_url          VARCHAR(255) NOT NULL DEFAULT 'http://localhost:11434',
        ollama_model        VARCHAR(100) NOT NULL DEFAULT 'llama3',
        updated_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
        CONSTRAINT settings_single_row CHECK (id = 1)
      )
    `);

    await client.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()`).catch(() => {});
    await client.query(`ALTER TABLE settings ADD CONSTRAINT settings_single_row CHECK (id = 1)`).catch(() => {});

    // ── audit_log ─────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       VARCHAR(50),
        action        VARCHAR(100) NOT NULL,
        entity_type   VARCHAR(50),
        entity_id     VARCHAR(100),
        old_values    JSONB,
        new_values    JSONB,
        ip_address    TEXT,
        user_agent    TEXT,
        created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_user_id    ON audit_log (user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_action     ON audit_log (action)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log (created_at DESC)`);

    // ── auto-update triggers ───────────────────────────────────
    await client.query(`
      CREATE OR REPLACE FUNCTION trigger_set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    const triggerTargets = [
      ['users',              'trg_users_updated_at'],
      ['assessments',       'trg_assessments_updated_at'],
      ['assessment_reports','trg_reports_updated_at'],
      ['questions',         'trg_questions_updated_at'],
      ['feedback',          'trg_feedback_updated_at'],
      ['settings',          'trg_settings_updated_at'],
    ];
    for (const [tbl, trgName] of triggerTargets) {
      await client.query(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = '${trgName}') THEN
            CREATE TRIGGER ${trgName}
              BEFORE UPDATE ON ${tbl}
              FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
          END IF;
        END $$
      `).catch(() => {});
    }

    // ── Seeds ─────────────────────────────────────────────────
    await client.query(`
      INSERT INTO users (id, email, password_hash, password, role, full_name, name)
      VALUES ('admin_user','admin@sdlc.com',
        '$2a$10$e3lC5nLrQEWCmu15W69ux./xMB45aDURPA3skiFXmcmmySIWCAD.G',
        '$2a$10$e3lC5nLrQEWCmu15W69ux./xMB45aDURPA3skiFXmcmmySIWCAD.G',
        'admin','System Administrator','System Administrator')
      ON CONFLICT (id) DO NOTHING
    `);

    await client.query(`
      INSERT INTO settings (id, active_ai_provider, api_keys, api_endpoints, ollama_url, ollama_model)
      VALUES (1,'gemini',
        '{"openai":"","gemini":"","claude":""}',
        '{"openai":"","gemini":"","claude":"","ollama":""}',
        'http://localhost:11434','llama3')
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('✅ PostgreSQL production schema initialised (v2.0)');
  } catch (err) {
    console.error('❌ Schema init error:', err.message);
  } finally {
    client.release();
  }
}

// Automatically bootstrap on initial module load
initSchema().catch((err) => {
  console.error('Failed to initialise schema:', err.message);
});
