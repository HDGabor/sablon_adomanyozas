const { isAuthenticated } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  if (!isAuthenticated(req)) {
    res.status(401).json({ authenticated: false });
    return;
  }

  res.status(200).json({ authenticated: true });
};
