// js/main.js
import { validateData, buildIndex, buildStructuralTree } from './data.js';
import { renderTree } from './tree.js';

async function init() {
  const raw = await fetch('./data.json').then(r => r.json());
  validateData(raw);
  const index = buildIndex(raw.ecoles);
  const { roots, crossLinks } = buildStructuralTree(raw.ecoles, raw.filiations);

  const treeContainer = document.getElementById('tree-view');
  renderTree(treeContainer, {
    roots, crossLinks, index, filiations: raw.filiations,
    onSelect: (ecole) => console.log('sélection (panneau en Task 8):', ecole.id)
  });
}

init();
