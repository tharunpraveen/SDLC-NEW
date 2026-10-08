/**
 * backend/db/questions.js
 * Question bank management for SDLC and AMS frameworks.
 */

import { query } from './pool.js';

export async function getQuestions(framework = null) {
  const rows = framework
    ? await query('SELECT * FROM questions WHERE framework = $1 ORDER BY id ASC', [framework.toUpperCase()])
    : await query('SELECT * FROM questions ORDER BY id ASC');
  return rows.map(row => ({
    id:           row.id,
    framework:    row.framework || 'SDLC',
    area:         row.area,
    subArea:      row.sub_area,
    practice:     row.practice,
    type:         row.type,
    questionText: row.question_text
  }));
}

export async function saveQuestion(questionData) {
  const framework = (questionData.framework || 'SDLC').toUpperCase();
  if (questionData.id) {
    const existing = await query('SELECT id FROM questions WHERE id = $1', [questionData.id]);
    if (existing.length > 0) {
      await query(
        `UPDATE questions
         SET area=$1, sub_area=$2, practice=$3, question_type=$4, type=$4, question_text=$5, updated_at=NOW()
         WHERE id=$6`,
        [questionData.area, questionData.subArea, questionData.practice,
         questionData.type || 'extent', questionData.questionText, questionData.id]
      );
      return true;
    }
  }
  // DB-level unique constraint will throw 23505 on true duplicate
  await query(
    `INSERT INTO questions (framework, area, sub_area, practice, question_type, type, question_text)
     VALUES ($1,$2,$3,$4,$5,$5,$6)`,
    [framework, questionData.area, questionData.subArea, questionData.practice,
     questionData.type || 'extent', questionData.questionText]
  );
  return true;
}

export async function deleteQuestion(id) {
  const rows = await query('DELETE FROM questions WHERE id = $1 RETURNING id', [parseInt(id)]);
  return rows.length > 0;
}
