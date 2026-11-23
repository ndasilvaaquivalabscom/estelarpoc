// POST /api/spend {membershipNumber,property,category,amount} → on-property charge.
const { sfFetch, proxy, DOWN } = require('./_salesforce');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  const { membershipNumber, property, category, amount } = req.body || {};
  if (!membershipNumber || !property || !category || !amount) {
    return res.status(400).json({ error: 'membershipNumber, property, category y amount son obligatorios.' });
  }
  try {
    const sfRes = await sfFetch('/estelar/spend', {
      method: 'POST',
      body: JSON.stringify({ membershipNumber, property, category, amount }),
    });
    await proxy(res, sfRes);
  } catch (e) {
    res.status(502).json(DOWN);
  }
};
