// POST /api/reset {membershipNumber} → backstage: restores a guest to the seed state.
const { sfFetch, proxy, DOWN } = require('./_salesforce');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  const { membershipNumber } = req.body || {};
  if (!membershipNumber) {
    return res.status(400).json({ error: 'membershipNumber es obligatorio.' });
  }
  try {
    const sfRes = await sfFetch('/estelar/reset', {
      method: 'POST',
      body: JSON.stringify({ membershipNumber }),
    });
    await proxy(res, sfRes);
  } catch (e) {
    res.status(502).json(DOWN);
  }
};
