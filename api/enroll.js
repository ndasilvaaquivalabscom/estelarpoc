// POST /api/enroll {firstName,lastName,email,homeCity} → new member + bono de bienvenida.
const { sfFetch, proxy, DOWN } = require('./_salesforce');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  const { firstName, lastName, email, homeCity } = req.body || {};
  if (!firstName || !lastName || !email || !String(email).includes('@')) {
    return res.status(400).json({ error: 'Nombre, apellido y un correo válido son obligatorios.' });
  }
  try {
    const sfRes = await sfFetch('/estelar/enroll', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, email, homeCity }),
    });
    await proxy(res, sfRes);
  } catch (e) {
    res.status(502).json(DOWN);
  }
};
