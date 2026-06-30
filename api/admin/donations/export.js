const { requireAdmin } = require('../../_lib/auth');
const { getSupabaseClient } = require('../../_lib/supabase');

const COLUMNS = [
  'created_at', 'status', 'amount', 'frequency', 'payment_method',
  'last_name', 'first_name', 'email', 'is_company', 'company_name',
  'tax_number', 'zip', 'city', 'street', 'phone'
];

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const lines = [COLUMNS.join(',')];
    data.forEach(row => {
      lines.push(COLUMNS.map(col => csvEscape(row[col])).join(','));
    });
    const csv = '﻿' + lines.join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="jelentkezesek.csv"');
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
};
