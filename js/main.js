// js/main.js
import { validateData, buildIndex, buildStructuralTree } from './data.js';
import { renderTree } from './tree.js';
import { renderMap } from './map.js';

async function init() {
  const raw = await fetch('./data.json').then(r => r.json());
  validateData(raw);
  const index = buildIndex(raw.ecoles);
  const { roots, crossLinks } = buildStructuralTree(raw.ecoles, raw.filiations);

  const treeContainer = document.getElementById('tree-view');
  const mapContainer = document.getElementById('map-view');
  const tabTree = document.getElementById('tab-tree');
  const tabMap = document.getElementById('tab-map');

  const state = { view: 'tree' };

  function onSelect(ecole) {
    console.log('sélection (panneau en Task 8):', ecole.id);
  }

  function renderActiveView() {
    if (state.view === 'tree') {
      treeContainer.hidden = false;
      mapContainer.hidden = true;
      tabTree.classList.add('view-tab--active');
      tabMap.classList.remove('view-tab--active');
      tabTree.setAttribute('aria-selected', 'true');
      tabMap.setAttribute('aria-selected', 'false');
      renderTree(treeContainer, { roots, crossLinks, index, filiations: raw.filiations, onSelect });
    } else {
      treeContainer.hidden = true;
      mapContainer.hidden = false;
      tabMap.classList.add('view-tab--active');
      tabTree.classList.remove('view-tab--active');
      tabMap.setAttribute('aria-selected', 'true');
      tabTree.setAttribute('aria-selected', 'false');
      renderMap(mapContainer, { ecoles: raw.ecoles, onSelect });
    }
  }

  tabTree.addEventListener('click', () => { state.view = 'tree'; renderActiveView(); });
  tabMap.addEventListener('click', () => { state.view = 'map'; renderActiveView(); });

  renderActiveView();
}

init();
