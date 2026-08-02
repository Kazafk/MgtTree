# Généalogie du management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer un site interactif (dépôt dédié `Kazafk/MgtTree`, GitHub Pages) présentant la généalogie des écoles de management sous forme d'arbre filial (D3 hierarchy) et de carte du monde (D3 geo), avec panneau de détail au clic, dans une identité visuelle « herbier scientifique ».

**Architecture:** Site statique sans build, ES modules natifs chargés en `<script type="module">`, D3 v7 importé via CDN ESM (`+esm`). Un fichier `data.json` porte tout le contenu (écoles, filiations, événements) ; `js/data.js` valide et transforme ces données en structures consommées par `js/tree.js` (vue arbre), `js/map.js` (vue carte) et `js/panel.js` (panneau de détail partagé). `js/main.js` orchestre le chargement, la bascule de vue et les filtres. Tous les fichiers vivent à la racine du dépôt (pas de sous-dossier).

**Tech Stack:** HTML/CSS/JS vanilla, ES modules, D3 v7 (`d3-hierarchy`, `d3-geo`, `d3-zoom`, `d3-selection`) via `https://cdn.jsdelivr.net/npm/d3@7/+esm`, `topojson-client` via CDN ESM pour la carte, `world-atlas@2` (topojson) pour le fond de carte. Tests de logique pure exécutés avec `node` (pas de framework de test, pas de `package.json`).

## Global Constraints

- Pas d'étape de build : ES modules natifs + CDN uniquement, aucun bundler/npm install.
- Langue de l'interface : français.
- Le projet vit dans le dépôt dédié `Kazafk/MgtTree` (déjà créé, cloné dans `C:/Repos/MgtTree`, `README.md`/`.gitignore` déjà en place), hébergé via GitHub Pages sur la branche `master`, racine du dépôt, à `https://kazafk.github.io/MgtTree/`.
- Un nœud (`ecole`) a **exactement un parent structurant** (filiation `continuite` ou `rupture`) ; les filiations `synthese` sont des liens transversaux hors calcul de layout (voir spec §3.2).
- Toute donnée injectée dans le DOM doit être échappée.
- Accessibilité : contraste sépia/crème conforme WCAG AA, `prefers-reduced-motion` respecté sur toutes les transitions.
- Chaque école doit citer au moins une source (`sources` non vide) — pas de contenu inventé sans référence.
- Toutes les tâches ci-dessous s'exécutent dans `C:/Repos/MgtTree`, **sauf la Task 10** qui touche le dépôt séparé `C:/Repos/Kazafk.github.io`.

---

## Task 1: Scaffold du projet

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `data.json`
- Create: `js/main.js`

**Interfaces:**
- Produces: structure de page avec conteneurs `#tree-view`, `#map-view`, `#detail-panel`, `#tab-tree`, `#tab-map`, `#filters` (ids utilisés par toutes les tâches suivantes).

- [ ] **Step 1: Créer le squelette `data.json`**

```json
{
  "ecoles": [],
  "filiations": [],
  "evenements": []
}
```

- [ ] **Step 2: Créer `index.html` (squelette)**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MgtTree — Généalogie du management</title>
  <meta name="description" content="Arbre généalogique interactif des écoles de pensée en management, et leur répartition dans le monde." />
  <link rel="stylesheet" href="style.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
</head>
<body>
  <header class="page-header">
    <a class="back-link" href="https://kazafk.github.io/">&larr; Portfolio</a>
    <h1>MgtTree — Généalogie du management</h1>
    <nav class="view-tabs" role="tablist">
      <button id="tab-tree" class="view-tab view-tab--active" role="tab" aria-selected="true">Arbre</button>
      <button id="tab-map" class="view-tab" role="tab" aria-selected="false">Carte</button>
    </nav>
  </header>

  <div class="filters" id="filters">
    <label>Catégorie
      <select id="filter-categorie"><option value="">Toutes</option></select>
    </label>
    <label>Région
      <select id="filter-region"><option value="">Toutes</option></select>
    </label>
  </div>

  <main class="view-container">
    <section id="tree-view" class="view view--tree"></section>
    <section id="map-view" class="view view--map" hidden></section>
  </main>

  <aside id="detail-panel" class="panel" aria-live="polite"></aside>

  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Créer `style.css` (reset minimal, complété en Task 4)**

```css
* { box-sizing: border-box; }
body { margin: 0; font-family: Georgia, serif; }
```

- [ ] **Step 4: Créer `js/main.js` (placeholder de démarrage)**

```js
console.log('MgtTree — initialisation à venir (Task 9).');
```

- [ ] **Step 5: Vérification manuelle**

Lancer `python3 -m http.server 8000` depuis `C:/Repos/MgtTree`, ouvrir
`http://localhost:8000/`. Vérifier : la page se charge sans erreur console,
le titre et les onglets « Arbre »/« Carte » sont visibles.

- [ ] **Step 6: Commit**

```bash
git add index.html style.css data.json js/main.js
git commit -m "feat: scaffold de la page (squelette HTML/CSS/JS)"
```

---

## Task 2: Modèle de données et validateur (`js/data.js`)

**Files:**
- Create: `js/data.js`
- Create: `tests/assert.mjs`
- Create: `tests/data.test.mjs`

**Interfaces:**
- Produces:
  - `validateData(raw): raw` — lève une exception si `raw` ne respecte pas le schéma (voir spec §3), retourne `raw` sinon.
  - `buildIndex(ecoles): Map<string, Ecole>`
  - `buildStructuralTree(ecoles, filiations): { roots: Array<{id, children}>, crossLinks: Array<{de, vers}> }`
  - `matchesFilters(ecole, filters): boolean` — `filters` = `{ categorie?, region?, periodeMin?, periodeMax? }`.

- [ ] **Step 1: Écrire le helper de test**

```js
// tests/assert.mjs
export function assertEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${message || 'Assertion échouée'}\n  attendu: ${e}\n  obtenu:  ${a}`);
  }
}

export function assertThrows(fn, message) {
  try {
    fn();
  } catch (e) {
    return;
  }
  throw new Error(message || 'Attendu une exception, aucune levée');
}
```

- [ ] **Step 2: Écrire les tests (doivent échouer, `js/data.js` n'existe pas encore)**

```js
// tests/data.test.mjs
import { assertEqual, assertThrows } from './assert.mjs';
import { validateData, buildIndex, buildStructuralTree, matchesFilters } from '../js/data.js';

function minimalDataset() {
  return {
    ecoles: [
      { id: 'a', nom: 'École A', periode: { debut: 1900, fin: null }, region: 'France', coords: { lat: 0, lon: 0 }, auteurs: ['X'], categorie: 'industriel', logique: 'texte', sources: ['src'] },
      { id: 'b', nom: 'École B', periode: { debut: 1920, fin: null }, region: 'France', coords: { lat: 1, lon: 1 }, auteurs: ['Y'], categorie: 'humain', logique: 'texte', sources: ['src'] },
      { id: 'c', nom: 'École C', periode: { debut: 1950, fin: null }, region: 'Allemagne', coords: { lat: 2, lon: 2 }, auteurs: ['Z'], categorie: 'agile', logique: 'texte', sources: ['src'] }
    ],
    filiations: [
      { de: 'a', vers: 'b', type: 'continuite' },
      { de: 'a', vers: 'c', type: 'synthese' }
    ],
    evenements: [
      { id: 'ev1', annee: 1929, titre: 'Événement test', filiations_concernees: ['a->b'] }
    ]
  };
}

// validateData
assertThrows(() => validateData({}), 'doit rejeter un objet sans ecoles/filiations/evenements');
assertEqual(validateData(minimalDataset()).ecoles.length, 3, 'doit accepter un dataset minimal valide');

const missingSource = minimalDataset();
delete missingSource.ecoles[0].sources;
assertThrows(() => validateData(missingSource), 'doit rejeter une école sans sources');

const badFiliation = minimalDataset();
badFiliation.filiations.push({ de: 'a', vers: 'inconnu', type: 'continuite' });
assertThrows(() => validateData(badFiliation), 'doit rejeter une filiation vers un id inconnu');

const badEvent = minimalDataset();
badEvent.evenements[0].filiations_concernees = ['a->inconnu'];
assertThrows(() => validateData(badEvent), 'doit rejeter un événement référençant une filiation inexistante');

// buildIndex
const idx = buildIndex(minimalDataset().ecoles);
assertEqual(idx.get('b').nom, 'École B', 'buildIndex doit indexer par id');

// buildStructuralTree
const { roots, crossLinks } = buildStructuralTree(minimalDataset().ecoles, minimalDataset().filiations);
assertEqual(roots.length, 2, '"a" et "c" sont racines : "c" n\'a qu\'une filiation synthese, pas de parent structurant');
assertEqual(roots.map(r => r.id), ['a', 'c'], 'les racines doivent être "a" et "c"');
assertEqual(roots.find(r => r.id === 'a').children.map(c => c.id), ['b'], '"b" doit être enfant structurant de "a"');
assertEqual(roots.find(r => r.id === 'c').children, [], '"c" est racine (pas de parent structurant) et n\'a pas d\'enfant structurant');
assertEqual(crossLinks, [{ de: 'a', vers: 'c' }], 'la filiation synthese doit devenir un cross-link vers "c", même si "c" est aussi racine');

const twoParents = minimalDataset();
twoParents.filiations.push({ de: 'c', vers: 'b', type: 'rupture' });
assertThrows(() => buildStructuralTree(twoParents.ecoles, twoParents.filiations), 'un nœud avec deux filiations structurantes doit lever une exception');

// matchesFilters
assertEqual(matchesFilters(idx.get('a'), { categorie: 'industriel' }), true, 'doit matcher sur categorie');
assertEqual(matchesFilters(idx.get('a'), { categorie: 'humain' }), false, 'ne doit pas matcher categorie différente');
assertEqual(matchesFilters(idx.get('a'), { periodeMin: 1910 }), false, 'doit filtrer sur periodeMin');

console.log('data.test.mjs: tous les tests passent');
```

- [ ] **Step 3: Lancer les tests pour vérifier qu'ils échouent**

Run: `node tests/data.test.mjs`
Expected: erreur `Cannot find module '../js/data.js'`

- [ ] **Step 4: Implémenter `js/data.js`**

```js
// js/data.js
const CATEGORIES = new Set(['industriel', 'humain', 'systemique', 'qualite', 'strategique', 'agile', 'organisationnel-emergent']);
const FILIATION_TYPES = new Set(['continuite', 'rupture', 'synthese']);

export function validateData(raw) {
  const errors = [];
  if (!raw || !Array.isArray(raw.ecoles)) errors.push('raw.ecoles doit être un tableau');
  if (!raw || !Array.isArray(raw.filiations)) errors.push('raw.filiations doit être un tableau');
  if (!raw || !Array.isArray(raw.evenements)) errors.push('raw.evenements doit être un tableau');
  if (errors.length) throw new Error(errors.join('; '));

  const ids = new Set();
  for (const e of raw.ecoles) {
    if (!e.id || typeof e.id !== 'string') { errors.push(`école sans id valide: ${JSON.stringify(e)}`); continue; }
    if (ids.has(e.id)) errors.push(`id dupliqué: ${e.id}`);
    ids.add(e.id);
    if (!e.nom) errors.push(`${e.id}: nom manquant`);
    if (!e.periode || typeof e.periode.debut !== 'number') errors.push(`${e.id}: periode.debut manquant ou invalide`);
    if (!e.region) errors.push(`${e.id}: region manquante`);
    if (!e.coords || typeof e.coords.lat !== 'number' || typeof e.coords.lon !== 'number') errors.push(`${e.id}: coords invalides`);
    if (!Array.isArray(e.auteurs) || e.auteurs.length === 0) errors.push(`${e.id}: auteurs manquants`);
    if (!CATEGORIES.has(e.categorie)) errors.push(`${e.id}: categorie invalide "${e.categorie}"`);
    if (!e.logique) errors.push(`${e.id}: logique manquante`);
    if (!Array.isArray(e.sources) || e.sources.length === 0) errors.push(`${e.id}: sources manquantes`);
  }

  const filiationKeys = new Set();
  for (const f of raw.filiations) {
    if (!ids.has(f.de)) errors.push(`filiation.de inconnu: ${f.de}`);
    if (!ids.has(f.vers)) errors.push(`filiation.vers inconnu: ${f.vers}`);
    if (!FILIATION_TYPES.has(f.type)) errors.push(`filiation ${f.de}->${f.vers}: type invalide "${f.type}"`);
    filiationKeys.add(`${f.de}->${f.vers}`);
  }

  for (const ev of raw.evenements) {
    if (!ev.id) { errors.push(`événement sans id: ${JSON.stringify(ev)}`); continue; }
    if (typeof ev.annee !== 'number') errors.push(`${ev.id}: annee manquante`);
    if (!Array.isArray(ev.filiations_concernees)) errors.push(`${ev.id}: filiations_concernees doit être un tableau`);
    else {
      for (const key of ev.filiations_concernees) {
        if (!filiationKeys.has(key)) errors.push(`${ev.id}: filiation_concernee inconnue "${key}"`);
      }
    }
  }

  if (errors.length) throw new Error(errors.join('\n'));
  return raw;
}

export function buildIndex(ecoles) {
  return new Map(ecoles.map(e => [e.id, e]));
}

export function buildStructuralTree(ecoles, filiations) {
  const structural = filiations.filter(f => f.type === 'continuite' || f.type === 'rupture');
  const synthese = filiations.filter(f => f.type === 'synthese');

  const parentOf = new Map();
  for (const f of structural) {
    if (parentOf.has(f.vers)) {
      throw new Error(`${f.vers} a plusieurs filiations structurantes (continuite/rupture) — une seule autorisée, utiliser "synthese" pour les autres`);
    }
    parentOf.set(f.vers, f.de);
  }

  const childrenOf = new Map(ecoles.map(e => [e.id, []]));
  for (const [child, parent] of parentOf) {
    childrenOf.get(parent).push(child);
  }

  const roots = ecoles.filter(e => !parentOf.has(e.id)).map(e => e.id);

  function toNode(id) {
    return { id, children: childrenOf.get(id).map(toNode) };
  }

  return {
    roots: roots.map(toNode),
    crossLinks: synthese.map(f => ({ de: f.de, vers: f.vers }))
  };
}

export function matchesFilters(ecole, filters) {
  if (!filters) return true;
  if (filters.categorie && ecole.categorie !== filters.categorie) return false;
  if (filters.region && ecole.region !== filters.region) return false;
  if (filters.periodeMin && ecole.periode.debut < filters.periodeMin) return false;
  if (filters.periodeMax && ecole.periode.debut > filters.periodeMax) return false;
  return true;
}
```

- [ ] **Step 5: Relancer les tests, vérifier qu'ils passent**

Run: `node tests/data.test.mjs`
Expected: `data.test.mjs: tous les tests passent` (aucune exception non interceptée)

- [ ] **Step 6: Commit**

```bash
git add js/data.js tests/assert.mjs tests/data.test.mjs
git commit -m "feat: validateur de données et construction de l'arbre structurant"
```

---

## Task 3: Générateur de vignettes SVG (`js/vignette.js`)

**Files:**
- Create: `js/vignette.js`
- Create: `tests/vignette.test.mjs`

**Interfaces:**
- Consumes: rien (module autonome).
- Produces: `generateVignette(id: string, categorie: string, size = 64): string` — retourne un `<svg>...</svg>` déterministe (même `id`+`categorie` → même sortie).

- [ ] **Step 1: Écrire les tests (doivent échouer, module inexistant)**

```js
// tests/vignette.test.mjs
import { assertEqual, assertThrows } from './assert.mjs';
import { generateVignette } from '../js/vignette.js';

const a1 = generateVignette('taylorisme', 'industriel', 48);
const a2 = generateVignette('taylorisme', 'industriel', 48);
assertEqual(a1, a2, 'même id + même categorie doit produire un SVG identique (déterminisme)');

const b = generateVignette('agile-manifeste', 'agile', 48);
assertEqual(a1 === b, false, 'des id différents doivent produire des SVG différents');

assertEqual(a1.includes('vignette--industriel'), true, 'la classe CSS doit refléter la categorie');
assertEqual(b.includes('vignette--agile'), true, 'la classe CSS doit refléter la categorie');

assertThrows(() => generateVignette('x', 'inconnue'), 'doit rejeter une categorie non supportée');

console.log('vignette.test.mjs: tous les tests passent');
```

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `node tests/vignette.test.mjs`
Expected: erreur `Cannot find module '../js/vignette.js'`

- [ ] **Step 3: Implémenter `js/vignette.js`**

```js
// js/vignette.js
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

  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="vignette vignette--${categorie}" data-id="${id}">` +
    `<path d="${stemPath}" fill="none" stroke="currentColor" stroke-width="1.5" />` +
    leaves +
    `</svg>`;
}
```

- [ ] **Step 4: Relancer les tests, vérifier qu'ils passent**

Run: `node tests/vignette.test.mjs`
Expected: `vignette.test.mjs: tous les tests passent`

- [ ] **Step 5: Commit**

```bash
git add js/vignette.js tests/vignette.test.mjs
git commit -m "feat: générateur SVG paramétrique de vignettes botaniques"
```

---

## Task 4: Système visuel « herbier scientifique » (`style.css`)

**Files:**
- Modify: `style.css`

**Interfaces:**
- Consumes: ids/classes produits par `index.html` (Task 1) : `.page-header`, `.view-tabs`, `.view-tab`, `.filters`, `.view-container`, `.view`, `.panel`.
- Produces: classes consommées par les tâches suivantes : `.tree-link[data-type]`, `.cross-link`, `.tree-node`, `.tree-node--dimmed`, `.tree-node-label`, `.map-country`, `.map-sphere`, `.map-marker`, `.panel--open`, `.panel-title`, `.panel-meta`, `.panel-close`, `.panel-link`.

- [ ] **Step 1: Remplacer le contenu de `style.css`**

```css
:root {
  --paper: #F3ECDD;
  --paper-deep: #E8DCC4;
  --ink-sepia: #5B3A29;
  --ink-sepia-soft: #7A5540;
  --moss: #3F5C3F;
  --moss-soft: #6E8F6E;
  --rupture: #8E3B1C;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: 'Playfair Display', Georgia, serif;
  background: var(--paper);
  color: var(--ink-sepia);
  background-image:
    radial-gradient(circle at 20% 20%, rgba(91, 58, 41, 0.03), transparent 60%),
    radial-gradient(circle at 80% 70%, rgba(91, 58, 41, 0.03), transparent 60%);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--ink-sepia-soft);
}

.back-link {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: var(--ink-sepia);
  text-decoration: none;
}

.view-tabs { margin-left: auto; display: flex; gap: 0.5rem; }

.view-tab {
  font-family: 'JetBrains Mono', monospace;
  background: transparent;
  border: 1px solid var(--ink-sepia-soft);
  color: var(--ink-sepia);
  padding: 0.4rem 1rem;
  cursor: pointer;
  border-radius: 2px;
}

.view-tab--active { background: var(--ink-sepia); color: var(--paper); }

.filters {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 2rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
}

.filters select {
  font-family: inherit;
  background: var(--paper-deep);
  border: 1px solid var(--ink-sepia-soft);
  color: var(--ink-sepia);
  padding: 0.2rem 0.4rem;
}

.view-container { position: relative; height: calc(100vh - 120px); }

.view { width: 100%; height: 100%; }

.tree-svg, .map-svg { width: 100%; height: 100%; }

.tree-link { fill: none; stroke: var(--ink-sepia-soft); stroke-width: 1.5; }
.tree-link[data-type="rupture"] { stroke: var(--rupture); stroke-dasharray: 4 3; }
.cross-link { fill: none; stroke: var(--moss-soft); stroke-width: 1; stroke-dasharray: 2 3; }

.tree-node { color: var(--ink-sepia); }
.tree-node-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; fill: var(--ink-sepia); }
.tree-node--dimmed { opacity: 0.25; }

.map-country { fill: var(--paper-deep); stroke: var(--ink-sepia-soft); stroke-width: 0.5; }
.map-sphere { fill: #EDE3CB; }
.map-marker { color: var(--moss); }

.panel {
  position: fixed;
  top: 0;
  right: 0;
  width: min(380px, 90vw);
  height: 100vh;
  background: var(--paper-deep);
  border-left: 1px solid var(--ink-sepia-soft);
  padding: 2rem 1.5rem;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  overflow-y: auto;
}

.panel--open { transform: translateX(0); }
.panel-title { font-size: 1.4rem; margin: 0 0 0.25rem; }
.panel-meta { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: var(--ink-sepia-soft); }
.panel-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--ink-sepia);
}
.panel-link {
  background: none;
  border: none;
  color: var(--moss);
  text-decoration: underline;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
}

@media (prefers-reduced-motion: reduce) {
  .panel { transition: none; }
}
```

- [ ] **Step 2: Vérification manuelle**

Recharger `http://localhost:8000/`. Vérifier : fond papier crème, en-tête
avec onglets stylés (onglet « Arbre » en surbrillance sépia), barre de
filtres visible, pas d'erreur console.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: système visuel herbier scientifique (palette, typo, panneau)"
```

---

## Task 5: Contenu du dataset (`data.json`)

**Files:**
- Modify: `data.json`

**Interfaces:**
- Consumes: schéma défini par `validateData` (Task 2).
- Produces: dataset complet consommé par toutes les vues.

- [ ] **Step 1: Rechercher et rédiger les 43 fiches `ecoles`**

Utiliser exactement les 43 id/nom/auteurs/categorie/region/parent-structurant
ci-dessous (ne pas en ajouter ni en retirer sans repasser par la spec). Pour
chaque entrée, rechercher et rédiger : `periode.debut` (et `periode.fin` si
le mouvement est considéré clos), `coords` (lieu d'origine, coordonnées
décimales), `logique` (2-4 phrases de synthèse), `citation_cle` (optionnel),
`sources` (au moins une référence vérifiable — ouvrage, article académique,
site institutionnel).

| id | nom | auteurs principaux | categorie | région | parent structurant [type] |
|---|---|---|---|---|---|
| taylorisme | Organisation scientifique du travail | Frederick W. Taylor | industriel | États-Unis | (racine) |
| fayolisme | Administration industrielle et générale | Henri Fayol | industriel | France | (racine) |
| bureaucratie-weberienne | Bureaucratie rationnelle-légale | Max Weber | industriel | Allemagne | (racine) |
| fordisme | Fordisme | Henry Ford | industriel | États-Unis | taylorisme [continuite] |
| management-administratif-posdcorb | Administration moderne (POSDCORB) | Luther Gulick, Lyndall Urwick | industriel | Royaume-Uni | fayolisme [continuite] |
| ecole-relations-humaines | École des relations humaines | Elton Mayo | humain | États-Unis | taylorisme [rupture] |
| controle-qualite-statistique | Contrôle statistique de la qualité | Walter Shewhart | qualite | États-Unis | taylorisme [continuite] |
| theorie-x-y | Théorie X et Y | Douglas McGregor | humain | États-Unis | ecole-relations-humaines [continuite] |
| hierarchie-besoins-maslow | Hiérarchie des besoins | Abraham Maslow | humain | États-Unis | ecole-relations-humaines [continuite] |
| facteurs-motivation-herzberg | Facteurs de motivation/hygiène | Frederick Herzberg | humain | États-Unis | ecole-relations-humaines [continuite] |
| sociotechnique-tavistock | Approche sociotechnique | Eric Trist, Fred Emery | systemique | Royaume-Uni | ecole-relations-humaines [rupture] |
| servant-leadership | Leadership serviteur | Robert Greenleaf | humain | États-Unis | ecole-relations-humaines [continuite] |
| theorie-systemes-organisation | Théorie des systèmes appliquée à l'organisation | Daniel Katz, Robert Kahn | systemique | États-Unis | sociotechnique-tavistock [continuite] |
| ecole-scandinave-sociotechnique | École scandinave (usines Volvo) | Pehr Gyllenhammar | systemique | Suède | sociotechnique-tavistock [continuite] |
| theorie-contingence | Théorie de la contingence | Paul Lawrence, Jay Lorsch, Joan Woodward | systemique | Royaume-Uni | theorie-systemes-organisation [continuite] |
| toyotisme-lean | Système de production Toyota (Lean) | Taiichi Ohno, Eiji Toyoda | qualite | Japon | fordisme [rupture] |
| qualite-totale-tqm | Management de la qualité totale (TQM) | W. Edwards Deming, Joseph Juran, Kaoru Ishikawa | qualite | Japon | controle-qualite-statistique [continuite] |
| kaizen | Kaizen | Masaaki Imai | qualite | Japon | toyotisme-lean [continuite] |
| six-sigma | Six Sigma | Bill Smith (Motorola) | qualite | États-Unis | qualite-totale-tqm [continuite] |
| reengineering | Reengineering des processus | Michael Hammer, James Champy | qualite | États-Unis | qualite-totale-tqm [rupture] |
| management-par-objectifs | Direction par objectifs (MBO) | Peter Drucker | strategique | États-Unis | fayolisme [continuite] |
| planification-strategique | Planification stratégique | Igor Ansoff | strategique | États-Unis | management-par-objectifs [continuite] |
| avantage-concurrentiel-porter | Avantage concurrentiel | Michael Porter | strategique | États-Unis | planification-strategique [continuite] |
| strategie-emergente-mintzberg | Stratégie émergente | Henry Mintzberg | strategique | Canada | planification-strategique [rupture] |
| okr-intel-google | Objectives and Key Results (OKR) | Andy Grove, John Doerr | strategique | États-Unis | management-par-objectifs [continuite] |
| organisation-apprenante | Organisation apprenante | Peter Senge | systemique | États-Unis | theorie-contingence [continuite] |
| creation-connaissance-nonaka | Création de connaissance organisationnelle | Ikujiro Nonaka, Hirotaka Takeuchi | systemique | Japon | organisation-apprenante [continuite] |
| design-thinking | Design Thinking | David Kelley, Tim Brown (IDEO) | agile | États-Unis | theorie-contingence [rupture] |
| agile-manifeste | Manifeste agile | Kent Beck, Jeff Sutherland, Ken Schwaber et al. | agile | États-Unis | creation-connaissance-nonaka [rupture] |
| scrum | Scrum | Jeff Sutherland, Ken Schwaber | agile | États-Unis | agile-manifeste [continuite] |
| extreme-programming | Extreme Programming | Kent Beck | agile | États-Unis | agile-manifeste [continuite] |
| lean-startup | Lean Startup | Eric Ries | agile | États-Unis | agile-manifeste [continuite] |
| devops | Mouvement DevOps | Patrick Debois, John Allspaw | agile | Belgique | agile-manifeste [continuite] |
| management-3-0 | Management 3.0 | Jurgen Appelo | agile | Pays-Bas | agile-manifeste [continuite] |
| leadership-transformationnel | Leadership transformationnel | James MacGregor Burns, Bernard Bass | humain | États-Unis | servant-leadership [continuite] |
| entreprise-liberee | Entreprise libérée | Isaac Getz | organisationnel-emergent | France | theorie-x-y [rupture] |
| sociocratie | Sociocratie | Gerard Endenburg | organisationnel-emergent | Pays-Bas | entreprise-liberee [continuite] |
| holacratie | Holacratie | Brian Robertson | organisationnel-emergent | États-Unis | sociocratie [continuite] |
| organisations-teal | Organisations téal (Reinventing Organizations) | Frederic Laloux | organisationnel-emergent | Belgique | holacratie [continuite] |
| keiretsu-japonais | Groupes keiretsu | (collectif) | systemique | Japon | bureaucratie-weberienne [rupture] |
| mittelstand-allemand | Modèle Mittelstand | (collectif) | industriel | Allemagne | fayolisme [rupture] |
| capitalisme-parties-prenantes | Capitalisme des parties prenantes (B Corp) | R. Edward Freeman, B Lab | organisationnel-emergent | États-Unis | organisations-teal [continuite] |
| travail-distribue-post-covid | Travail distribué post-2020 | (collectif) | organisationnel-emergent | Monde | devops [continuite] |

- [ ] **Step 2: Ajouter les filiations `synthese` (liens transversaux, en plus des parents structurants ci-dessus)**

```
toyotisme-lean       <- controle-qualite-statistique   (synthese)
qualite-totale-tqm   <- toyotisme-lean                 (synthese)
agile-manifeste      <- toyotisme-lean                 (synthese)
agile-manifeste      <- design-thinking                (synthese)
lean-startup         <- toyotisme-lean                 (synthese)
devops                <- kaizen                        (synthese)
management-3-0       <- okr-intel-google               (synthese)
organisations-teal    <- organisation-apprenante        (synthese)
capitalisme-parties-prenantes <- strategie-emergente-mintzberg (synthese)
```

- [ ] **Step 3: Ajouter les 7 événements de rupture**

| id | année | titre | filiations concernées |
|---|---|---|---|
| crise-1929 | 1929 | Grande Dépression | taylorisme->ecole-relations-humaines |
| choc-petrolier-1973 | 1973 | Choc pétrolier | fordisme->toyotisme-lean |
| essor-japon-industriel | 1980 | Essor industriel du Japon | controle-qualite-statistique->qualite-totale-tqm, toyotisme-lean->kaizen |
| bulle-internet-2000 | 2000 | Éclatement de la bulle internet | creation-connaissance-nonaka->agile-manifeste |
| crise-financiere-2008 | 2008 | Crise financière mondiale | planification-strategique->strategie-emergente-mintzberg, qualite-totale-tqm->reengineering |
| essor-startups-tech | 2010 | Essor des startups technologiques | agile-manifeste->lean-startup |
| pandemie-covid19 | 2020 | Pandémie de Covid-19 | devops->travail-distribue-post-covid |

Rédiger `titre`/`description` sourcés pour chacun. Assembler le tout dans
`data.json` en respectant le schéma de Task 2 (chaque `ecole` a bien tous les
champs requis, chaque `filiation` un `type` valide, chaque `evenement` des
`filiations_concernees` au format exact `"de->vers"` correspondant à une
entrée du tableau `filiations`).

- [ ] **Step 4: Valider le dataset**

Créer temporairement `tests/validate-data.mjs` :

```js
import { readFileSync } from 'node:fs';
import { validateData, buildStructuralTree } from '../js/data.js';

const raw = JSON.parse(readFileSync(new URL('../data.json', import.meta.url)));
validateData(raw);
const { roots } = buildStructuralTree(raw.ecoles, raw.filiations);
console.log(`OK — ${raw.ecoles.length} écoles, ${raw.filiations.length} filiations, ${roots.length} racines`);
```

Run: `node tests/validate-data.mjs`
Expected: `OK — 43 écoles, ... filiations, 3 racines` (aucune exception)

- [ ] **Step 5: Commit**

```bash
git add data.json tests/validate-data.mjs
git commit -m "content: jeu de données des 43 écoles, filiations et événements"
```

---

## Task 6: Vue Arbre (`js/tree.js`)

**Files:**
- Create: `js/tree.js`
- Modify: `js/main.js`

**Interfaces:**
- Consumes: `generateVignette` (Task 3), `matchesFilters` (Task 2), structure `{ roots, crossLinks }` (Task 2).
- Produces: `renderTree(container: HTMLElement, { roots, crossLinks, index, filiations, onSelect, filters }): void`.

- [ ] **Step 1: Implémenter `js/tree.js`**

```js
// js/tree.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { generateVignette } from './vignette.js';
import { matchesFilters } from './data.js';

export function renderTree(container, { roots, crossLinks, index, filiations, onSelect, filters }) {
  container.innerHTML = '';
  const width = container.clientWidth || 1200;
  const height = container.clientHeight || 800;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('class', 'tree-svg');

  const g = svg.append('g').attr('class', 'tree-root');

  svg.call(d3.zoom().scaleExtent([0.3, 3]).on('zoom', (event) => g.attr('transform', event.transform)));

  const columnWidth = width / roots.length;
  const rootLayouts = roots.map((rootData, i) => {
    const root = d3.hierarchy(rootData);
    d3.tree().size([height * 0.85, columnWidth - 120])(root);
    root.each(d => { d.y += i * columnWidth + 80; });
    return root;
  });

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

    nodeEl.html(generateVignette(ecole.id, ecole.categorie, 40));
    nodeEl.append('text')
      .attr('x', 0)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('class', 'tree-node-label')
      .text(ecole.nom);
  }
}
```

- [ ] **Step 2: Brancher la vue Arbre dans `js/main.js`**

```js
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
```

- [ ] **Step 3: Vérification manuelle**

Recharger `http://localhost:8000/`. Vérifier : les 3 arbres racines (Taylor,
Fayol, Weber) s'affichent avec leurs branches et vignettes, le zoom/pan à la
molette et au glisser fonctionne, un clic sur un nœud logue son id dans la
console, les liens `rupture` sont en pointillé sépia foncé, les liens
`synthese` en pointillé vert mousse.

- [ ] **Step 4: Commit**

```bash
git add js/tree.js js/main.js
git commit -m "feat: vue arbre généalogique (layout D3 hierarchy + zoom)"
```

---

## Task 7: Vue Carte (`js/map.js`)

**Files:**
- Create: `js/map.js`
- Modify: `js/main.js`

**Interfaces:**
- Consumes: `generateVignette` (Task 3).
- Produces: `renderMap(container: HTMLElement, { ecoles, onSelect }): Promise<void>`.

- [ ] **Step 1: Implémenter `js/map.js`**

```js
// js/map.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { feature } from 'https://cdn.jsdelivr.net/npm/topojson-client@3/+esm';
import { generateVignette } from './vignette.js';

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
    marker.html(generateVignette(ecole.id, ecole.categorie, 20));
  }
}
```

- [ ] **Step 2: Brancher la vue Carte dans `js/main.js` (bascule d'onglets)**

```js
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
```

- [ ] **Step 3: Vérification manuelle**

Recharger la page. Cliquer sur l'onglet « Carte » : le fond de carte du
monde (style sépia/ivoire) s'affiche, les marqueurs botaniques sont
positionnés aux coordonnées de chaque école, zoom/pan fonctionne, clic sur
un marqueur logue l'id en console. Cliquer sur « Arbre » revient à la vue
précédente.

- [ ] **Step 4: Commit**

```bash
git add js/map.js js/main.js
git commit -m "feat: vue carte du monde (projection D3 geo + marqueurs)"
```

---

## Task 8: Panneau de détail (`js/panel.js`)

**Files:**
- Create: `js/panel.js`
- Modify: `js/main.js`

**Interfaces:**
- Consumes: aucune dépendance externe (module autonome).
- Produces: `renderPanel(container: HTMLElement, ecole: Ecole|null, { onNavigate, filiationsFrom }): void`.

- [ ] **Step 1: Implémenter `js/panel.js`**

```js
// js/panel.js
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function renderPanel(container, ecole, { onNavigate, filiationsFrom }) {
  if (!ecole) {
    container.classList.remove('panel--open');
    container.innerHTML = '';
    return;
  }

  const related = filiationsFrom(ecole.id);

  container.innerHTML = `
    <button class="panel-close" aria-label="Fermer">&times;</button>
    <h2 class="panel-title">${escapeHTML(ecole.nom)}</h2>
    <p class="panel-meta">${escapeHTML(ecole.region)} · ${ecole.periode.debut}${ecole.periode.fin ? '–' + ecole.periode.fin : ''}</p>
    <h3>Auteurs</h3>
    <p>${ecole.auteurs.map(escapeHTML).join(', ')}</p>
    <h3>Logique</h3>
    <p>${escapeHTML(ecole.logique)}</p>
    ${ecole.citation_cle ? `<blockquote>${escapeHTML(ecole.citation_cle)}</blockquote>` : ''}
    <h3>Sources</h3>
    <ul>${ecole.sources.map(s => `<li>${escapeHTML(s)}</li>`).join('')}</ul>
    ${related.length ? `<h3>Écoles liées</h3><ul class="panel-links">${related.map(r => `<li><button class="panel-link" data-id="${escapeHTML(r.id)}">${escapeHTML(r.nom)}</button></li>`).join('')}</ul>` : ''}
  `;
  container.classList.add('panel--open');

  container.querySelector('.panel-close').addEventListener('click', () => onNavigate(null));
  container.querySelectorAll('.panel-link').forEach(btn => {
    btn.addEventListener('click', () => onNavigate(btn.dataset.id));
  });
}
```

- [ ] **Step 2: Brancher le panneau dans `js/main.js` (remplace les `console.log` de sélection)**

```js
// js/main.js — remplacer la fonction onSelect et ajouter select()
import { validateData, buildIndex, buildStructuralTree } from './data.js';
import { renderTree } from './tree.js';
import { renderMap } from './map.js';
import { renderPanel } from './panel.js';

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

  const state = { view: 'tree' };

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
      renderTree(treeContainer, { roots, crossLinks, index, filiations: raw.filiations, onSelect: select });
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
```

- [ ] **Step 3: Vérification manuelle**

Recharger la page. Cliquer sur un nœud de l'arbre : le panneau glisse depuis
la droite avec nom, période, auteurs, logique, sources et écoles liées.
Cliquer sur une école liée navigue vers son propre panneau. Cliquer sur
« × » ferme le panneau. Refaire le test depuis la vue Carte.

- [ ] **Step 4: Commit**

```bash
git add js/panel.js js/main.js
git commit -m "feat: panneau de détail partagé arbre/carte"
```

---

## Task 9: Filtres et finalisation de `main.js`

**Files:**
- Modify: `js/main.js`

**Interfaces:**
- Consumes: `matchesFilters` (Task 2, déjà utilisé par `tree.js`).
- Produces: état `filters` propagé aux deux vues.

- [ ] **Step 1: Ajouter le peuplement et le câblage des filtres dans `js/main.js`**

```js
// js/main.js — ajouter après la déclaration de `state`
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
```

- [ ] **Step 2: Passer `state.filters` à `renderTree` dans `renderActiveView`**

```js
// remplacer l'appel renderTree existant par :
renderTree(treeContainer, { roots, crossLinks, index, filiations: raw.filiations, onSelect: select, filters: state.filters });
```

- [ ] **Step 3: Vérification manuelle**

Recharger la page. Vérifier que les menus déroulants « Catégorie » et
« Région » sont peuplés avec les valeurs du dataset. Sélectionner une
catégorie : les nœuds non concernés de l'arbre passent en opacité réduite
(`.tree-node--dimmed`) sans disparaître ni casser la structure de l'arbre.
Revenir à « Toutes » : l'opacité complète revient.

- [ ] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "feat: filtres par catégorie et région"
```

---

## Task 10: Lien depuis le portfolio `Kazafk.github.io`

**Files:**
- Modify: `C:/Repos/Kazafk.github.io/index.html` — **dépôt différent, séparé de `MgtTree`**, avec sa propre histoire git.

**Interfaces:** aucune (lien statique).

- [ ] **Step 1: Se placer dans le bon dépôt**

Toutes les commandes de cette tâche s'exécutent depuis
`C:/Repos/Kazafk.github.io`, pas depuis `C:/Repos/MgtTree`. Vérifier avant
de committer : `git -C C:/Repos/Kazafk.github.io remote -v` doit pointer
vers `Kazafk/Kazafk.github.io`.

- [ ] **Step 2: Localiser la section des projets dans `index.html`**

Ouvrir `C:/Repos/Kazafk.github.io/index.html`, repérer la section
`#projects` où les cartes de dépôts GitHub sont injectées dynamiquement
(`renderCards`, cf. `REPO_META` dans le `<script>` inline).

- [ ] **Step 3: Ajouter une carte statique pour le projet**

Dans la section `#projects`, ajouter :

```html
<a class="project-card project-card--featured" href="https://kazafk.github.io/MgtTree/">
  <h3>MgtTree — Généalogie du management</h3>
  <p>Arbre filial interactif des écoles de pensée en management et carte de
  leurs origines géographiques — style herbier scientifique.</p>
</a>
```

Adapter les classes CSS (`project-card`, etc.) à celles réellement utilisées
par les cartes existantes générées par `renderCards()`, pour rester
visuellement cohérent avec le reste de la page d'accueil.

- [ ] **Step 4: Vérification manuelle**

Depuis `C:/Repos/Kazafk.github.io`, lancer `python3 -m http.server 8001`
(port différent de MgtTree), ouvrir `http://localhost:8001/`. Vérifier que
la carte du nouveau projet apparaît et que le lien mène bien à
`https://kazafk.github.io/MgtTree/`.

- [ ] **Step 5: Commit (dans le dépôt `Kazafk.github.io`)**

```bash
git -C C:/Repos/Kazafk.github.io add index.html
git -C C:/Repos/Kazafk.github.io commit -m "feat: ajoute la carte du projet MgtTree à l'accueil"
```

---

## Task 11: Passe finale de vérification

**Files:** aucun fichier nouveau — vérification transverse.

- [ ] **Step 1: Exécuter tous les tests de logique pure**

Run (depuis `C:/Repos/MgtTree`):
```bash
node tests/data.test.mjs
node tests/vignette.test.mjs
node tests/validate-data.mjs
```
Expected: les trois commandes affichent leur message de succès, sans exception.

- [ ] **Step 2: Vérification manuelle bout en bout**

Depuis `http://localhost:8000/` (racine de `MgtTree`) :
- Naviguer entre les 43 nœuds dans l'arbre, vérifier qu'aucun nœud n'est orphelin.
- Vérifier chaque type de lien visuellement distinct (continuite plein, rupture pointillé sépia foncé, synthese pointillé vert).
- Basculer vers la carte, vérifier que les 43 marqueurs sont positionnés sur les bons continents.
- Ouvrir le panneau de détail depuis les deux vues, vérifier la navigation via « Écoles liées ».
- Activer un filtre catégorie puis région, vérifier l'effet d'estompage dans les deux vues.
- Réduire la fenêtre à une largeur mobile (~375px) : vérifier que rien ne casse de façon bloquante (le layout mobile fin peut rester perfectible, mais aucun élément ne doit empêcher l'interaction).

- [ ] **Step 3: Vérification accessibilité**

Activer `prefers-reduced-motion: reduce` dans les DevTools (Rendering tab),
recharger la page, vérifier que la transition du panneau est instantanée
(pas d'animation). Vérifier au contrôleur de contraste du navigateur que le
texte sépia sur fond crème/papier atteint AA (rapport ≥ 4.5:1 pour le texte
courant).

- [ ] **Step 4: Commit final (si des ajustements ont été faits pendant la QA)**

```bash
git add -A
git commit -m "fix: ajustements issus de la passe de vérification finale"
```

(Ne committer que s'il y a effectivement des changements — sinon, cette
étape est un no-op.)
