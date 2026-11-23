// Utilidades compartidas por el portal y la consola de recepción:
// formato es-CO, etiquetas en español de los códigos que devuelve la API.

const fmt = (n) => Number(n || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });
const money = (n) => '$ ' + fmt(n);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Clase CSS del nivel: "Clásico" → "clasico".
const tierClass = (t) => String(t || 'Clásico').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// La API mantiene los códigos de canal Direct / OTA / Partner.
const CHANNEL_LABEL = { Direct: 'Directo', OTA: 'OTA', Partner: 'Convenio / agencia' };
const channelLabel = (c) => CHANNEL_LABEL[c] || c || '';

// Categorías de consumo en el hotel (códigos de la API → etiqueta).
const CATEGORY_LABEL = {
  Spa: 'Spa', Dining: 'Restaurante', Excursions: 'Experiencias',
  RoomService: 'Room service', Minibar: 'Minibar', Events: 'Eventos',
};
const categoryLabel = (c) => CATEGORY_LABEL[c] || c || 'Consumo en el hotel';
