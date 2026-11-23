# Huésped Siempre Estelar — Web (POC)

Cara web del POC de lealtad **Huésped Siempre Estelar** para Hoteles Estelar
(preventa Aquiva Labs). Sitio estático (HTML/CSS/JS vanilla, sin build) +
Vercel Functions en `api/` como proxy a Salesforce Loyalty vía OAuth Client
Credentials. Mismo patrón que `royalton-web`.

## Páginas

- **`index.html`**: landing en español con alta real al programa (500 estrellas
  de bienvenida). El botón ⚙ (abajo a la derecha) abre el menú backstage.
- **`account.html`**: portal del huésped. Ingreso por correo o número HSE
  (demo: `valentina.restrepo@example.com` / `HSE-100001`): nivel con progreso,
  ofertas con motivo, redención, historia en todos los hoteles.
- **`frontdesk.html`**: consola de recepción (backstage): lo que ve el equipo en
  el check-in + simulador de estadías (directo vs OTA vs convenio).
- **`deck.html`**: presentación al cliente (14 slides, Aquiva Design System).

## Deploy

Push a `main` → producción en Vercel (integración Git). Env vars requeridas:
`SF_LOGIN_URL`, `SF_CLIENT_ID`, `SF_CLIENT_SECRET` (External Client App con
Client Credentials en el org demo).

Más contexto en `CONTEXT.md`. Backend en el proyecto hermano
`/Users/nico/Aquiva/Latam/Estelar` (Salesforce DX, org `superaki-demo`, prefijo `EST_`).
