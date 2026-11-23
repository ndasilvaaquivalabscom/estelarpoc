// GET /api/properties → catálogo de hoteles Estelar.
const { sfFetch, proxy, DOWN } = require('./_salesforce');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  try {
    const sfRes = await sfFetch('/estelar/properties');
    await proxy(res, sfRes);
  } catch (e) {
    res.status(502).json(DOWN);
  }
};
