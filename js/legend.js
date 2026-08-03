// js/legend.js
import { categoryList, categoryLabel } from './vignette.js';

const LINK_TYPES = [
  { type: 'continuite', label: 'Continuité' },
  { type: 'rupture', label: 'Rupture' },
  { type: 'synthese', label: 'Synthèse (lien transversal)' }
];

export function renderLegend(container) {
  container.innerHTML = '';

  const linksSection = document.createElement('div');
  linksSection.className = 'legend-section';
  const linksTitle = document.createElement('h2');
  linksTitle.textContent = 'Types de liens';
  linksSection.appendChild(linksTitle);
  for (const { type, label } of LINK_TYPES) {
    const item = document.createElement('div');
    item.className = 'legend-item';
    const line = document.createElement('span');
    line.className = `legend-line legend-line--${type}`;
    const text = document.createElement('span');
    text.textContent = label;
    item.append(line, text);
    linksSection.appendChild(item);
  }
  container.appendChild(linksSection);

  const catSection = document.createElement('div');
  catSection.className = 'legend-section';
  const catTitle = document.createElement('h2');
  catTitle.textContent = 'Catégories';
  catSection.appendChild(catTitle);
  for (const categorie of categoryList()) {
    const item = document.createElement('div');
    item.className = 'legend-item';
    const swatch = document.createElement('span');
    swatch.className = `legend-swatch vignette--${categorie}`;
    const text = document.createElement('span');
    text.textContent = categoryLabel(categorie);
    item.append(swatch, text);
    catSection.appendChild(item);
  }
  container.appendChild(catSection);
}
