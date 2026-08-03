# Vue Chronologie (frise temporelle) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une troisième vue « Chronologie » à MgtTree : une frise temporelle où la position horizontale de chaque école reflète sa date réelle (`periode.debut`), organisée verticalement en bandes par lignée (racine historique), sans rien changer aux vues Arbre/Carte existantes.

**Architecture:** Un nouveau module pur `js/timeline-layout.js` (testable sous `node`, sans dépendance DOM/D3) calcule l'ordre des écoles par bande (parcours en profondeur) et le domaine temporel de l'axe. Un nouveau module de rendu `js/timeline.js` (D3, comme `js/tree.js`/`js/map.js`) construit le SVG : axe temporel, bandes, marqueurs, liens, libellés — en réutilisant telles quelles `generateVignette` (Task 1 de la v1.1) et `matchesFilters` (`js/data.js`). `js/main.js` gagne un troisième onglet câblé sur le même modèle que Arbre/Carte.

**Tech Stack:** Identique au reste du projet — HTML/CSS/JS vanilla, ES modules, D3 v7 via CDN. Tests de logique pure avec `node`, pas de framework de test.

## Global Constraints

- Pas d'étape de build : ES modules natifs + CDN uniquement.
- Langue de l'interface : français.
- Toutes les tâches s'exécutent dans `C:/Repos/MgtTree`.
- Aucune modification de `js/tree.js`, `js/map.js`, `js/data.js`, `js/vignette.js`, `js/legend.js`, `js/panel.js` : la nouvelle vue consomme leurs interfaces existantes sans les changer.
- Toute donnée injectée dans le DOM doit être échappée (déjà garanti par `.text()` pour les libellés et par un SVG statique sans interpolation de données utilisateur pour les marqueurs, comme dans l'Arbre).
- Accessibilité : contraste sépia/crème conforme WCAG AA, `prefers-reduced-motion` respecté (cette vue n'introduit aucune animation/transition).

---

## Task 1: Logique pure de la frise (`js/timeline-layout.js`)

**Files:**
- Create: `js/timeline-layout.js`
- Create: `tests/timeline-layout.test.mjs`

**Interfaces:**
- Consumes: `roots: Array<{id, children}>` (forme produite par `buildStructuralTree` dans `js/data.js`, déjà utilisée telle quelle par `js/tree.js`).
- Produces:
  - `dfsOrder(node): string[]` — liste des `id`, en parcours en profondeur (préordre : un nœud puis tout son sous-arbre avant le frère suivant).
  - `computeBands(roots): Array<{ rootId: string, ids: string[] }>` — une entrée par racine, `ids` dans l'ordre `dfsOrder`.
  - `computeYearDomain(bands, index, paddingYears = 3): [number, number]` — `[année la plus ancienne, année la plus récente + paddingYears]` sur l'ensemble des écoles des bandes fournies.

- [ ] **Step 1: Écrire les tests (doivent échouer, module inexistant)**

```js
// tests/timeline-layout.test.mjs
import { assertEqual } from './assert.mjs';
import { dfsOrder, computeBands, computeYearDomain } from '../js/timeline-layout.js';

// dfsOrder : un parcours en profondeur garde un sous-arbre groupé avant le
// frère suivant (b et c, enfants/petit-enfant de a, précèdent d).
const tree = { id: 'a', children: [
  { id: 'b', children: [
    { id: 'c', children: [] }
  ] },
  { id: 'd', children: [] }
] };
assertEqual(dfsOrder(tree), ['a', 'b', 'c', 'd'], 'dfsOrder doit grouper un sous-arbre avant le frère suivant');

const leaf = { id: 'x', children: [] };
assertEqual(dfsOrder(leaf), ['x'], 'dfsOrder sur une feuille ne retourne que son propre id');

// computeBands
const roots = [
  { id: 'root1', children: [{ id: 'child1', children: [] }] },
  { id: 'root2', children: [] }
];
assertEqual(
  computeBands(roots),
  [
    { rootId: 'root1', ids: ['root1', 'child1'] },
    { rootId: 'root2', ids: ['root2'] }
  ],
  'computeBands doit produire une entrée par racine avec les ids en ordre dfsOrder'
);

// computeYearDomain
const index = new Map([
  ['root1', { periode: { debut: 1911 } }],
  ['child1', { periode: { debut: 1960 } }],
  ['root2', { periode: { debut: 2001 } }]
]);
const bands = computeBands(roots);
assertEqual(computeYearDomain(bands, index, 3), [1911, 2004], 'computeYearDomain doit retourner [min, max + padding] sur toutes les écoles des bandes');
assertEqual(computeYearDomain(bands, index, 0), [1911, 2001], 'computeYearDomain doit accepter un padding de 0');

console.log('timeline-layout.test.mjs: tous les tests passent');
```

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `node tests/timeline-layout.test.mjs`
Expected: erreur `Cannot find module '../js/timeline-layout.js'`

- [ ] **Step 3: Implémenter `js/timeline-layout.js`**

```js
// js/timeline-layout.js
export function dfsOrder(node) {
  const result = [node.id];
  for (const child of node.children || []) {
    result.push(...dfsOrder(child));
  }
  return result;
}

export function computeBands(roots) {
  return roots.map(root => ({ rootId: root.id, ids: dfsOrder(root) }));
}

export function computeYearDomain(bands, index, paddingYears = 3) {
  const years = bands.flatMap(band => band.ids.map(id => index.get(id).periode.debut));
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years) + paddingYears;
  return [minYear, maxYear];
}
```

- [ ] **Step 4: Relancer les tests, vérifier qu'ils passent**

Run: `node tests/timeline-layout.test.mjs`
Expected: `timeline-layout.test.mjs: tous les tests passent`

- [ ] **Step 5: Commit**

```bash
git add js/timeline-layout.js tests/timeline-layout.test.mjs
git commit -m "feat: logique pure de la frise chronologique (ordre par lignee, domaine temporel)"
```

---

## Task 2: Rendu de la frise (`js/timeline.js`)

**Files:**
- Create: `js/timeline.js`

**Interfaces:**
- Consumes: `computeBands`, `computeYearDomain` (Task 1) ; `generateVignette(categorie, size)` (`js/vignette.js`, déjà en place) ; `matchesFilters(ecole, filters)` (`js/data.js`, déjà en place).
- Produces: `renderTimeline(container: HTMLElement, { roots, index, filiations, onSelect, filters }): void`.

- [ ] **Step 1: Implémenter `js/timeline.js`**

```js
// js/timeline.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { generateVignette } from './vignette.js';
import { matchesFilters } from './data.js';
import { computeBands, computeYearDomain } from './timeline-layout.js';

const ROW_HEIGHT = 56;
const BAND_GAP = 40;
const MARGIN_LEFT = 220;
const MARGIN_RIGHT = 60;
const MARGIN_TOP = 50;
const MARKER_SIZE = 24;
const MAX_LABEL_WIDTH = 180;

export function renderTimeline(container, { roots, index, filiations, onSelect, filters }) {
  container.innerHTML = '';
  const viewportWidth = container.clientWidth || 1200;

  const bands = computeBands(roots);
  const [minYear, maxYear] = computeYearDomain(bands, index, 3);

  const plotWidth = Math.max(viewportWidth - MARGIN_LEFT - MARGIN_RIGHT, 800);
  const xScale = d3.scaleLinear().domain([minYear, maxYear]).range([0, plotWidth]);

  let cursorY = MARGIN_TOP;
  const bandLayouts = bands.map((band) => {
    const top = cursorY;
    const height = band.ids.length * ROW_HEIGHT;
    cursorY = top + height + BAND_GAP;
    return { ...band, top, height };
  });
  const totalHeight = cursorY;
  const totalWidth = MARGIN_LEFT + plotWidth + MARGIN_RIGHT;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`)
    .attr('width', totalWidth)
    .attr('height', totalHeight)
    .attr('class', 'timeline-svg');

  const g = svg.append('g').attr('class', 'timeline-root');
  svg.call(d3.zoom().scaleExtent([0.5, 4]).on('zoom', (event) => g.attr('transform', event.transform)));

  // Axe temporel : un repère par décennie, du plus proche multiple de 10
  // après minYear jusqu'à maxYear.
  const firstDecade = Math.ceil(minYear / 10) * 10;
  const axisG = g.append('g').attr('class', 'timeline-axis');
  for (let year = firstDecade; year <= maxYear; year += 10) {
    const x = MARGIN_LEFT + xScale(year);
    axisG.append('line')
      .attr('class', 'timeline-axis-line')
      .attr('x1', x).attr('x2', x)
      .attr('y1', MARGIN_TOP - 20).attr('y2', totalHeight - BAND_GAP / 2);
    axisG.append('text')
      .attr('class', 'timeline-axis-label')
      .attr('x', x).attr('y', MARGIN_TOP - 26)
      .attr('text-anchor', 'middle')
      .text(year);
  }

  // Bandes : fond alterné + libellé de lignée à gauche.
  const bandGroup = g.append('g');
  for (const [i, band] of bandLayouts.entries()) {
    const rootEcole = index.get(band.rootId);
    bandGroup.append('rect')
      .attr('class', 'timeline-band-bg')
      .classed('timeline-band-bg--alt', i % 2 === 1)
      .attr('x', 0)
      .attr('y', band.top)
      .attr('width', totalWidth)
      .attr('height', band.height);
    bandGroup.append('text')
      .attr('class', 'timeline-band-label')
      .attr('x', 10)
      .attr('y', band.top + band.height / 2)
      .attr('dominant-baseline', 'middle')
      .text(rootEcole.nom);
  }

  // Position de chaque école : x = date réelle, y = rangée fixe dans sa bande.
  const positions = new Map();
  for (const band of bandLayouts) {
    band.ids.forEach((id, i) => {
      const ecole = index.get(id);
      positions.set(id, {
        x: MARGIN_LEFT + xScale(ecole.periode.debut),
        y: band.top + i * ROW_HEIGHT + ROW_HEIGHT / 2
      });
    });
  }

  const linkGen = d3.linkHorizontal().x(p => p.x).y(p => p.y);

  const structuralLinks = filiations.filter(f =>
    (f.type === 'continuite' || f.type === 'rupture') && positions.has(f.de) && positions.has(f.vers));
  g.append('g').selectAll('path')
    .data(structuralLinks)
    .join('path')
    .attr('class', 'tree-link')
    .attr('data-type', f => f.type)
    .attr('d', f => linkGen({ source: positions.get(f.de), target: positions.get(f.vers) }));

  const synthLinks = filiations.filter(f =>
    f.type === 'synthese' && positions.has(f.de) && positions.has(f.vers));
  g.append('g').selectAll('path')
    .data(synthLinks)
    .join('path')
    .attr('class', 'cross-link')
    .attr('d', f => linkGen({ source: positions.get(f.de), target: positions.get(f.vers) }));

  // Nœuds + libellés : même technique de centrage/alternance/troncature que
  // l'Arbre (v1.1, commits 1f18abe/65fa084), reprise ici à l'identique.
  const nodeGroup = g.append('g');
  for (const band of bandLayouts) {
    band.ids.forEach((id, i) => {
      const ecole = index.get(id);
      const p = positions.get(id);
      const nodeEl = nodeGroup.append('g')
        .attr('class', 'tree-node')
        .classed('tree-node--dimmed', filters ? !matchesFilters(ecole, filters) : false)
        .attr('transform', `translate(${p.x}, ${p.y})`)
        .style('cursor', 'pointer')
        .on('click', () => onSelect(ecole));

      nodeEl.append('g')
        .attr('class', 'tree-node-marker')
        .attr('transform', `translate(${-MARKER_SIZE / 2}, ${-MARKER_SIZE / 2})`)
        .html(generateVignette(ecole.categorie, MARKER_SIZE));

      const labelBelow = i % 2 === 0;
      const labelY = labelBelow ? 22 : -16;

      const label = nodeEl.append('text')
        .attr('x', 0)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('class', 'tree-node-label')
        .text(ecole.nom);

      let bbox = label.node().getBBox();
      if (bbox.width > MAX_LABEL_WIDTH) {
        let name = ecole.nom;
        const estimate = Math.max(1, Math.floor(name.length * (MAX_LABEL_WIDTH / bbox.width)) - 1);
        name = name.slice(0, estimate);
        label.text(name + '…');
        bbox = label.node().getBBox();
        while (bbox.width > MAX_LABEL_WIDTH && name.length > 1) {
          name = name.slice(0, -1);
          label.text(name + '…');
          bbox = label.node().getBBox();
        }
        label.append('title').text(ecole.nom);
      }

      nodeEl.insert('rect', '.tree-node-label')
        .attr('class', 'tree-node-label-bg')
        .attr('x', bbox.x - 3)
        .attr('y', bbox.y - 1)
        .attr('width', bbox.width + 6)
        .attr('height', bbox.height + 2);
    });
  }
}
```

- [ ] **Step 2: Vérification syntaxique**

Run: `node --check js/timeline.js`
Expected: aucune sortie (succès).

- [ ] **Step 3: Commit**

```bash
git add js/timeline.js
git commit -m "feat: rendu de la frise chronologique (bandes par lignee, axe temporel)"
```

---

## Task 3: Intégration (onglet, conteneur, style)

**Files:**
- Modify: `index.html`
- Modify: `js/main.js`
- Modify: `style.css`

**Interfaces:**
- Consumes: `renderTimeline` (Task 2).

- [ ] **Step 1: Ajouter l'onglet et le conteneur dans `index.html`**

Remplacer :
```html
    <nav class="view-tabs" role="tablist">
      <button id="tab-tree" class="view-tab view-tab--active" role="tab" aria-selected="true">Arbre</button>
      <button id="tab-map" class="view-tab" role="tab" aria-selected="false">Carte</button>
    </nav>
```
par :
```html
    <nav class="view-tabs" role="tablist">
      <button id="tab-tree" class="view-tab view-tab--active" role="tab" aria-selected="true">Arbre</button>
      <button id="tab-map" class="view-tab" role="tab" aria-selected="false">Carte</button>
      <button id="tab-chronologie" class="view-tab" role="tab" aria-selected="false">Chronologie</button>
    </nav>
```

Remplacer :
```html
  <main class="view-container">
    <section id="tree-view" class="view view--tree"></section>
    <section id="map-view" class="view view--map" hidden></section>
  </main>
```
par :
```html
  <main class="view-container">
    <section id="tree-view" class="view view--tree"></section>
    <section id="map-view" class="view view--map" hidden></section>
    <section id="timeline-view" class="view view--timeline" hidden></section>
  </main>
```

- [ ] **Step 2: Remplacer `js/main.js` en entier**

```js
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
```

(Ce remplacement introduit un objet `tabs` qui factorise la bascule d'onglets, commune aux 3 vues, plutôt que de dupliquer le bloc de 6 lignes de bascule une troisième fois.)

- [ ] **Step 3: Ajouter les styles dans `style.css`**

Après le bloc `.map-country`/`.map-sphere` (juste avant `.vignette-shape`) :

```css
.timeline-svg { display: block; width: auto; height: auto; }
.timeline-axis-line { stroke: var(--ink-sepia-soft); stroke-width: 1; stroke-dasharray: 1 3; opacity: 0.5; }
.timeline-axis-label { font-family: 'JetBrains Mono', monospace; font-size: 11px; fill: var(--ink-sepia-soft); }
.timeline-band-bg { fill: transparent; }
.timeline-band-bg--alt { fill: rgba(91, 58, 41, 0.035); }
.timeline-band-label { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 0.85rem; fill: var(--ink-sepia); }
```

- [ ] **Step 4: Vérification manuelle**

Lancer `python3 -m http.server 8000`, ouvrir `http://localhost:8000/`. Vérifier : le nouvel onglet « Chronologie » apparaît, sans casser Arbre/Carte. Cliquer dessus : une frise avec graduations par décennie, 5 bandes horizontales libellées (Taylor, Fayol, Weber, Scrum, Extreme Programming) s'affiche, chaque école positionnée approximativement à la bonne date.

- [ ] **Step 5: Commit**

```bash
git add index.html js/main.js style.css
git commit -m "feat: integre l'onglet Chronologie (arbre/carte/chronologie)"
```

---

## Task 4: Vérification finale

**Files:** aucun fichier nouveau — vérification transverse.

- [ ] **Step 1: Exécuter tous les tests de logique pure**

Run (depuis `C:/Repos/MgtTree`) :
```bash
node tests/data.test.mjs
node tests/vignette.test.mjs
node tests/validate-data.mjs
node tests/timeline-layout.test.mjs
```
Expected: les quatre commandes affichent leur message de succès, sans exception.

- [ ] **Step 2: Vérification manuelle bout en bout dans un vrai navigateur**

Depuis `http://localhost:8000/`, onglet Chronologie :
- Vérifier qu'aucun libellé ne chevauche un autre (utiliser le même script de collision exhaustif que pour l'Arbre : lire `getBoundingClientRect()` de chaque `.tree-node-label` et vérifier qu'aucune paire ne se recouvre).
- Vérifier que l'ordre horizontal des écoles, au sein d'une même bande, correspond bien à l'ordre croissant de leurs dates (comparer visuellement quelques paires, ex. dans la bande Taylor : Taylorisme doit être à gauche de Fordisme, lui-même à gauche du Toyotisme-lean).
- Vérifier que les 46 écoles sont bien présentes (comparer au texte de la page, comme pour l'Arbre).
- Cliquer un nœud dans chaque bande : le panneau de détail s'ouvre avec le bon contenu.
- Activer un filtre catégorie puis région : l'estompage fonctionne comme dans l'Arbre.
- Vérifier l'absence d'erreur dans la console du navigateur.
- Si des ajustements de constantes (`ROW_HEIGHT`, `MAX_LABEL_WIDTH`, marges) s'avèrent nécessaires suite à cette vérification, les appliquer directement dans `js/timeline.js` et revérifier — comme cela a été fait pour l'Arbre pendant la v1.1.

- [ ] **Step 3: Commit final (si des ajustements ont été faits pendant la QA)**

```bash
git add -A
git commit -m "fix: ajustements issus de la verification de la vue Chronologie"
```

(Ne committer que s'il y a effectivement des changements — sinon, cette étape est un no-op.)
