/**
 * backend/db/users.js
 * User account management, authentication, and profile functions.
 */

import crypto from 'crypto';
import { query } from './pool.js';

export async function getUsers() {
  return query('SELECT id, email, role, name, full_name, business_group, employee_id, account, created_at FROM users ORDER BY created_at DESC');
}

export async function createUser(email, password, extraData = {}) {
  const bcrypt = await import('bcryptjs');
  const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  if (existing.length > 0) throw new Error('User already exists');

  const salt = await bcrypt.default.genSalt(10);
  const hashedPassword = await bcrypt.default.hash(password, salt);
  const id = 'user_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const name           = (extraData.name           || '').trim();
  const businessGroup  = (extraData.businessGroup  || '').trim();
  const employeeId     = (extraData.employeeId     || '').trim();
  const account        = (extraData.account        || '').trim();

  await query(
    `INSERT INTO users
       (id, email, password_hash, password, role, name, full_name, business_group, employee_id, account)
     VALUES ($1,$2,$3,$3,$4,$5,$5,$6,$7,$8)`,
    [id, email.toLowerCase(), hashedPassword, 'user', name || null, businessGroup || null, employeeId || null, account || null]
  );
  return { id, email: email.toLowerCase(), name, businessGroup, employeeId, account };
}

export async function authenticateUser(email, password) {
  const bcrypt = await import('bcryptjs');
  const rows = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND is_active = true', [email]);
  if (rows.length === 0) return null;
  const user = rows[0];

  // Support both password_hash (new) and password (legacy column)
  const hashToCheck = user.password_hash || user.password;
  const valid = await bcrypt.default.compare(password, hashToCheck);
  if (!valid) return null;

  // Stamp last login time
  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]).catch(() => {});

  return {
    id:            user.id,
    email:         user.email,
    role:          user.role,
    name:          user.full_name || user.name || '',
    businessGroup: user.business_group || '',
    employeeId:    user.employee_id   || '',
    account:       user.account       || '',
  };
}

export async function getUserById(id) {
  const rows = await query(
    'SELECT id, email, role, name, full_name, business_group, employee_id, account, created_at FROM users WHERE id = $1',
    [id]
  );
  if (!rows[0]) return null;
  const u = rows[0];
  return {
    id:            u.id,
    email:         u.email,
    role:          u.role,
    name:          u.full_name || u.name || '',
    businessGroup: u.business_group  || '',
    employeeId:    u.employee_id    || '',
    account:       u.account        || '',
    createdAt:     u.created_at,
  };
}

export async function ensureAdminUser(passwordHash) {
  const rows = await query("SELECT * FROM users WHERE email = 'admin@sdlc.com'");
  if (rows.length === 0) {
    await query(
      'INSERT INTO users (id, email, password_hash, password, role, full_name, name) VALUES ($1, $2, $3, $3, $4, $5, $5)',
      ['admin_user', 'admin@sdlc.com', passwordHash, 'admin', 'System Administrator']
    );
    return { id: 'admin_user', email: 'admin@sdlc.com', role: 'admin', name: 'System Administrator' };
  }
  const row = rows[0];
  return { id: row.id, email: row.email, role: row.role, name: row.name || '' };
}

export async function updateUserProfile(userId, name) {
  await query('UPDATE users SET name = $1, full_name = $1, updated_at = NOW() WHERE id = $2', [name, userId]);
  return getUserById(userId);
}
