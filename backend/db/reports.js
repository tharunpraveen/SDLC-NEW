/**
 * backend/db/reports.js
 * Assessment AI reports generation and lifecycle management.
 */

import { query } from './pool.js';

export function parseReportRow(row) {
  return {
    id:               row.id,
    assessmentId:     row.assessment_id,
    provider:         row.provider,
    model:            row.model,
    promptVersion:    row.prompt_version,
    reportJson:       typeof row.report_json === 'string' ? JSON.parse(row.report_json || 'null') : (row.report_json || null),
    generationStatus: row.generation_status,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  };
}

export async function createReport(assessmentId, promptVersion = 'v1.0') {
  const rows = await query(`
    INSERT INTO assessment_reports (assessment_id, generation_status, prompt_version)
    VALUES ($1, 'pending', $2)
    RETURNING *
  `, [assessmentId, promptVersion]);
  return parseReportRow(rows[0]);
}

export async function updateReport(reportId, updates) {
  const allowed = ['generation_status', 'report_json', 'provider', 'model', 'prompt_version'];
  const fields  = Object.keys(updates).filter(k => allowed.includes(k));
  if (fields.length === 0) return getReportById(reportId);

  const setClauses = fields.map((f, i) => f + ' = $' + (i + 1)).join(', ');
  const values = fields.map(f => {
    const v = updates[f];
    return (f === 'report_json' && typeof v === 'object') ? JSON.stringify(v) : v;
  });
  values.push(reportId);

  const rows = await query(
    'UPDATE assessment_reports SET ' + setClauses + ', updated_at = NOW() WHERE id = $' + values.length + ' RETURNING *',
    values
  );
  return rows.length > 0 ? parseReportRow(rows[0]) : getReportById(reportId);
}

export async function getLatestReport(assessmentId) {
  const rows = await query(`
    SELECT * FROM assessment_reports
    WHERE assessment_id = $1
    ORDER BY created_at DESC
    LIMIT 1
  `, [assessmentId]);
  if (rows.length === 0) return null;
  return parseReportRow(rows[0]);
}

export async function getReportById(reportId) {
  const rows = await query('SELECT * FROM assessment_reports WHERE id = $1', [reportId]);
  if (rows.length === 0) return null;
  return parseReportRow(rows[0]);
}
