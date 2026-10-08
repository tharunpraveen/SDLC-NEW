/**
 * backend/db/audit.js
 * Audit log recording methods.
 */

import { query } from './pool.js';

export async function writeAuditLog({ userId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent }) {
  try {
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8)`,
      [
        userId   || null,
        action,
        entityType  || null,
        entityId    ? String(entityId) : null,
        oldValues   ? JSON.stringify(oldValues)   : null,
        newValues   ? JSON.stringify(newValues)   : null,
        ipAddress   || null,
        userAgent   || null,
      ]
    );
  } catch (err) {
    console.warn('[audit] write failed:', err.message); // never block main flow
  }
}
