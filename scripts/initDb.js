// scripts/initDb.js — run with: npm run db:init
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDb() {
  const client = await pool.connect();
  try {
    console.log('🔧 Initialising Mr. Pattedaara database…');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name          TEXT NOT NULL,
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role          TEXT NOT NULL DEFAULT 'viewer'
                        CHECK (role IN ('superintendent','investigating_officer','analyst','viewer')),
        unit          TEXT NOT NULL DEFAULT 'Cyber Investigation Unit',
        is_active     BOOLEAN NOT NULL DEFAULT true,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('  ✓ users table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS cases (
        id                  TEXT PRIMARY KEY,
        title               TEXT NOT NULL,
        fir                 TEXT,
        classification      TEXT NOT NULL DEFAULT 'Other',
        sub_classification  TEXT,
        priority            TEXT NOT NULL DEFAULT 'medium'
                              CHECK (priority IN ('critical','high','medium','low')),
        status              TEXT NOT NULL DEFAULT 'new'
                              CHECK (status IN ('new','under-investigation','escalated','pending-court','closed')),
        district            TEXT,
        officer_id          UUID REFERENCES users(id) ON DELETE SET NULL,
        officer_name        TEXT,
        victim              JSONB NOT NULL DEFAULT '{}',
        suspect             JSONB NOT NULL DEFAULT '{}',
        notes               TEXT,
        tags                TEXT[] DEFAULT '{}',
        evidence            JSONB DEFAULT '[]',
        date_opened         DATE NOT NULL DEFAULT CURRENT_DATE,
        last_updated        DATE NOT NULL DEFAULT CURRENT_DATE,
        created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('  ✓ cases table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS graph_nodes (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        case_id     TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        node_key    TEXT NOT NULL,
        type        TEXT NOT NULL,
        label       TEXT NOT NULL,
        value       TEXT,
        confidence  TEXT NOT NULL DEFAULT 'suspected',
        notes       TEXT,
        pos_x       FLOAT,
        pos_y       FLOAT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(case_id, node_key)
      );
    `);
    console.log('  ✓ graph_nodes table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS graph_edges (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        case_id     TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        edge_key    TEXT NOT NULL,
        source_key  TEXT NOT NULL,
        target_key  TEXT NOT NULL,
        label       TEXT,
        type        TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(case_id, edge_key)
      );
    `);
    console.log('  ✓ graph_edges table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS timeline_entries (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        case_id     TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        entry_key   TEXT NOT NULL,
        event_date  DATE NOT NULL,
        event_time  TIME,
        event       TEXT NOT NULL,
        detail      TEXT,
        type        TEXT NOT NULL DEFAULT 'other',
        mitre_tag   TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(case_id, entry_key)
      );
    `);
    console.log('  ✓ timeline_entries table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS forensic_results (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        case_id     TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        target      TEXT NOT NULL,
        scan_type   TEXT NOT NULL,
        results     JSONB NOT NULL DEFAULT '{}',
        created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('  ✓ forensic_results table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
        user_name   TEXT,
        action      TEXT NOT NULL,
        resource    TEXT,
        details     JSONB,
        ip_address  TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('  ✓ audit_log table');

    // Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cases_status   ON cases(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cases_officer  ON cases(officer_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_graph_case     ON graph_nodes(case_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_edges_case     ON graph_edges(case_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_timeline_case  ON timeline_entries(case_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_forensics_case ON forensic_results(case_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_user     ON audit_log(user_id);`);
    console.log('  ✓ indexes created');

    console.log('\n✅ Database initialised successfully.');
    console.log('   Run: npm run db:seed   to add the default admin user.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initDb();
