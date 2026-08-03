// js/main.js
import { validateData, buildIndex, buildStructuralTree } from './data.js';
import { renderTree } from './tree.js';
import { renderMap } from './map.js';
import { renderPanel } from './panel.js';
import { renderLegend } from './legend.js';

async function init() {
  const raw = await fetch('./data.json').then(r => r.json());
  validateData(raw);
  const index = buildIndex(raw.ecoles);
  const { roots, crossLinks } = buildStructuralTree(raw.ecoles, raw.filiations);

  const treeContainer = document.getElementById('tree-view');
  const mapContainer = document.getElementById('map-view');
  const panelContainer = document.getElementById('detail-panel');
  const tabTree = document.getElementById('tab-tree');
  const tabMap = document.getElementById('tab-map');

  renderLegend(document.getElementById('legend'));

  const state = { view: 'tree' };

  const filterCategorie = document.getElementById('filter-categorie');
  const filterRegion = document.getElementById('filter-region');

  const categories = [...new Set(raw.ecoles.map(e => e.categorie))].sort();
  const regions = [...new Set(raw.ecoles.map(e => e.region))].sort();

  for (const c of categories) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    filterCategorie.appendChild(opt);
  }
  for (const r of regions) {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    filterRegion.appendChild(opt);
  }

  state.filters = { categorie: '', region: '' };

  filterCategorie.addEventListener('change', () => {
    state.filters.categorie = filterCategorie.value;
    renderActiveView();
  });
  filterRegion.addEventListener('change', () => {
    state.filters.region = filterRegion.value;
    renderActiveView();
  });

  function filiationsFrom(id) {
    return raw.filiations
      .filter(f => f.de === id || f.vers === id)
      .map(f => index.get(f.de === id ? f.vers : f.de));
  }

  function select(idOrEcole) {
    const ecole = typeof idOrEcole === 'string' || idOrEcole === null
      ? (idOrEcole ? index.get(idOrEcole) : null)
      : idOrEcole;
    renderPanel(panelContainer, ecole, { onNavigate: select, filiationsFrom });
  }

  function renderActiveView() {
    if (state.view === 'tree') {
      treeContainer.hidden = false;
      mapContainer.hidden = true;
      tabTree.classList.add('view-tab--active');
      tabMap.classList.remove('view-tab--active');
      tabTree.setAttribute('aria-selected', 'true');
      tabMap.setAttribute('aria-selected', 'false');
      renderTree(treeContainer, { roots, crossLinks, index, filiations: raw.filiations, onSelect: select, filters: state.filters });
    } else {
      treeContainer.hidden = true;
      mapContainer.hidden = false;
      tabMap.classList.add('view-tab--active');
      tabTree.classList.remove('view-tab--active');
      tabMap.setAttribute('aria-selected', 'true');
      tabTree.setAttribute('aria-selected', 'false');
      renderMap(mapContainer, { ecoles: raw.ecoles, onSelect: select });
    }
  }

  tabTree.addEventListener('click', () => { state.view = 'tree'; renderActiveView(); });
  tabMap.addEventListener('click', () => { state.view = 'map'; renderActiveView(); });

  renderActiveView();
}

init();
