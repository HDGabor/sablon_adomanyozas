const { checkPassword, setSessionCookie } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const { password } = req.body || {};

  if (!checkPassword(password)) {
    res.status(401).json({ error: 'invalid_password' });
    return;
  }

  setSessionCookie(res);
  res.status(200).json({ authenticated: true });
};
