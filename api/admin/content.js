const { requireAdmin } = require('../_lib/auth');
const { getSupabaseClient } = require('../_lib/supabase');

const ALLOWED_KEYS = [
  'hero_title',
  'hero_subtitle',
  'intro_short_text',
  'intro_long_text',
  'logo_url',
  'hero_image_url'
];

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  const supabase = getSupabaseClient();

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase.from('site_content').select('key, value');
      if (error) throw error;
      const content = {};
      data.forEach(row => { content[row.key] = row.value; });
      res.status(200).json(content);
    } catch (err) {
      res.status(500).json({ error: 'internal_error', message: err.message });
    }
    return;
  }

  if (req.method === 'PUT') {
    const body = req.body || {};
    const updates = Object.keys(body).filter(key => ALLOWED_KEYS.includes(key));

    if (updates.length === 0) {
      res.status(400).json({ error: 'validation_failed', message: 'no_valid_keys' });
      return;
    }

    try {
      const rows = updates.map(key => ({
        key,
        value: String(body[key] ?? ''),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('site_content').upsert(rows, { onConflict: 'key' });
      if (error) throw error;

      const { data, error: readError } = await supabase.from('site_content').select('key, value');
      if (readError) throw readError;
      const content = {};
      data.forEach(row => { content[row.key] = row.value; });

      res.status(200).json(content);
    } catch (err) {
      res.status(500).json({ error: 'internal_error', message: err.message });
    }
    return;
  }

  res.status(405).json({ error: 'method_not_allowed' });
};
