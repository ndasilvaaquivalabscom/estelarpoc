// Landing: alta real al programa + menú backstage.

const joinForm = document.getElementById('join-form');
const joinResult = document.getElementById('join-result');
const joinBtn = document.getElementById('join-btn');

joinForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  joinBtn.disabled = true;
  joinBtn.textContent = 'Creando…';
  joinResult.className = 'hidden';
  try {
    const resp = await fetch('/api/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: document.getElementById('join-first').value.trim(),
        lastName: document.getElementById('join-last').value.trim(),
        email: document.getElementById('join-email').value.trim(),
        homeCity: document.getElementById('join-city').value.trim(),
      }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'No pudimos completar tu inscripción.');
    joinResult.className = 'notice notice-ok';
    joinResult.innerHTML =
      `¡Bienvenido/a, <strong>${data.name}</strong>! Tu número de membresía es ` +
      `<strong>${data.membershipNumber}</strong> y ya tienes <strong>${Number(data.welcomePoints).toLocaleString('es-CO')}` +
      ` estrellas de bienvenida</strong> en tu cuenta. ` +
      `<a href="account.html">Ingresa a tu cuenta →</a>`;
    joinForm.reset();
  } catch (e) {
    joinResult.className = 'notice notice-err';
    joinResult.textContent = e.message;
  } finally {
    joinBtn.disabled = false;
    joinBtn.textContent = 'Crear mi membresía';
  }
});

// Menú backstage (las herramientas de demo viven acá, no en la navegación).
const backstageToggle = document.getElementById('backstage-toggle');
const backstageMenu = document.getElementById('backstage-menu');
backstageToggle.addEventListener('click', () => backstageMenu.classList.toggle('open'));
document.addEventListener('click', (e) => {
  if (!backstageMenu.contains(e.target) && e.target !== backstageToggle) {
    backstageMenu.classList.remove('open');
  }
});
