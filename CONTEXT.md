# Contexto del proyecto — Huésped Siempre Estelar Web

Descripción de lo que se hizo e instrucciones para continuar el trabajo.
Leé este archivo antes de modificar el proyecto.

## Qué es esto

Cara web del **POC de lealtad Huésped Siempre Estelar (HSE)**, preventa de
Aquiva Labs para Hoteles Estelar (cadena colombiana, 24 hoteles en Colombia y
Perú). Clonado de `royalton-web` el 23-nov-2026 para la reunión "Hoteles
Estelar + Salesforce" de ese día. Cubre los pasos de la demo que viven fuera de
la consola de Salesforce: landing con alta real, portal del huésped y consola de
recepción, más el deck.

- **Sitio estático**: HTML + CSS + JavaScript vanilla. Sin build step, sin
  framework, sin dependencias.
- **Idioma**: español de Colombia (tuteo en marketing, como hotelesestelar.com).
  Montos en COP con formato `es-CO` sin decimales (`common.js`).
- **Repo previsto**: https://github.com/ndasilvaaquivalabscom/estelarpoc
- **Deploy previsto**: Vercel `estelarpoc.vercel.app` — push a `main` = producción.
- **Ruta local**: `/Users/nico/Aquiva/Latam/estelar-web`.

## Estructura

```
estelar-web/
├── deck.html      # presentación al cliente (14 slides, español, Aquiva Design System)
├── index.html     # landing (marketing + inscripción real); backstage ⚙ abajo a la derecha
├── app.js         # inscripción real (/api/enroll) + menú backstage
├── account.html   # portal del huésped: ingreso por correo o número HSE
├── account.js     # vista miembro: nivel, estrellas, ofertas con motivo, redención, historia
├── frontdesk.html # consola de recepción (backstage; noindex)
├── frontdesk.js   # búsqueda de huésped, redención 1-clic, simulador de estadía, reset
├── common.js      # formato es-CO + etiquetas en español de los códigos de la API
├── styles.css     # sistema de diseño; variables de marca en :root
├── hero.jpg       # foto de hotelesestelar.com (bar de vinos, Estelar Altamira Ibagué)
├── img/           # logos Estelar (blanco) descargados de hotelesestelar.com
├── logo-wordmark-*.svg  # wordmarks Aquiva (deck)
├── api/           # Vercel Functions (Node puro) — proxy a Salesforce
│   ├── _salesforce.js  # OAuth client credentials (caché) + sfFetch + proxy
│   ├── guest.js        # GET  /api/guest?key=HSE-100001|email
│   ├── guests.js       # GET  /api/guests → selector de demo
│   ├── rewards.js      # GET  /api/rewards?member=
│   ├── stats.js        # GET  /api/stats
│   ├── properties.js   # GET  /api/properties → catálogo de hoteles
│   ├── enroll.js       # POST /api/enroll → alta + 500 estrellas de bienvenida
│   ├── stay.js         # POST /api/stay → estadía (canal Direct/OTA/Partner)
│   ├── spend.js        # POST /api/spend → consumo en el hotel
│   ├── redeem.js       # POST /api/redeem → redención + bono
│   └── reset.js        # POST /api/reset → backstage: restaura al seed
├── README.md
└── CONTEXT.md     # este archivo
```

## Backend real (Salesforce Loyalty)

Navegador → `/api/*` → OAuth **Client Credentials** → Apex REST
`/services/apexrest/estelar/*` (proyecto hermano `/Users/nico/Aquiva/Latam/Estelar`,
prefijo `EST_`, org demo `superaki-demo`, https://aq1784554373641.my.salesforce.com,
compartido con SuperAki, Keralty y Royalton).

- **Contrato**: el mismo JSON que la API de Royalton (mismos nombres de campo).
  Algunos nombres heredados quedaron en inglés y no se tocan: `pointsValueUsd`
  (ahora es valor en **COP**), `points`, `pointsCost`, `welcomePoints`.
- **Códigos que la UI traduce** (`common.js`): canales `Direct` / `OTA` /
  `Partner` → "Directo" / "OTA" / "Convenio / agencia"; categorías de consumo
  `Spa` / `Dining` / `Excursions` → "Spa" / "Restaurante" / "Experiencias";
  estado de bono `Issued` / `Redeemed` / `Expired` → "Vigente" / "Usado" / "Vencido".
- **Niveles**: la API devuelve `Clásico` / `Oro` / `Titanio`; la clase CSS se
  deriva sin tildes (`clasico`, `oro`, `titanio`).
- **Env vars en Vercel**: `SF_LOGIN_URL`, `SF_CLIENT_ID`, `SF_CLIENT_SECRET` de
  una External Client App con Client Credentials y run-as admin.
- Identificación del huésped por correo o número HSE, sin OTP (decisión de POC).

## Reglas del programa (modelo de la demo)

Tomadas de las políticas públicas de siempreestelar.com (nov-2026), salvo lo
marcado como supuesto:
- 1 estrella por cada $1.000 COP facturados (alojamiento y consumos).
- Tarifas de OTA, GDS y agencias **no acumulan** por alojamiento.
- Vencimiento a 18 meses. Redención de noches por categoría de hotel:
  Esencial y Apartamentos 5.000 · Superior 6.000 · Resort y Prime 8.000.
- **Supuestos a confirmar con Estelar**: niveles Clásico / Oro / Titanio con
  umbrales 10 / 25 noches en 12 meses (Titanio existe en HSE; el resto no es
  público), categoría asignada a cada hotel, comisión OTA ~18%, redención de
  experiencias (restaurantes, spa) como propuesta nueva.

## Huéspedes demo (seed del org)

| Huésped | Clave | Historia |
|---|---|---|
| Valentina Restrepo | `HSE-100001` / valentina.restrepo@example.com | Protagonista: Oro, mucha OTA, afinidad gastronómica |
| Andrés Gómez | `HSE-100002` / andres.gomez@example.com | Titanio, todo directo, spa |
| Camila Vargas | `HSE-100003` / camila.vargas@example.com | Clásico con 8 noches → sube a Oro en vivo |
| Jorge Castaño | `HSE-100004` / jorge.castano@example.com | Oro dormido (14 meses sin estadía) → reconquista |
| Lucía Fernández | `HSE-100005` / lucia.fernandez@example.com | Convenio (Bancos Aval) o agencia, Lima |

Reset por huésped: botón ↺ de la consola de recepción (o `POST /api/reset`).

## Marca

Variables CSS en `:root` de `styles.css`, usarlas siempre:
azul Estelar `--navy #0e3064` (color dominante del HTML de hotelesestelar.com),
`--navy-2 #144a7c`, `--navy-deep #071d37`. Tipografías del sitio: **Poppins**
(títulos) + **Lato** (texto). El dorado `--gold #c9a24a` es un acento propio del
POC para "estrellas", no sale del sitio de Estelar.

## El deck

- Aquiva Design System (tokens copiados del deck de Royalton), copy sin
  em-dashes ni emojis, títulos Lexend 300 con un `<em>` rosa.
- Scroll vertical, imprimible a PDF (⌘P). Los badges "● Demo en vivo ↗" son
  links; los de Salesforce (`EST_Guest360`, `EST_ROI`) requieren sesión abierta en el org.
- Solo español (no hay gemela en inglés). Cifras de Estelar: solo las públicas
  (50+ años, 24 hoteles, Colombia y Perú, reglas HSE). Todo lo modelado lleva
  la etiqueta de estimación o "a confirmar".

## Probar en local

```bash
python3 -m http.server 8765 --directory /Users/nico/Aquiva/Latam/estelar-web
# los /api/* solo corren en Vercel (o con vercel dev y las env vars)
```
