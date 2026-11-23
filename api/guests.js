// GET /api/guests → demo guest list (front desk selector).
const { sfFetch, proxy, DOWN } = require('./_salesforce');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  try {
    const sfRes = await sfFetch('/estelar/guests');
    await proxy(res, sfRes);
  } catch (e) {
    res.status(502).json(DOWN);
  }
};
