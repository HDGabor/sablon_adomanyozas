const { requireAdmin } = require('../_lib/auth');
const { getSupabaseClient } = require('../_lib/supabase');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const supabase = getSupabaseClient();
    const { data, error, count } = await supabase
      .from('donations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.status(200).json({ items: data, total: count, page, limit });
  } catch (err) {
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
};
