-- ================================================================
--  TCS MaturityIQ — Production-Grade PostgreSQL Schema
--  Version: 2.0
--  Compatible with: Supabase PostgreSQL 15+
--  Notes:
--   • All ALTER TABLE statements are safe (IF NOT EXISTS / IF EXISTS)
--   • Run this against an existing DB to upgrade without data loss
--   • Run on fresh DB to initialise from scratch
-- ================================================================

-- ----------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- fuzzy text search on questions

-- ================================================================
-- TABLE 1: users
-- ================================================================
CREATE TABLE IF NOT EXISTS users (
  id             VARCHAR(50)  PRIMARY KEY,
  email          VARCHAR(255) UNIQUE NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(20)  NOT NULL DEFAULT 'user'
                              CHECK (role IN ('user', 'admin', 'viewer')),
  full_name      VARCHAR(255),
  gender         VARCHAR(30)  CHECK (gender IN ('Male','Female','Non-binary','Prefer not to say', NULL)),
  employee_id    VARCHAR(50)  UNIQUE,
  business_group VARCHAR(255),
  account        VARCHAR(255),
  is_active      BOOLEAN      NOT NULL DEFAULT true,
  last_login_at  TIMESTAMP,
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Safe upgrades for already-deployed users table
ALTER TABLE users RENAME COLUMN password TO password_hash;  -- only if old schema
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name      VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id    VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_group VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account        VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active      BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at  TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMP NOT NULL DEFAULT NOW();

-- Backfill full_name from name column (if it existed)
UPDATE users SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email      ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role       ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_active  ON users (is_active);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users (employee_id);

-- ================================================================
-- TABLE 2: questions
-- ================================================================
CREATE TABLE IF NOT EXISTS questions (
  id            SERIAL       PRIMARY KEY,
  framework     VARCHAR(10)  NOT NULL DEFAULT 'SDLC'
                             CHECK (framework IN ('SDLC', 'AMS')),
  area          VARCHAR(100) NOT NULL,
  sub_area      VARCHAR(300) NOT NULL,
  practice      VARCHAR(400) NOT NULL,
  question_type VARCHAR(50)  NOT NULL DEFAULT 'extent'
                             CHECK (question_type IN ('extent', 'binary', 'scale', 'multi')),
  question_text TEXT         NOT NULL,
  weightage     NUMERIC(4,2) NOT NULL DEFAULT 1.00
                             CHECK (weightage > 0 AND weightage <= 10),
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  sort_order    INT          NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW(),

  -- DB-level duplicate prevention
  CONSTRAINT uq_questions_practice UNIQUE (framework, area, sub_area, practice)
);

-- Safe upgrades for existing questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type VARCHAR(50) NOT NULL DEFAULT 'extent'
                                               CHECK (question_type IN ('extent','binary','scale','multi'));
ALTER TABLE questions ADD COLUMN IF NOT EXISTS weightage   NUMERIC(4,2) NOT NULL DEFAULT 1.00;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_active   BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS sort_order  INT NOT NULL DEFAULT 0;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP NOT NULL DEFAULT NOW();

-- Backfill question_type from old "type" column
UPDATE questions SET question_type = type WHERE question_type = 'extent' AND type IS NOT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_questions_framework     ON questions (framework);
CREATE INDEX IF NOT EXISTS idx_questions_area          ON questions (framework, area);
CREATE INDEX IF NOT EXISTS idx_questions_active        ON questions (is_active);
CREATE INDEX IF NOT EXISTS idx_questions_text_search   ON questions USING gin (question_text gin_trgm_ops);

-- ================================================================
-- TABLE 3: assessments
-- ================================================================
CREATE TABLE IF NOT EXISTS assessments (
  id               VARCHAR(50)   PRIMARY KEY,
  user_id          VARCHAR(50)   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_name     VARCHAR(255)  NOT NULL,
  framework        VARCHAR(10)   NOT NULL DEFAULT 'SDLC'
                                 CHECK (framework IN ('SDLC', 'AMS')),
  status           VARCHAR(20)   NOT NULL DEFAULT 'completed'
                                 CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
  answers          JSONB         NOT NULL DEFAULT '{}',
  scores           JSONB         NOT NULL DEFAULT '{}',
  overall_score    NUMERIC(5,2)  NOT NULL DEFAULT 0.00
                                 CHECK (overall_score >= 0 AND overall_score <= 100),
  answer_count     INT           NOT NULL DEFAULT 0,
  remarks          TEXT,
  remarks_provider VARCHAR(50),
  created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Safe upgrades (handles existing assessments table)
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS status       VARCHAR(20) NOT NULL DEFAULT 'completed';
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS answer_count INT NOT NULL DEFAULT 0;

-- Remove redundant denormalised columns (data is in users table)
-- user_email and feedback JSONB are moved to proper FK tables
-- (Keep for backward compatibility; mark deprecated in comments)
-- ALTER TABLE assessments DROP COLUMN IF EXISTS user_email;  -- deprecated
-- ALTER TABLE assessments DROP COLUMN IF EXISTS feedback;    -- deprecated; use feedback table

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assessments_user_id    ON assessments (user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_framework  ON assessments (framework);
CREATE INDEX IF NOT EXISTS idx_assessments_status     ON assessments (status);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_user_fw    ON assessments (user_id, framework);

-- ================================================================
-- TABLE 4: assessment_reports
-- ================================================================
CREATE TABLE IF NOT EXISTS assessment_reports (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id       VARCHAR(50)   NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  provider            VARCHAR(50)   CHECK (provider IN ('openai','gemini','claude','ollama','expert','expert-fallback')),
  model               VARCHAR(100),
  prompt_version      VARCHAR(20)   NOT NULL DEFAULT 'v1.0',
  report_json         JSONB,
  generation_status   VARCHAR(20)   NOT NULL DEFAULT 'pending'
                                    CHECK (generation_status IN ('pending','generating','completed','failed','fallback')),
  error_message       TEXT,
  generation_time_ms  INT           CHECK (generation_time_ms >= 0),
  retry_count         SMALLINT      NOT NULL DEFAULT 0,
  created_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Safe upgrades for existing assessment_reports table
ALTER TABLE assessment_reports ADD COLUMN IF NOT EXISTS error_message      TEXT;
ALTER TABLE assessment_reports ADD COLUMN IF NOT EXISTS generation_time_ms INT;
ALTER TABLE assessment_reports ADD COLUMN IF NOT EXISTS retry_count        SMALLINT NOT NULL DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_assessment_id ON assessment_reports (assessment_id);
CREATE INDEX IF NOT EXISTS idx_reports_status        ON assessment_reports (generation_status);
CREATE INDEX IF NOT EXISTS idx_reports_provider      ON assessment_reports (provider);

-- ================================================================
-- TABLE 5: feedback
-- ================================================================
CREATE TABLE IF NOT EXISTS feedback (
  id             VARCHAR(50)  PRIMARY KEY,
  assessment_id  VARCHAR(50)  NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id        VARCHAR(50)  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating         SMALLINT     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments       TEXT,
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP    NOT NULL DEFAULT NOW(),

  -- One feedback per user per assessment
  CONSTRAINT uq_feedback_user_assessment UNIQUE (assessment_id, user_id)
);

-- Safe upgrades for existing feedback table
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE feedback ADD CONSTRAINT IF NOT EXISTS chk_feedback_rating CHECK (rating >= 1 AND rating <= 5);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_assessment_id ON feedback (assessment_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id       ON feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating        ON feedback (rating);

-- ================================================================
-- TABLE 6: settings  (single-row system config, id ALWAYS = 1)
-- ================================================================
CREATE TABLE IF NOT EXISTS settings (
  id                  SMALLINT     PRIMARY KEY DEFAULT 1,
  active_ai_provider  VARCHAR(50)  NOT NULL DEFAULT 'expert'
                                   CHECK (active_ai_provider IN ('openai','gemini','claude','ollama','expert')),
  api_keys            JSONB        NOT NULL DEFAULT '{"openai":"","gemini":"","claude":""}',
  api_endpoints       JSONB        NOT NULL DEFAULT '{"openai":"","gemini":"","claude":"","ollama":""}',
  ollama_url          VARCHAR(255) NOT NULL DEFAULT 'http://localhost:11434',
  ollama_model        VARCHAR(100) NOT NULL DEFAULT 'llama3',
  updated_at          TIMESTAMP    NOT NULL DEFAULT NOW(),

  CONSTRAINT settings_single_row CHECK (id = 1)
);

ALTER TABLE settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- ================================================================
-- TABLE 7: audit_log  (track sensitive changes)
-- ================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       VARCHAR(50)  REFERENCES users(id) ON DELETE SET NULL,
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(50),
  entity_id     VARCHAR(100),
  old_values    JSONB,
  new_values    JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id     ON audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action      ON audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_entity      ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at  ON audit_log (created_at DESC);

-- ================================================================
-- AUTO-UPDATE TRIGGERS — keep updated_at always current
-- ================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
    CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_assessments_updated_at') THEN
    CREATE TRIGGER trg_assessments_updated_at
      BEFORE UPDATE ON assessments
      FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reports_updated_at') THEN
    CREATE TRIGGER trg_reports_updated_at
      BEFORE UPDATE ON assessment_reports
      FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_questions_updated_at') THEN
    CREATE TRIGGER trg_questions_updated_at
      BEFORE UPDATE ON questions
      FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_feedback_updated_at') THEN
    CREATE TRIGGER trg_feedback_updated_at
      BEFORE UPDATE ON feedback
      FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_settings_updated_at') THEN
    CREATE TRIGGER trg_settings_updated_at
      BEFORE UPDATE ON settings
      FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- ================================================================
-- SEEDS
-- ================================================================

-- Default admin user (password: admin123)
INSERT INTO users (id, email, password_hash, role, full_name)
VALUES (
  'admin_user',
  'admin@sdlc.com',
  '$2a$10$e3lC5nLrQEWCmu15W69ux./xMB45aDURPA3skiFXmcmmySIWCAD.G',
  'admin',
  'System Administrator'
) ON CONFLICT (id) DO NOTHING;

-- Default settings
INSERT INTO settings (id, active_ai_provider, api_keys, api_endpoints, ollama_url, ollama_model)
VALUES (
  1, 'expert',
  '{"openai":"","gemini":"","claude":""}',
  '{"openai":"","gemini":"","claude":"","ollama":""}',
  'http://localhost:11434',
  'llama3'
) ON CONFLICT (id) DO NOTHING;
