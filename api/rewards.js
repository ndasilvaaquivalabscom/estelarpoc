// GET /api/rewards?member=RR-100001 → balance + reward catalog.
const { sfFetch, proxy, DOWN } = require('./_salesforce');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  const member = String(req.query.member || '').trim();
  if (!member) {
    return res.status(400).json({ error: 'Falta el parámetro member.' });
  }
  try {
    const sfRes = await sfFetch(`/estelar/rewards?member=${encodeURIComponent(member)}`);
    await proxy(res, sfRes);
  } catch (e) {
    res.status(502).json(DOWN);
  }
};
