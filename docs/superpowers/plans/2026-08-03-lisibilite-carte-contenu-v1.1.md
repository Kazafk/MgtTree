# Lisibilité arbre, précision carte, légende et extension du dataset — v1.1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger quatre défauts de la v1 remontés par l'utilisateur — arbre illisible (chevauchements), symboles de nœud trop complexes, absence de légende, marqueurs de carte mal centrés (décalage sud-est visible sur les écoles britanniques/japonaises) — et enrichir le dataset avec trois écoles manquantes et sourcées (Chine, Corée du Sud, Inde).

**Architecture:** Aucun changement d'architecture : toujours un site statique sans build, ES modules natifs, D3 v7 via CDN. `js/vignette.js` passe d'un générateur botanique paramétrique à un marqueur en losange simple, coloré par catégorie via de nouvelles variables CSS `--cat-*`. `js/tree.js` et `js/map.js` centrent désormais ce marqueur sur son point d'ancrage (correction du bug de décalage). Un nouveau module `js/legend.js` affiche un encart fixe listant types de liens et catégories, en réutilisant `categoryList`/`categoryLabel` exportés par `js/vignette.js` (source unique de vérité, pas de duplication de la liste des catégories).

**Tech Stack:** Identique à la v1 — HTML/CSS/JS vanilla, ES modules, D3 v7 (`d3-hierarchy`, `d3-geo`, `d3-zoom`, `d3-selection`), `topojson-client`, `world-atlas@2`. Tests de logique pure avec `node`, pas de framework de test.

## Global Constraints

- Pas d'étape de build : ES modules natifs + CDN uniquement.
- Langue de l'interface : français.
- Toutes les tâches s'exécutent dans `C:/Repos/MgtTree`.
- Un nœud (`ecole`) a exactement un parent structurant (filiation `continuite` ou `rupture`) ; les filiations `synthese` sont des liens transversaux hors calcul de layout.
- Toute donnée injectée dans le DOM doit être échappée (déjà garanti par `d3.select(...).text(...)` pour les libellés, et par des `polygon`/`svg` statiques sans interpolation de données utilisateur pour les marqueurs).
- Chaque école doit citer au moins une source vérifiable — pas de contenu inventé sans référence.
- Accessibilité : contraste sépia/crème conforme WCAG AA, `prefers-reduced-motion` respecté.

---

## Task 1: Marqueur simplifié (losange) coloré par catégorie, centré sur son point d'ancrage

**Files:**
- Modify: `js/vignette.js`
- Modify: `tests/vignette.test.mjs`
- Modify: `js/tree.js`
- Modify: `js/map.js`
- Modify: `style.css`

**Interfaces:**
- Produces: `generateVignette(id: string, categorie: string, size = 64): string` (signature inchangée, contenu simplifié) ; `categoryList(): string[]` ; `categoryLabel(categorie: string): string` — nouvellement exportées, consommées par Task 3 (légende).
- Consumes (Task 3): `categoryList`, `categoryLabel`.

- [ ] **Step 1: Réécrire les tests de `js/vignette.js` (TDD — ils doivent échouer avant l'implémentation)**

```js
// tests/vignette.test.mjs
import { assertEqual, assertThrows } from './assert.mjs';
import { generateVignette, categoryLabel, categoryList } from '../js/vignette.js';

const a = generateVignette('taylorisme', 'industriel', 48);
assertEqual(a.includes('<svg'), true, 'doit produire un élément svg');
assertEqual(a.includes('width="48"'), true, 'doit respecter la taille demandée');
assertEqual(a.includes('vignette--industriel'), true, 'la classe CSS doit refléter la categorie');

const b = generateVignette('agile-manifeste', 'agile', 48);
assertEqual(a === b, false, 'des categories différentes doivent produire des marquages différents');
assertEqual(b.includes('vignette--agile'), true, 'la classe CSS doit refléter la categorie');

assertThrows(() => generateVignette('x', 'inconnue'), 'doit rejeter une categorie non supportée');

assertEqual(categoryList().length, 7, 'categoryList doit retourner les 7 categories');
assertEqual(categoryList().includes('agile'), true, 'categoryList doit inclure "agile"');
assertEqual(categoryLabel('organisationnel-emergent'), 'Organisationnel émergent', 'categoryLabel doit retourner le libellé lisible');
assertThrows(() => { if (categoryLabel('inconnue') === undefined) throw new Error('undefined'); }, 'categoryLabel(inconnue) doit être undefined (pas de libellé)');

console.log('vignette.test.mjs: tous les tests passent');
```

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `node tests/vignette.test.mjs`
Expected: échec (`categoryLabel`/`categoryList` non exportés par l'implémentation actuelle, ou assertions sur le contenu SVG en défaut).

- [ ] **Step 3: Réimplémenter `js/vignette.js`**

```js
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
```

- [ ] **Step 4: Relancer les tests, vérifier qu'ils passent**

Run: `node tests/vignette.test.mjs`
Expected: `vignette.test.mjs: tous les tests passent`

- [ ] **Step 5: Ajouter la palette de couleurs par catégorie dans `style.css`**

Dans le bloc `:root`, après `--rupture: #8E3B1C;` :

```css
  --cat-industriel: #8C5A2B;
  --cat-humain: #A13F4C;
  --cat-systemique: #3E6E8E;
  --cat-qualite: #6B7A2E;
  --cat-strategique: #6B4E8E;
  --cat-agile: #2E8E74;
  --cat-organisationnel-emergent: #C08A2E;
```

Après le bloc `.map-marker { color: var(--moss); }`, ajouter :

```css
.vignette-shape { fill: currentColor; stroke: var(--ink-sepia); stroke-width: 1; }
.vignette--industriel { color: var(--cat-industriel); }
.vignette--humain { color: var(--cat-humain); }
.vignette--systemique { color: var(--cat-systemique); }
.vignette--qualite { color: var(--cat-qualite); }
.vignette--strategique { color: var(--cat-strategique); }
.vignette--agile { color: var(--cat-agile); }
.vignette--organisationnel-emergent { color: var(--cat-organisationnel-emergent); }
```

- [ ] **Step 6: Centrer le marqueur sur son point d'ancrage dans `js/map.js`**

Remplacer les lignes qui créent le marqueur (actuellement `marker.html(generateVignette(ecole.id, ecole.categorie, 20));`) — fichier complet attendu après modification :

```js
// js/map.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { feature } from 'https://cdn.jsdelivr.net/npm/topojson-client@3/+esm';
import { generateVignette } from './vignette.js';

const MARKER_SIZE = 18;

export async function renderMap(container, { ecoles, onSelect }) {
  container.innerHTML = '';
  const width = container.clientWidth || 1200;
  const height = container.clientHeight || 800;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('class', 'map-svg');

  const g = svg.append('g');
  svg.call(d3.zoom().scaleExtent([1, 6]).on('zoom', (event) => g.attr('transform', event.transform)));

  const projection = d3.geoNaturalEarth1().fitSize([width, height], { type: 'Sphere' });
  const path = d3.geoPath(projection);

  g.append('path').datum({ type: 'Sphere' }).attr('class', 'map-sphere').attr('d', path);

  const world = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json());
  const countries = feature(world, world.objects.countries);

  g.append('g').selectAll('path')
    .data(countries.features)
    .join('path')
    .attr('class', 'map-country')
    .attr('d', path);

  const markerGroup = g.append('g');
  for (const ecole of ecoles) {
    const p = projection([ecole.coords.lon, ecole.coords.lat]);
    if (!p) continue;
    const marker = markerGroup.append('g')
      .attr('class', 'map-marker')
      .attr('transform', `translate(${p[0]}, ${p[1]})`)
      .style('cursor', 'pointer')
      .on('click', () => onSelect(ecole));
    marker.append('g')
      .attr('transform', `translate(${-MARKER_SIZE / 2}, ${-MARKER_SIZE / 2})`)
      .html(generateVignette(ecole.id, ecole.categorie, MARKER_SIZE));
  }
}
```

Le point projeté `p` reste le centre du marqueur (`translate(p[0], p[1])` sur le groupe externe) ; le sous-groupe interne décale le SVG de moitié de sa taille dans les deux axes avant d'y injecter le losange, pour que ce soit bien le **centre** du losange — pas son coin supérieur gauche — qui coïncide avec les coordonnées géographiques.

- [ ] **Step 7: Vérification manuelle de la carte**

Lancer `python3 -m http.server 8000`, ouvrir `http://localhost:8000/`, onglet Carte. Vérifier : le marqueur de « Théorie de la contingence » (Royaume-Uni) tombe sur l'Angleterre, pas sur la France ; les marqueurs japonais (Kaizen, TQM, Toyotisme) tombent sur l'archipel, pas dans le Pacifique ; les marqueurs allemands (Bureaucratie wébérienne, Mittelstand) et néerlandais (Sociocratie, Management 3.0) sont bien visibles à leur place.

- [ ] **Step 8: Centrer et simplifier le marqueur dans `js/tree.js`**

Remplacer le bloc qui insère la vignette (actuellement `nodeEl.html(generateVignette(ecole.id, ecole.categorie, 40));`) par :

```js
    const MARKER_SIZE = 24;
    nodeEl.append('g')
      .attr('class', 'tree-node-marker')
      .attr('transform', `translate(${-MARKER_SIZE / 2}, ${-MARKER_SIZE / 2})`)
      .html(generateVignette(ecole.id, ecole.categorie, MARKER_SIZE));
```

(`MARKER_SIZE` est déclaré une fois avant la boucle `for (const [id, d] of nodesById)`, pas à chaque itération — voir Task 2 Step 1 pour le fichier complet, qui inclut ce changement en même temps que le fix de lisibilité des libellés.)

- [ ] **Step 9: Commit**

```bash
git add js/vignette.js tests/vignette.test.mjs js/map.js style.css
git commit -m "fix: marqueur losange simple colore par categorie, centre sur son point d'ancrage"
```

(Le commit de `js/tree.js` se fait à la fin de la Task 2, qui modifie le même fichier.)

---

## Task 2: Lisibilité de l'arbre — libellés qui ne se chevauchent plus

**Files:**
- Modify: `js/tree.js`
- Modify: `style.css`

**Interfaces:**
- Consumes: `generateVignette` (Task 1), `matchesFilters` (déjà existant dans `js/data.js`).
- Produces: aucune nouvelle interface publique — `renderTree` garde exactement la même signature.

**Diagnostic (pour comprendre le changement) :** deux causes cumulées faisaient chevaucher les libellés :
1. `nodeEl.html(generateVignette(...))` insérait le marqueur sans le centrer (coin haut-gauche sur le point d'ancrage) — corrigé en Task 1.
2. `const labelBelow = d.depth % 2 === 0;` alterne uniquement selon la **profondeur**, pas selon la position parmi les frères : à une profondeur donnée, tous les nœuds frères reçoivent le même côté (tous au-dessus ou tous en-dessous), donc leurs libellés s'empilent au même endroit avec seulement 34px d'écart vertical. C'était nécessaire pour désenchevêtrer les chaînes à enfant unique (l'alternance par profondeur reste utile pour ce cas), mais insuffisant pour les nœuds à fratrie nombreuse (ex. les ~7 enfants de `taylorisme`).

- [ ] **Step 1: Remplacer `js/tree.js` en entier**

```js
// js/tree.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { generateVignette } from './vignette.js';
import { matchesFilters } from './data.js';

export function renderTree(container, { roots, crossLinks, index, filiations, onSelect, filters }) {
  container.innerHTML = '';
  const viewportWidth = container.clientWidth || 1200;
  const viewportHeight = container.clientHeight || 800;

  // Espacement fixe par nœud (plutôt qu'une largeur/hauteur totale partagée
  // entre racines) : une sous-branche dense (ex. Taylor, ~30 descendants,
  // profonde de plusieurs niveaux) ne doit pas être compressée dans le même
  // espace qu'une sous-branche courte (ex. Weber, ~3 descendants). Chaque
  // racine reçoit exactement la largeur/hauteur dont elle a besoin ; le
  // canevas grandit en conséquence et défile (en plus du zoom/pan existant).
  const NODE_GAP = 44;
  const LEVEL_GAP = 190;
  const COLUMN_GAP = 80;
  const MARGIN = 60;
  const MARKER_SIZE = 24;

  let cursorX = MARGIN;
  let maxRequiredHeight = viewportHeight;
  const rootLayouts = roots.map((rootData) => {
    const root = d3.hierarchy(rootData);
    d3.tree().nodeSize([NODE_GAP, LEVEL_GAP])(root);

    const xs = root.descendants().map(d => d.x);
    const ys = root.descendants().map(d => d.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMax = Math.max(...ys);

    const requiredHeight = (xMax - xMin) + MARGIN * 2;
    if (requiredHeight > maxRequiredHeight) maxRequiredHeight = requiredHeight;

    const columnOffset = cursorX;
    root.each(d => {
      d.x = d.x - xMin + MARGIN;
      d.y = d.y + columnOffset;
    });
    cursorX = columnOffset + yMax + LEVEL_GAP + COLUMN_GAP;
    return root;
  });

  const totalWidth = Math.max(viewportWidth, cursorX);

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${totalWidth} ${maxRequiredHeight}`)
    .attr('width', totalWidth)
    .attr('height', maxRequiredHeight)
    .attr('class', 'tree-svg');

  const g = svg.append('g').attr('class', 'tree-root');

  svg.call(d3.zoom().scaleExtent([0.3, 3]).on('zoom', (event) => g.attr('transform', event.transform)));

  const nodesById = new Map();
  for (const root of rootLayouts) {
    for (const d of root.descendants()) nodesById.set(d.data.id, d);

    const linkGen = d3.linkHorizontal().x(d => d.y).y(d => d.x);
    g.append('g').selectAll('path')
      .data(root.links())
      .join('path')
      .attr('class', 'tree-link')
      .attr('d', linkGen)
      .attr('data-type', d => filiations.find(f => f.de === d.source.data.id && f.vers === d.target.data.id)?.type || 'continuite');
  }

  const crossLinkGen = d3.linkHorizontal().x(d => d.y).y(d => d.x);
  g.append('g').selectAll('path')
    .data(crossLinks.filter(c => nodesById.has(c.de) && nodesById.has(c.vers)))
    .join('path')
    .attr('class', 'cross-link')
    .attr('d', c => crossLinkGen({ source: nodesById.get(c.de), target: nodesById.get(c.vers) }));

  const nodeGroup = g.append('g');
  for (const [id, d] of nodesById) {
    const ecole = index.get(id);
    const nodeEl = nodeGroup.append('g')
      .attr('class', 'tree-node')
      .classed('tree-node--dimmed', filters ? !matchesFilters(ecole, filters) : false)
      .attr('transform', `translate(${d.y}, ${d.x})`)
      .style('cursor', 'pointer')
      .on('click', () => onSelect(ecole));

    nodeEl.append('g')
      .attr('class', 'tree-node-marker')
      .attr('transform', `translate(${-MARKER_SIZE / 2}, ${-MARKER_SIZE / 2})`)
      .html(generateVignette(ecole.id, ecole.categorie, MARKER_SIZE));

    // Alterner selon la profondeur ET la position parmi les frères : la
    // profondeur seule désenchevêtre les chaînes à enfant unique (chaque
    // niveau change de côté), la position parmi les frères désenchevêtre
    // les fratries nombreuses au même niveau (chaque frère change de côté).
    // Utiliser un seul des deux critères laissait l'autre cas se chevaucher.
    const siblingIndex = d.parent ? d.parent.children.indexOf(d) : 0;
    const labelBelow = (d.depth + siblingIndex) % 2 === 0;
    const labelY = labelBelow ? 30 : -18;

    const label = nodeEl.append('text')
      .attr('x', 0)
      .attr('y', labelY)
      .attr('text-anchor', 'middle')
      .attr('class', 'tree-node-label')
      .text(ecole.nom);

    const bbox = label.node().getBBox();
    nodeEl.insert('rect', '.tree-node-label')
      .attr('class', 'tree-node-label-bg')
      .attr('x', bbox.x - 3)
      .attr('y', bbox.y - 1)
      .attr('width', bbox.width + 6)
      .attr('height', bbox.height + 2);
  }
}
```

- [ ] **Step 2: Ajouter le style du fond de libellé dans `style.css`**

Après `.tree-node--dimmed { opacity: 0.25; }` :

```css
.tree-node-label-bg { fill: var(--paper); opacity: 0.88; }
```

- [ ] **Step 3: Vérification manuelle**

Recharger `http://localhost:8000/`. Vérifier : les ~7 enfants directs de « Organisation scientifique du travail » (Taylor) ne se chevauchent plus — chaque libellé alterne au-dessus/en-dessous de son nœud et reste lisible même quand deux nœuds voisins sont proches ; les chaînes longues à enfant unique (ex. Fayol → MBO → Planification stratégique → Porter) restent également désenchevêtrées ; le losange de chaque nœud est bien centré sur le point de jonction des branches (plus de décalage).

- [ ] **Step 4: Commit**

```bash
git add js/tree.js style.css
git commit -m "fix: desenchevetrement des libelles de l'arbre (alternance par frere + profondeur, fond papier)"
```

---

## Task 3: Légende (types de liens et catégories)

**Files:**
- Create: `js/legend.js`
- Modify: `index.html`
- Modify: `js/main.js`
- Modify: `style.css`

**Interfaces:**
- Consumes: `categoryList`, `categoryLabel` (Task 1, `js/vignette.js`).
- Produces: `renderLegend(container: HTMLElement): void`.

- [ ] **Step 1: Créer `js/legend.js`**

```js
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
```

- [ ] **Step 2: Ajouter le conteneur dans `index.html`**

Remplacer la ligne `<aside id="detail-panel" class="panel" aria-live="polite"></aside>` par :

```html
  <aside id="detail-panel" class="panel" aria-live="polite"></aside>
  <aside id="legend" class="legend" aria-label="Légende"></aside>
```

- [ ] **Step 3: Brancher la légende dans `js/main.js`**

Ajouter l'import en haut du fichier :

```js
import { renderLegend } from './legend.js';
```

Ajouter, juste après la ligne `const tabMap = document.getElementById('tab-map');` :

```js
  renderLegend(document.getElementById('legend'));
```

- [ ] **Step 4: Ajouter les styles de la légende dans `style.css`**

À la fin du fichier, avant le bloc `@media (prefers-reduced-motion: reduce)` :

```css
.legend {
  position: fixed;
  left: 1rem;
  bottom: 1rem;
  z-index: 5;
  background: var(--paper-deep);
  border: 1px solid var(--ink-sepia-soft);
  border-radius: 3px;
  padding: 0.75rem 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--ink-sepia);
  max-width: min(260px, 80vw);
  max-height: 45vh;
  overflow-y: auto;
}
.legend h2 {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 0.85rem;
  margin: 0 0 0.4rem;
}
.legend-section + .legend-section { margin-top: 0.6rem; }
.legend-item { display: flex; align-items: center; gap: 0.4rem; margin: 0.2rem 0; }
.legend-swatch { flex: none; width: 12px; height: 12px; background: currentColor; border-radius: 2px; }
.legend-line { flex: none; width: 20px; height: 0; border-top-width: 2px; }
.legend-line--continuite { border-top-style: solid; border-top-color: var(--ink-sepia-soft); }
.legend-line--rupture { border-top-style: dashed; border-top-color: var(--rupture); }
.legend-line--synthese { border-top-style: dotted; border-top-color: var(--moss-soft); }

@media (max-width: 480px) {
  .legend { font-size: 0.65rem; padding: 0.5rem 0.75rem; max-width: 70vw; max-height: 35vh; }
}
```

- [ ] **Step 5: Vérification manuelle**

Recharger la page. Vérifier : un encart apparaît en bas à gauche avec « Types de liens » (3 lignes : trait plein, tirets rouille, pointillés vert mousse) et « Catégories » (7 losanges colorés avec libellé), lisible sur les deux onglets Arbre et Carte, sans bloquer les interactions (zoom/pan, clic sur un nœud).

- [ ] **Step 6: Commit**

```bash
git add js/legend.js index.html js/main.js style.css
git commit -m "feat: legende des types de liens et des categories"
```

---

## Task 4: Extension du dataset — Chine, Corée du Sud, Inde

**Files:**
- Modify: `data.json`

**Interfaces:**
- Consumes: schéma défini par `validateData` (`js/data.js`, inchangé).

**Sources vérifiées pour cette tâche :**
- Rendanheyi (Haier, Chine) : Hamel, G., & Zanini, M. (2018). « The End of Bureaucracy ». *Harvard Business Review*, 96(6). — Frynas, J. G., Mol, M. J., & Mellahi, K. (2018). « Management Innovation Made in China: Haier's Rendanheyi ». *California Management Review*, 61(1), 71-93.
- Samsung Way (Corée du Sud) : Song, J., & Lee, K. (2014). *The Samsung Way: Transformational Management Strategies from the World Leader in Innovation and Design*. McGraw-Hill Education. (Jaeyong Song et Kyungmook Lee, professeurs à la Seoul National University Business School.)
- Jugaad Innovation (Inde) : Radjou, N., Prabhu, J., & Ahuja, S. (2012). *Jugaad Innovation: Think Frugal, Be Flexible, Generate Breakthrough Growth*. Jossey-Bass. — Radjou, N., & Prabhu, J. (2010). « Jugaad: A New Growth Formula for Corporate America ». *Harvard Business Review*.

- [ ] **Step 1: Ajouter les 3 fiches `ecoles`**

Dans `data.json`, insérer ces trois objets juste avant le `]` qui ferme le tableau `ecoles` (juste après l'objet `travail-distribue-post-covid`, en ajoutant une virgule après son accolade fermante `}`) :

```json
    {
      "id": "rendanheyi",
      "nom": "Rendanheyi (modèle Haier)",
      "auteurs": ["Zhang Ruimin"],
      "categorie": "organisationnel-emergent",
      "region": "Chine",
      "periode": { "debut": 2005, "fin": null },
      "coords": { "lat": 36.0671, "lon": 120.3826 },
      "logique": "Zhang Ruimin démantèle la structure pyramidale du groupe Haier au profit de milliers de micro-entreprises autonomes, chacune directement responsable devant un besoin client identifié : le terme « rendanheyi » (littéralement « l'unité de l'homme et de la valeur ») désigne cette fusion entre la personne (ren) et la valeur créée pour l'utilisateur (dan). Le modèle supprime les strates hiérarchiques intermédiaires en reliant chaque équipe directement à un marché plutôt qu'à une chaîne de commandement interne.",
      "sources": ["Hamel, G., & Zanini, M. (2018). The End of Bureaucracy. Harvard Business Review, 96(6).", "Frynas, J. G., Mol, M. J., & Mellahi, K. (2018). Management Innovation Made in China: Haier's Rendanheyi. California Management Review, 61(1), 71-93."]
    },
    {
      "id": "samsung-way",
      "nom": "Samsung Way",
      "auteurs": ["Lee Kun-hee"],
      "categorie": "qualite",
      "region": "Corée du Sud",
      "periode": { "debut": 1993, "fin": null },
      "coords": { "lat": 37.2636, "lon": 127.0286 },
      "logique": "À partir de 1993, le président Lee Kun-hee lance la « New Management Initiative » pour transformer Samsung d'un fabricant à bas coût en leader mondial de l'innovation et du design, en greffant des pratiques de gestion occidentales sur un système industriel hérité du contrôle qualité japonais. Cette synthèse hybride articule exigence de qualité totale, investissement massif en R&D et culture de la vitesse d'exécution propre aux chaebols coréens.",
      "citation_cle": "« Changez tout, sauf votre femme et vos enfants. » (Lee Kun-hee, 1993)",
      "sources": ["Song, J., & Lee, K. (2014). The Samsung Way: Transformational Management Strategies from the World Leader in Innovation and Design. McGraw-Hill Education."]
    },
    {
      "id": "jugaad-innovation",
      "nom": "Jugaad Innovation",
      "auteurs": ["Navi Radjou", "Jaideep Prabhu", "Simone Ahuja"],
      "categorie": "agile",
      "region": "Inde",
      "periode": { "debut": 2012, "fin": null },
      "coords": { "lat": 20.5937, "lon": 78.9629 },
      "logique": "Radjou, Prabhu et Ahuja théorisent le « jugaad », terme hindi désignant l'art de contourner des contraintes sévères de ressources par une improvisation ingénieuse, comme un principe d'innovation frugale généralisable aux entreprises occidentales. Plutôt qu'un cycle d'innovation planifié et coûteux, cette approche valorise la flexibilité, l'expérimentation rapide sur le terrain et la simplicité de conception pour produire des solutions suffisamment bonnes à moindre coût.",
      "sources": ["Radjou, N., Prabhu, J., & Ahuja, S. (2012). Jugaad Innovation: Think Frugal, Be Flexible, Generate Breakthrough Growth. Jossey-Bass.", "Radjou, N., & Prabhu, J. (2010). Jugaad: A New Growth Formula for Corporate America. Harvard Business Review."]
    }
```

- [ ] **Step 2: Ajouter les 3 filiations structurantes**

Dans le tableau `filiations`, juste après la ligne `{ "de": "fayolisme", "vers": "mittelstand-allemand", "type": "rupture" },` (dans la section des filiations structurantes, avant les `synthese`) :

```json
    { "de": "bureaucratie-weberienne", "vers": "rendanheyi", "type": "rupture" },
    { "de": "qualite-totale-tqm", "vers": "samsung-way", "type": "continuite" },
    { "de": "lean-startup", "vers": "jugaad-innovation", "type": "rupture" },
```

- [ ] **Step 3: Ajouter la filiation `synthese` Samsung Way ↔ Keiretsu**

Dans le tableau `filiations`, à la fin de la section `synthese` (après la ligne `{ "de": "strategie-emergente-mintzberg", "vers": "capitalisme-parties-prenantes", "type": "synthese" }`, en ajoutant une virgule après cette ligne) :

```json
    { "de": "keiretsu-japonais", "vers": "samsung-way", "type": "synthese" }
```

- [ ] **Step 4: Valider le dataset étendu**

Run: `node tests/validate-data.mjs`
Expected: `OK — 46 écoles, 53 filiations, 3 racines` (aucune exception)

- [ ] **Step 5: Commit**

```bash
git add data.json
git commit -m "content: ajoute Rendanheyi (Chine), Samsung Way (Coree du Sud), Jugaad Innovation (Inde)"
```

---

## Task 5: Vérification finale

**Files:** aucun fichier nouveau — vérification transverse.

- [ ] **Step 1: Exécuter tous les tests de logique pure**

Run (depuis `C:/Repos/MgtTree`) :
```bash
node tests/data.test.mjs
node tests/vignette.test.mjs
node tests/validate-data.mjs
```
Expected: les trois commandes affichent leur message de succès, sans exception.

- [ ] **Step 2: Vérification manuelle bout en bout**

Depuis `http://localhost:8000/` :
- Vue Arbre : vérifier qu'aucun libellé ne recouvre un autre libellé de façon à le rendre illisible, y compris dans la branche dense de Taylor ; vérifier que chaque nœud affiche un losange coloré selon sa catégorie (pas de symbole botanique complexe).
- Vue Carte : vérifier que Théorie de la contingence (Royaume-Uni), les écoles japonaises, allemandes et néerlandaises sont positionnées sur le bon pays ; repérer les 3 nouveaux marqueurs (Chine, Corée du Sud, Inde).
- Légende : présente sur les deux vues, lit correctement les 3 types de liens et les 7 catégories avec leurs couleurs.
- Panneau de détail : cliquer sur Rendanheyi, Samsung Way et Jugaad Innovation, vérifier que sources et citation (le cas échéant) s'affichent correctement.
- Filtres : sélectionner chaque nouvelle catégorie/région, vérifier l'effet d'estompage.

- [ ] **Step 3: Commit final (si des ajustements ont été faits pendant la QA)**

```bash
git add -A
git commit -m "fix: ajustements issus de la passe de verification v1.1"
```

(Ne committer que s'il y a effectivement des changements — sinon, cette étape est un no-op.)
