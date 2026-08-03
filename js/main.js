// js/main.js
import { validateData, buildIndex, buildStructuralTree } from './data.js';
import { renderTree } from './tree.js';
import { renderMap } from './map.js';
import { renderTimeline } from './timeline.js';
import { renderPanel } from './panel.js';
import { renderLegend } from './legend.js';
import { categoryLabel } from './vignette.js';

async function init() {
  const raw = await fetch('./data.json').then(r => r.json());
  validateData(raw);
  const index = buildIndex(raw.ecoles);
  const { roots, crossLinks } = buildStructuralTree(raw.ecoles, raw.filiations);

  const treeContainer = document.getElementById('tree-view');
  const mapContainer = document.getElementById('map-view');
  const timelineContainer = document.getElementById('timeline-view');
  const panelContainer = document.getElementById('detail-panel');
  const tabTree = document.getElementById('tab-tree');
  const tabMap = document.getElementById('tab-map');
  const tabChronologie = document.getElementById('tab-chronologie');

  renderLegend(document.getElementById('legend'));

  const state = { view: 'tree' };

  const filterCategorie = document.getElementById('filter-categorie');
  const filterRegion = document.getElementById('filter-region');

  const categories = [...new Set(raw.ecoles.map(e => e.categorie))].sort();
  const regions = [...new Set(raw.ecoles.map(e => e.region))].sort();

  for (const c of categories) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = categoryLabel(c);
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

  const tabs = {
    tree: { button: tabTree, container: treeContainer },
    map: { button: tabMap, container: mapContainer },
    chronologie: { button: tabChronologie, container: timelineContainer }
  };

  function renderActiveView() {
    for (const [key, { button, container }] of Object.entries(tabs)) {
      const active = state.view === key;
      container.hidden = !active;
      button.classList.toggle('view-tab--active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    }

    if (state.view === 'tree') {
      renderTree(treeContainer, { roots, crossLinks, index, filiations: raw.filiations, onSelect: select, filters: state.filters });
    } else if (state.view === 'map') {
      renderMap(mapContainer, { ecoles: raw.ecoles, onSelect: select });
    } else {
      renderTimeline(timelineContainer, { roots, index, filiations: raw.filiations, onSelect: select, filters: state.filters });
    }
  }

  tabTree.addEventListener('click', () => { state.view = 'tree'; renderActiveView(); });
  tabMap.addEventListener('click', () => { state.view = 'map'; renderActiveView(); });
  tabChronologie.addEventListener('click', () => { state.view = 'chronologie'; renderActiveView(); });

  renderActiveView();
}

init();
