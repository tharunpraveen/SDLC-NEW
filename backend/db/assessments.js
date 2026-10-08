/**
 * backend/db/assessments.js
 * Assessment CRUD, score parsing, and remarks updates.
 */

import crypto from 'crypto';
import { query } from './pool.js';

export function parseAssessmentRow(row) {
  const scores = typeof row.scores === 'string' ? JSON.parse(row.scores || '{}') : (row.scores || {});
  let overallScore = row.overall_score != null ? parseInt(row.overall_score) : null;
  if (overallScore == null) {
    const vals = Object.values(scores);
    const avg  = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    overallScore = Math.round((avg / 5) * 100);
  }
  return {
    id:              row.id,
    userId:          row.user_id,
    userEmail:       row.user_email,
    projectName:     row.project_name,
    framework:       row.framework || 'SDLC',
    answers:         typeof row.answers  === 'string' ? JSON.parse(row.answers  || '{}') : (row.answers  || {}),
    scores,
    overallScore,
    remarks:         row.remarks,
    remarksProvider: row.remarks_provider,
    feedback:        typeof row.feedback === 'string' ? JSON.parse(row.feedback || 'null') : (row.feedback || null),
    createdAt:       row.created_at,
    updatedAt:       row.updated_at
  };
}

export async function getAssessments(userId = null) {
  const rows = userId
    ? await query('SELECT * FROM assessments WHERE user_id = $1 ORDER BY created_at DESC', [userId])
    : await query('SELECT * FROM assessments ORDER BY created_at DESC');
  return rows.map(parseAssessmentRow);
}

export async function getAssessmentById(id) {
  const rows = await query('SELECT * FROM assessments WHERE id = $1', [id]);
  if (rows.length === 0) return null;
  return parseAssessmentRow(rows[0]);
}

export async function saveAssessment(assessmentData) {
  const id = assessmentData.id || 'asm_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const existing = await query('SELECT id FROM assessments WHERE id = $1', [id]);

  const answers      = JSON.stringify(assessmentData.answers  || {});
  const scores       = JSON.stringify(assessmentData.scores   || {});
  const feedback     = JSON.stringify(assessmentData.feedback || null);
  const overallScore = parseFloat(assessmentData.overallScore || 0);
  const framework    = assessmentData.framework || 'SDLC';

  if (existing.length > 0) {
    await query(`
      UPDATE assessments
      SET user_id=$1, user_email=$2, project_name=$3, framework=$4, answers=$5::jsonb,
          scores=$6::jsonb, overall_score=$7, remarks=$8, remarks_provider=$9,
          feedback=$10::jsonb, updated_at=NOW()
      WHERE id=$11
    `, [
      assessmentData.userId || assessmentData.user_id,
      assessmentData.userEmail || assessmentData.user_email || '',
      assessmentData.projectName || assessmentData.project_name || '',
      framework, answers, scores, overallScore,
      assessmentData.remarks || null,
      assessmentData.remarksProvider || assessmentData.remarks_provider || null,
      feedback, id
    ]);
  } else {
    await query(`
      INSERT INTO assessments
        (id, user_id, user_email, project_name, framework, answers, scores, overall_score,
         remarks, remarks_provider, feedback)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10,$11::jsonb)
    `, [
      id,
      assessmentData.userId || assessmentData.user_id,
      assessmentData.userEmail || assessmentData.user_email || '',
      assessmentData.projectName || assessmentData.project_name || '',
      framework, answers, scores, overallScore,
      assessmentData.remarks || null,
      assessmentData.remarksProvider || assessmentData.remarks_provider || null,
      feedback
    ]);
  }
  return getAssessmentById(id);
}

export async function updateAssessmentRemarks(id, remarks, provider) {
  await query(
    'UPDATE assessments SET remarks = $1, remarks_provider = $2 WHERE id = $3',
    [remarks, provider || 'AI', id]
  );
  return getAssessmentById(id);
}
