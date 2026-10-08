/**
 * backend/db/pool.js
 * PostgreSQL connection pool configuration and diagnostic utilities.
 */

import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

function cleanValue(val) {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  return str.replace(/^["']|["']$/g, '').trim();
}

let host = cleanValue(process.env.DB_HOST);
let port = cleanValue(process.env.DB_PORT);
let database = cleanValue(process.env.DB_NAME);
let user = cleanValue(process.env.DB_USER);
let password = cleanValue(process.env.DB_PASSWORD);

// If DATABASE_URL is provided, safely parse with URL class
if (process.env.DATABASE_URL) {
  try {
    const rawUrl = cleanValue(process.env.DATABASE_URL);
    const parsed = new URL(rawUrl);
    if (!host) host = parsed.hostname;
    if (!port) port = parsed.port;
    if (!database && parsed.pathname) database = parsed.pathname.replace(/^\//, '');
    if (!user && parsed.username) user = decodeURIComponent(parsed.username);
    if (!password && parsed.password) password = decodeURIComponent(parsed.password);
  } catch (err) {
    console.warn('[db] Failed to parse DATABASE_URL:', err.message);
  }
}

// Project defaults (fallback if env vars not set)
host     = host     || 'aws-0-ap-southeast-2.pooler.supabase.com';
port     = parseInt(port || '5432', 10);
database = database || 'postgres';
user     = user     || 'postgres.dftpmkbyesvxcymbgfrh';
password = password || 'Jaswanth8520874916';

const isLocalHost = host === 'localhost' || host === '127.0.0.1';
const useSsl = process.env.DB_SSL !== undefined
  ? process.env.DB_SSL === 'true'
  : !isLocalHost;

export const pool = new Pool({
  host,
  port,
  database,
  user,
  password,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

// Generic query helper
export async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Diagnostic connection test helper
export async function testDbConnection() {
  const maskedPass = password ? `${password[0]}***${password.slice(-1)} (length: ${password.length})` : 'MISSING';
  const config = {
    host,
    port,
    database,
    user,
    passwordPreview: maskedPass,
    ssl: true,
  };

  async function tryConnect(p) {
    const testPool = new Pool({
      host,
      port: p,
      database,
      user,
      password,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 8000,
    });
    try {
      const client = await testPool.connect();
      try {
        const res = await client.query('SELECT NOW() as now, current_user as "currentUser", current_database() as "currentDb"');
        return { success: true, port: p, result: res.rows[0] };
      } finally {
        client.release();
      }
    } catch (err) {
      return {
        success: false,
        port: p,
        error: {
          message: err.message,
          code: err.code,
        },
      };
    } finally {
      await testPool.end().catch(() => {});
    }
  }

  const primaryResult = await tryConnect(port);
  if (primaryResult.success) {
    return { success: true, config, result: primaryResult.result };
  }

  const alternatePort = port === 5432 ? 6543 : 5432;
  const altResult = await tryConnect(alternatePort);

  return {
    success: false,
    config,
    primaryPort: { port, ...primaryResult },
    alternatePort: { port: alternatePort, ...altResult },
    error: primaryResult.error,
  };
}
