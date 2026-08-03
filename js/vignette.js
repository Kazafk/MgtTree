// js/vignette.js
const CATEGORY_LABELS = {
  'industriel': 'Industriel',
  'humain': 'Humain',
  'systemique': 'Systémique',
  'qualite': 'Qualité',
  'strategique': 'Stratégique',
  'agile': 'Agile',
  'organisationnel-emergent': 'Organisationnel émergent'
};

export function categoryList() {
  return Object.keys(CATEGORY_LABELS);
}

export function categoryLabel(categorie) {
  return CATEGORY_LABELS[categorie];
}

export function generateVignette(id, categorie, size = 64) {
  if (!CATEGORY_LABELS[categorie]) throw new Error(`categorie inconnue: ${categorie}`);

  const half = size / 2;
  const inset = size * 0.08;
  const points = `${half},${inset} ${size - inset},${half} ${half},${size - inset} ${inset},${half}`;

  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="vignette vignette--${categorie}" data-id="${id}">` +
    `<polygon points="${points}" class="vignette-shape" />` +
    `</svg>`;
}
