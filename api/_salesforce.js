// Shared helper for the /api/* functions.
// Talks to Salesforce via OAuth 2.0 Client Credentials; the token is cached in
// the module (function instances reuse it while warm).
// Secrets live in Vercel env vars: SF_LOGIN_URL, SF_CLIENT_ID, SF_CLIENT_SECRET.
// Never in the browser, never in the repo.
// (Starts with "_" so Vercel does not expose it as an endpoint.)

let tokenCache = { accessToken: null, instanceUrl: null, expiresAt: 0 };

async function getToken() {
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt) {
    return tokenCache;
  }
  const loginUrl = process.env.SF_LOGIN_URL;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.SF_CLIENT_ID,
    client_secret: process.env.SF_CLIENT_SECRET,
  });
  const resp = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!resp.ok) {
    throw new Error(`OAuth against Salesforce failed (HTTP ${resp.status})`);
  }
  const data = await resp.json();
  tokenCache = {
    accessToken: data.access_token,
    instanceUrl: data.instance_url,
    // the token lives longer, but we renew early to stay safe
    expiresAt: Date.now() + 25 * 60 * 1000,
  };
  return tokenCache;
}

// Authenticated fetch against the POC's Apex REST (retries once on expiry).
async function sfFetch(path, options = {}, retry = true) {
  const { accessToken, instanceUrl } = await getToken();
  const resp = await fetch(`${instanceUrl}/services/apexrest${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      ...(options.headers || {}),
    },
  });
  if (resp.status === 401 && retry) {
    tokenCache = { accessToken: null, instanceUrl: null, expiresAt: 0 };
    return sfFetch(path, options, false);
  }
  return resp;
}

// Relays the Salesforce response to the browser as-is (status + JSON).
async function proxy(res, sfResponse) {
  const text = await sfResponse.text();
  res.setHeader('Cache-Control', 'no-store');
  try {
    res.status(sfResponse.status).json(JSON.parse(text));
  } catch {
    res.status(502).json({ error: 'Respuesta inesperada del programa.' });
  }
}

const DOWN = { error: 'No pudimos conectar con el programa. Intenta de nuevo en un momento.' };

module.exports = { sfFetch, proxy, DOWN };
