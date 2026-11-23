// Portal del huésped: ingreso por número de membresía o correo, cuenta en vivo.
// La sesión vive en sessionStorage (decisión de POC: en producción sería
// Headless Identity con código de un solo uso).
// fmt, money, esc, tierClass, channelLabel y categoryLabel vienen de common.js.

const SESSION_KEY = 'est-member-key';

const loginView = document.getElementById('login-view');
const memberView = document.getElementById('member-view');
const signoutBtn = document.getElementById('signout');

let currentView = null;

document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  signIn(document.getElementById('login-key').value.trim());
});

signoutBtn.addEventListener('click', (e) => {
  e.preventDefault();
  sessionStorage.removeItem(SESSION_KEY);
  currentView = null;
  memberView.classList.add('hidden');
  signoutBtn.classList.add('hidden');
  loginView.classList.remove('hidden');
});

async function signIn(key) {
  const btn = document.getElementById('login-btn');
  const err = document.getElementById('login-error');
  btn.disabled = true;
  btn.textContent = 'Ingresando…';
  err.className = 'hidden';
  try {
    const resp = await fetch(`/api/guest?key=${encodeURIComponent(key)}`);
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'No encontramos esa membresía.');
    sessionStorage.setItem(SESSION_KEY, data.membershipNumber);
    render(data);
  } catch (e2) {
    err.className = 'notice notice-err';
    err.textContent = e2.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Ingresar';
  }
}

function render(v) {
  currentView = v;
  loginView.classList.add('hidden');
  memberView.classList.remove('hidden');
  signoutBtn.classList.remove('hidden');

  document.getElementById('m-name').textContent = `Hola de nuevo, ${v.firstName}`;
  document.getElementById('m-meta').textContent =
    `${v.membershipNumber} · ${v.homeCity || ''} · miembro desde ${v.memberSince || '—'}`;
  document.getElementById('m-prefs').textContent =
    (v.preferences || []).length ? `Preferencias: ${v.preferences.join(' · ')}` : '';

  const tier = v.tier || {};
  const tierEl = document.getElementById('m-tier');
  tierEl.textContent = tier.currentTier || 'Clásico';
  tierEl.className = 'tier-badge ' + tierClass(tier.currentTier);
  document.getElementById('m-points').innerHTML =
    `${fmt(v.balance)} <small>estrellas ≈ ${money(v.pointsValueUsd)}</small>`;
  document.getElementById('m-progress').textContent = tier.nextTier
    ? `${tier.nightsToNext} noches para ${tier.nextTier}`
    : 'Nivel máximo: Titanio';

  const risk = document.getElementById('m-risk');
  if (tier.atRiskOfDowngrade) {
    risk.className = 'notice notice-warn';
    risk.textContent = `Tu nivel ${tier.currentTier} está en riesgo: ${tier.nightsLast12} noches ` +
      `en los últimos 12 meses. Te faltan ${tier.nightsToNext} noches para conservarlo en el corte de fin de año.`;
  } else {
    risk.className = 'notice notice-warn hidden';
  }

  document.getElementById('m-kpis').innerHTML = [
    [v.staysCount, 'estadías'],
    [v.propertiesVisited, 'hoteles'],
    [v.destinationsVisited, 'ciudades'],
    [fmt(v.totalNights), 'noches'],
    [money(v.lifetimeValue), 'valor histórico'],
  ].map(([n, l]) => `<div class="kpi"><span class="n">${n}</span><span class="l">${l}</span></div>`).join('');

  const offers = v.offers || [];
  document.getElementById('m-offers-wrap').classList.toggle('hidden', offers.length === 0);
  document.getElementById('m-offers').innerHTML = offers.map((o) =>
    `<div class="offer"><div class="head">${esc(o.emoji)} ${esc(o.name)}</div>` +
    `<div class="why">${esc(o.guestPitch || o.reason)}</div></div>`).join('');

  document.getElementById('m-rewards').innerHTML = (v.rewards || []).map((r) =>
    `<div class="reward-row"><span>${esc(r.emoji)}</span><span class="name">${esc(r.name)}</span>` +
    `<span class="cost">${fmt(r.pointsCost)} estrellas · valor ${money(r.value)}</span>` +
    `<button class="btn btn-dark btn-sm" data-id="${esc(r.promotionId)}" data-name="${esc(r.name)}" ` +
    `${r.affordable ? '' : 'disabled'}>Redimir</button></div>`).join('');
  document.querySelectorAll('#m-rewards button[data-id]').forEach((b) =>
    b.addEventListener('click', () => redeem(b.dataset.id, b.dataset.name)));

  const vouchers = v.vouchers || [];
  document.getElementById('m-vouchers-wrap').classList.toggle('hidden', vouchers.length === 0);
  document.getElementById('m-vouchers').innerHTML = vouchers.map((vo) =>
    `<span class="chip ${vo.status === 'Issued' ? 'chip-direct' : ''}" style="margin:0 .3rem .3rem 0;">` +
    `${esc(vo.code)} · ${vo.status === 'Issued' ? 'Vigente' : vo.status === 'Redeemed' ? 'Usado' : vo.status === 'Expired' ? 'Vencido' : esc(vo.status)} · ${money(vo.faceValue)}</span>`).join('');

  document.getElementById('m-history').innerHTML = (v.history || []).map((h) => {
    const type = h.eventType === 'OnPropertySpend' ? categoryLabel(h.category)
      : h.eventType === 'Redemption' ? 'Redención' : 'Estadía';
    const chip = h.channel
      ? `<span class="chip chip-${(h.channel || '').toLowerCase()}">${esc(channelLabel(h.channel))}</span>` +
        (h.partnerName ? ` <span class="small muted">${esc(h.partnerName)}</span>` : '')
      : '';
    const pts = h.points == null ? '' :
      `<span class="${h.points < 0 ? 'pts-neg' : 'pts-pos'}">${h.points > 0 ? '+' : ''}${fmt(h.points)}</span>`;
    return `<tr><td>${esc(h.eventDate)}</td><td>${esc(type)}</td><td>${esc(h.property || '')}</td>` +
      `<td>${esc(h.destination || '')}</td><td>${chip}</td>` +
      `<td class="num">${h.nights || ''}</td><td class="num">${h.amount != null ? money(h.amount) : ''}</td>` +
      `<td class="num">${pts}</td></tr>`;
  }).join('');

  document.getElementById('m-redeem-result').className = 'hidden';
}

async function redeem(promotionId, name) {
  const out = document.getElementById('m-redeem-result');
  out.className = 'hidden';
  try {
    const resp = await fetch('/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membershipNumber: currentView.membershipNumber, promotionId }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'No pudimos hacer la redención en este momento.');
    out.className = 'notice notice-ok';
    out.innerHTML = `<strong>${esc(name)}</strong> ya es tuyo: bono ` +
      `<strong>${esc(data.voucherCode)}</strong>. Nuevo saldo: ${fmt(data.newBalance)} estrellas.`;
    await refresh();
  } catch (e) {
    out.className = 'notice notice-err';
    out.textContent = e.message;
  }
}

async function refresh() {
  const key = sessionStorage.getItem(SESSION_KEY);
  if (!key) return;
  const resp = await fetch(`/api/guest?key=${encodeURIComponent(key)}`);
  if (resp.ok) {
    const keep = document.getElementById('m-redeem-result').outerHTML;
    render(await resp.json());
    document.getElementById('m-redeem-result').outerHTML = keep;
  }
}

// Ingreso automático si ya hay sesión.
const saved = sessionStorage.getItem(SESSION_KEY);
if (saved) signIn(saved);
