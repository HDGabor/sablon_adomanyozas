const { requireAdmin } = require('../_lib/auth');
const { getSupabaseClient } = require('../_lib/supabase');

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  const supabase = getSupabaseClient();

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase.from('campaign_stats').select('*').eq('id', 1).single();
      if (error) throw error;
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ error: 'internal_error', message: err.message });
    }
    return;
  }

  if (req.method === 'PUT') {
    const { goal_amount, raised_amount, supporter_count, deadline } = req.body || {};

    const goalNum = Number(goal_amount);
    const raisedNum = Number(raised_amount);
    const supporterNum = Number(supporter_count);

    if (!Number.isFinite(goalNum) || goalNum < 0) {
      res.status(400).json({ error: 'validation_failed', field: 'goal_amount' });
      return;
    }
    if (!Number.isFinite(raisedNum) || raisedNum < 0) {
      res.status(400).json({ error: 'validation_failed', field: 'raised_amount' });
      return;
    }
    if (!Number.isFinite(supporterNum) || supporterNum < 0) {
      res.status(400).json({ error: 'validation_failed', field: 'supporter_count' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('campaign_stats')
        .update({
          goal_amount: Math.round(goalNum),
          raised_amount: Math.round(raisedNum),
          supporter_count: Math.round(supporterNum),
          deadline: deadline || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)
        .select('*')
        .single();

      if (error) throw error;
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ error: 'internal_error', message: err.message });
    }
    return;
  }

  res.status(405).json({ error: 'method_not_allowed' });
};
