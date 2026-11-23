// POST /api/redeem {membershipNumber,promotionId,property} → spends points, issues a voucher.
const { sfFetch, proxy, DOWN } = require('./_salesforce');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  const { membershipNumber, promotionId, property } = req.body || {};
  if (!membershipNumber || !promotionId) {
    return res.status(400).json({ error: 'membershipNumber y promotionId son obligatorios.' });
  }
  try {
    const sfRes = await sfFetch('/estelar/redeem', {
      method: 'POST',
      body: JSON.stringify({ membershipNumber, promotionId, property }),
    });
    await proxy(res, sfRes);
  } catch (e) {
    res.status(502).json(DOWN);
  }
};
