const CATEGORY_PARAMS = {
  'industriel': { branchAngleSpread: 12, leafCount: 7, curviness: 0.10 },
  'humain': { branchAngleSpread: 45, leafCount: 9, curviness: 0.60 },
  'systemique': { branchAngleSpread: 60, leafCount: 8, curviness: 0.40 },
  'qualite': { branchAngleSpread: 30, leafCount: 6, curviness: 0.70 },
  'strategique': { branchAngleSpread: 8, leafCount: 4, curviness: 0.15 },
  'agile': { branchAngleSpread: 70, leafCount: 5, curviness: 0.80 },
  'organisationnel-emergent': { branchAngleSpread: 90, leafCount: 6, curviness: 0.90 }
};

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateVignette(id, categorie, size = 64) {
  const params = CATEGORY_PARAMS[categorie];
  if (!params) throw new Error(`categorie inconnue: ${categorie}`);

  const rand = mulberry32(hashSeed(id));
  const cx = size / 2;
  const baseY = size * 0.92;
  const topY = size * 0.10;

  const stemPath = `M ${cx} ${baseY} C ${cx + (rand() - 0.5) * params.curviness * size} ${baseY - size * 0.35}, ${cx - (rand() - 0.5) * params.curviness * size} ${baseY - size * 0.65}, ${cx} ${topY}`;

  let leaves = '';
  for (let i = 0; i < params.leafCount; i++) {
    const t = (i + 1) / (params.leafCount + 1);
    const y = baseY - t * (baseY - topY);
    const side = i % 2 === 0 ? 1 : -1;
    const spread = params.branchAngleSpread * (0.6 + rand() * 0.4);
    const leafLen = size * (0.12 + rand() * 0.08);
    const x1 = cx + side * spread * 0.15;
    const x2 = cx + side * leafLen;
    leaves += `<path d="M ${cx} ${y} Q ${x1} ${y - leafLen * 0.3} ${x2} ${y}" fill="none" stroke="currentColor" stroke-width="1" />`;
  }

  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" class="vignette vignette--${categorie}" data-id="${id}">` +
    `<path d="${stemPath}" fill="none" stroke="currentColor" stroke-width="1.5" />` +
    leaves +
    `</svg>`;
}
