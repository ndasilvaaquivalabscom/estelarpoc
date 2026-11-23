// Consola de recepción (backstage): búsqueda del huésped, redención con un clic
// en el punto de servicio y el simulador de estadías que alimenta la demo
// (economía directo vs OTA en vivo).
// fmt, money, esc, tierClass, channelLabel vienen de common.js.

let guest = null;

const el = (id) => document.getElementById(id);

async function init() {
  try {
    const [guestsResp, propsResp] = await Promise.all([
      fetch('/api/guests'),
      fetch('/api/properties'),
    ]);
    const guests = await guestsResp.json();
    const props = await propsResp.json();
    if (!guestsResp.ok) throw new Error(guests.error || 'No pudimos cargar los huéspedes.');
    if (!propsResp.ok) throw new Error(props.error || 'No pudimos cargar los hoteles.');

    // Elenco en orden del guion: HSE-100001 (Valentina) primero.
    guests.sort((a, b) => a.membershipNumber.localeCompare(b.membershipNumber));
    el('fd-guest').innerHTML = guests.map((g) =>
      `<option value="${esc(g.membershipNumber)}">${esc(g.name)} · ${esc(g.membershipNumber)} · ${esc(g.tier)}</option>`
    ).join('');
    el('fd-property').innerHTML = props.map((p) =>
      `<option value="${esc(p.name)}">${esc(p.name)} · ${esc(p.destination)}${p.brand ? ` (${esc(p.brand)})` : ''}</option>`
    ).join('');
    await loadGuest();
  } catch (e) {
    showError(e.message);
  }
}

function showError(message) {
  const box = el('fd-error');
  box.className = 'notice notice-err';
  box.textContent = message;
}

function clearError() {
  el('fd-error').className = 'hidden';
}

async function loadGuest() {
  clearError();
  const key = el('fd-guest').value;
  if (!key) return;
  try {
    const resp = await fetch(`/api/guest?key=${encodeURIComponent(key)}`);
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'No pudimos cargar el huésped.');
    guest = data;
    renderGuest();
  } catch (e) {
    showError(e.message);
  }
}

function renderGuest() {
  el('fd-panel').classList.remove('hidden');
  el('fd-name').textContent = guest.name;
  el('fd-meta').textContent =
    `${guest.membershipNumber} · ${guest.homeCity || ''} · ${guest.staysCount} estadías / ` +
    `${guest.propertiesVisited} hoteles / ${guest.destinationsVisited} ciudades · ` +
    `valor histórico ${money(guest.lifetimeValue)}`;
  el('fd-prefs').textContent = (guest.preferences || []).length
    ? `Preferencias: ${guest.preferences.join(' · ')}` : '';
  const vouchers = (guest.vouchers || []).filter((v) => v.status === 'Issued');
  el('fd-vouchers').textContent = vouchers.length
    ? `Bonos vigentes: ${vouchers.map((v) => `${v.code} (${money(v.faceValue)})`).join(', ')}` : '';

  const tier = guest.tier || {};
  const tierEl = el('fd-tier');
  tierEl.textContent = tier.currentTier || 'Clásico';
  tierEl.className = 'tier-badge ' + tierClass(tier.currentTier);
  el('fd-points').innerHTML = `${fmt(guest.balance)} <small>estrellas</small>`;
  el('fd-progress').textContent = tier.nextTier
    ? `${tier.nightsToNext} noches para ${tier.nextTier}` : 'Nivel máximo: Titanio';

  const risk = el('fd-risk');
  if (tier.atRiskOfDowngrade) {
    risk.className = 'notice notice-warn';
    risk.textContent = `⚠️ Nivel ${tier.currentTier} en riesgo de descenso: ` +
      `${tier.nightsLast12} noches en los últimos 12 meses. Es el momento de reconquistarlo.`;
  } else {
    risk.className = 'notice notice-warn hidden';
  }

  el('fd-rewards').innerHTML = (guest.rewards || []).map((r) =>
    `<div class="reward-row"><span>${esc(r.emoji)}</span><span class="name">${esc(r.name)}</span>` +
    `<span class="cost">${fmt(r.pointsCost)} estrellas</span>` +
    `<button class="btn btn-dark btn-sm" data-id="${esc(r.promotionId)}" data-name="${esc(r.name)}" ` +
    `${r.affordable ? '' : 'disabled'}>Aplicar</button></div>`).join('');
  el('fd-rewards').querySelectorAll('button[data-id]').forEach((b) =>
    b.addEventListener('click', () => applyReward(b.dataset.id, b.dataset.name)));
}

async function applyReward(promotionId, name) {
  const out = el('fd-result');
  out.className = 'hidden';
  try {
    const resp = await fetch('/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        membershipNumber: guest.membershipNumber,
        promotionId,
        property: el('fd-property').value,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'No pudimos aplicar el beneficio.');
    out.className = 'notice notice-ok';
    out.innerHTML = `✅ <strong>${esc(name)}</strong> aplicado a ${esc(guest.name)}: bono ` +
      `<strong>${esc(data.voucherCode)}</strong> · nuevo saldo ${fmt(data.newBalance)} estrellas.`;
    await loadGuest();
  } catch (e) {
    out.className = 'notice notice-err';
    out.textContent = e.message;
  }
}

async function postStay() {
  const out = el('fd-result');
  out.className = 'hidden';
  const spend = [];
  const spa = Number(el('fd-spa').value || 0);
  const dining = Number(el('fd-dining').value || 0);
  const excursions = Number(el('fd-excursions').value || 0);
  if (spa > 0) spend.push({ category: 'Spa', amount: spa });
  if (dining > 0) spend.push({ category: 'Dining', amount: dining });
  if (excursions > 0) spend.push({ category: 'Excursions', amount: excursions });

  const btn = el('fd-post');
  btn.disabled = true;
  btn.textContent = 'Registrando…';
  try {
    const resp = await fetch('/api/stay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        membershipNumber: guest.membershipNumber,
        property: el('fd-property').value,
        channel: el('fd-channel').value,
        partnerName: el('fd-channel').value === 'Partner' ? el('fd-partner').value : null,
        nights: Number(el('fd-nights').value || 0),
        roomAmount: Number(el('fd-room').value || 0),
        spend,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'No pudimos registrar la estadía.');

    const upgraded = data.tierBefore !== data.tierAfter;
    let economics = '';
    if (data.channel === 'Direct') {
      economics = `Reserva <strong>directa</strong>: el alojamiento acumuló estrellas y Estelar evitó ` +
        `<strong>${money(data.commissionSaved)}</strong> de comisión OTA (modelada).`;
    } else if (data.channel === 'OTA') {
      economics = `Reserva por <strong>OTA</strong>: comisión pagada (modelada) ` +
        `<strong class="pts-neg">−${money(data.otaCommission)}</strong>. Por regla de HSE el alojamiento por OTA no ` +
        `acumula; reservando directo el huésped habría ganado <strong>+${fmt(data.directUpside)} estrellas más</strong>. ` +
        `Ese es el cambio de canal que el programa debe provocar.`;
    } else {
      economics = `Reserva por <strong>convenio o agencia</strong>: las noches cuentan para el nivel y el ` +
        `convenio queda registrado en la historia del huésped.`;
    }
    out.className = 'notice notice-ok';
    out.innerHTML =
      `✅ Estadía registrada para <strong>${esc(data.guestName)}</strong> en ${esc(data.property)}: ` +
      `<strong>+${fmt(data.pointsEarned)} estrellas</strong> (nuevo saldo ${fmt(data.newBalance)}).<br/>` +
      economics +
      (upgraded ? `<br/>🏆 <strong>Ascenso automático de nivel: ${esc(data.tierBefore)} → ${esc(data.tierAfter)}</strong>, sin procesos batch ni revisión manual.` : '');
    await loadGuest();
  } catch (e) {
    out.className = 'notice notice-err';
    out.textContent = e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Registrar estadía y otorgar estrellas';
  }
}

async function resetGuest() {
  const out = el('fd-result');
  out.className = 'hidden';
  try {
    const resp = await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membershipNumber: el('fd-guest').value }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'No pudimos restaurar el huésped.');
    out.className = 'notice notice-ok';
    out.textContent = `↺ ${el('fd-guest').value} quedó en su estado inicial.`;
    await loadGuest();
  } catch (e) {
    out.className = 'notice notice-err';
    out.textContent = e.message;
  }
}

el('fd-load').addEventListener('click', loadGuest);
el('fd-guest').addEventListener('change', loadGuest);
el('fd-reset').addEventListener('click', resetGuest);
el('fd-post').addEventListener('click', postStay);
el('fd-channel').addEventListener('change', () => {
  el('fd-partner-wrap').classList.toggle('hidden', el('fd-channel').value !== 'Partner');
});

init();
