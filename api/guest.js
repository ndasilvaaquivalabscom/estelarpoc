// GET /api/guest?key=RR-100001 (or email) → Guest 360 view.
const { sfFetch, proxy, DOWN } = require('./_salesforce');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  const key = String(req.query.key || '').trim();
  if (!key) {
    return res.status(400).json({ error: 'Ingresa tu número de membresía o tu correo.' });
  }
  try {
    const sfRes = await sfFetch(`/estelar/guest?key=${encodeURIComponent(key)}`);
    await proxy(res, sfRes);
  } catch (e) {
    res.status(502).json(DOWN);
  }
};
