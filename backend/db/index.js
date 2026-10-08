/**
 * backend/db/index.js
 * Central database barrel export.
 * Re-exports connection pooling, schema initialization, and all domain repositories.
 */

export * from './pool.js';
export * from './schema.js';
export * from './audit.js';
export * from './users.js';
export * from './assessments.js';
export * from './questions.js';
export * from './feedback.js';
export * from './settings.js';
export * from './reports.js';
