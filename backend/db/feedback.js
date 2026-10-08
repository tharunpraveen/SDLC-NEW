/**
 * backend/db/feedback.js
 * User rating and feedback repository.
 */

import crypto from 'crypto';
import { query } from './pool.js';

export async function getFeedback() {
  return query('SELECT * FROM feedback ORDER BY created_at DESC');
}

export async function saveFeedback(feedbackData) {
  const id = 'fb_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  // UPSERT: one feedback per user per assessment (enforced by DB UNIQUE constraint)
  await query(
    `INSERT INTO feedback (id, assessment_id, user_id, user_email, rating, comments)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (assessment_id, user_id)
     DO UPDATE SET rating = EXCLUDED.rating,
                   comments = EXCLUDED.comments,
                   updated_at = NOW()`,
    [id, feedbackData.assessmentId, feedbackData.userId,
     feedbackData.userEmail || '',
     feedbackData.rating, feedbackData.comments || '']
  );
  return {
    id,
    assessmentId: feedbackData.assessmentId,
    userId:       feedbackData.userId,
    userEmail:    feedbackData.userEmail,
    rating:       feedbackData.rating,
    comments:     feedbackData.comments,
    createdAt:    new Date().toISOString()
  };
}
