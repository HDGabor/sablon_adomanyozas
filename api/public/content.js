const { getSupabaseClient } = require('../_lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    const supabase = getSupabaseClient();

    const [statsResult, contentResult] = await Promise.all([
      supabase.from('campaign_stats').select('*').eq('id', 1).single(),
      supabase.from('site_content').select('key, value')
    ]);

    if (statsResult.error) throw statsResult.error;
    if (contentResult.error) throw contentResult.error;

    const stats = statsResult.data;
    const content = {};
    contentResult.data.forEach(row => {
      content[row.key] = row.value;
    });

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      stats: {
        goal_amount: stats.goal_amount,
        raised_amount: stats.raised_amount,
        missing_amount: Math.max(0, stats.goal_amount - stats.raised_amount),
        supporter_count: stats.supporter_count,
        deadline: stats.deadline
      },
      content
    });
  } catch (err) {
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
};
