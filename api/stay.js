// POST /api/stay {membershipNumber,property,channel,partnerName,nights,roomAmount,spend[]}
// → posts a completed stay from the front desk simulator and otorga estrellas.
const { sfFetch, proxy, DOWN } = require('./_salesforce');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  const body = req.body || {};
  if (!body.membershipNumber || !body.property || !body.channel) {
    return res.status(400).json({ error: 'membershipNumber, property y channel son obligatorios.' });
  }
  try {
    const sfRes = await sfFetch('/estelar/stay', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    await proxy(res, sfRes);
  } catch (e) {
    res.status(502).json(DOWN);
  }
};
