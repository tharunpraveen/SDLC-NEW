/**
 * backend/db/settings.js
 * Platform AI provider configuration and API key settings.
 */

import { query } from './pool.js';

export async function getSettings() {
  const rows = await query('SELECT * FROM settings WHERE id = 1');
  const row  = rows[0] || null;

  const apiKeys      = row ? (typeof row.api_keys      === 'string' ? JSON.parse(row.api_keys      || '{}') : (row.api_keys      || {})) : { openai: '', gemini: '', claude: '' };
  const apiEndpoints = row ? (typeof row.api_endpoints === 'string' ? JSON.parse(row.api_endpoints || '{}') : (row.api_endpoints || {})) : { openai: '', gemini: '', claude: '', ollama: '' };

  const activeAIProvider =
    process.env.ACTIVE_AI_PROVIDER ||
    (row ? row.active_ai_provider : null) ||
    'expert';

  if (process.env.OPENAI_API_KEY) apiKeys.openai = process.env.OPENAI_API_KEY;
  if (process.env.GEMINI_API_KEY) apiKeys.gemini = process.env.GEMINI_API_KEY;
  if (process.env.CLAUDE_API_KEY) apiKeys.claude = process.env.CLAUDE_API_KEY;

  return {
    activeAIProvider,
    apiKeys,
    ollamaUrl:   (row ? row.ollama_url   : null) || process.env.OLLAMA_URL   || 'http://localhost:11434',
    ollamaModel: (row ? row.ollama_model : null) || process.env.OLLAMA_MODEL || 'llama3',
    apiEndpoints,
  };
}

export async function updateSettings(settingsData) {
  const current = await getSettings();
  const merged  = { ...current, ...settingsData };
  const apiKeys      = JSON.stringify(merged.apiKeys      || { openai: '', gemini: '', claude: '' });
  const apiEndpoints = JSON.stringify(merged.apiEndpoints || { openai: '', gemini: '', claude: '', ollama: '' });

  await query(`
    INSERT INTO settings (id, active_ai_provider, api_keys, ollama_url, ollama_model, api_endpoints)
    VALUES (1, $1, $2::jsonb, $3, $4, $5::jsonb)
    ON CONFLICT (id) DO UPDATE SET
      active_ai_provider = EXCLUDED.active_ai_provider,
      api_keys           = EXCLUDED.api_keys,
      ollama_url         = EXCLUDED.ollama_url,
      ollama_model       = EXCLUDED.ollama_model,
      api_endpoints      = EXCLUDED.api_endpoints
  `, [
    merged.activeAIProvider || 'ollama',
    apiKeys,
    merged.ollamaUrl  || 'http://localhost:11434',
    merged.ollamaModel || 'llama3',
    apiEndpoints
  ]);
  return getSettings();
}
