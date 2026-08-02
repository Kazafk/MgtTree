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
  const NODE_GAP = 34;
  const LEVEL_GAP = 190;
  const COLUMN_GAP = 80;
  const MARGIN = 60;

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

    nodeEl.html(generateVignette(ecole.id, ecole.categorie, 40));
    // Les chaînes à enfant unique (fréquentes ici) alignent plusieurs nœuds
    // consécutifs sur la même position verticale : sans alternance, leurs
    // libellés (souvent longs) se chevauchent en ligne droite quel que soit
    // l'espacement horizontal. On alterne donc au-dessus/en-dessous selon la
    // profondeur pour désenchevêtrer une chaîne, en plus de l'espacement fixe.
    const labelBelow = d.depth % 2 === 0;
    nodeEl.append('text')
      .attr('x', 0)
      .attr('y', labelBelow ? 30 : -16)
      .attr('text-anchor', 'middle')
      .attr('class', 'tree-node-label')
      .text(ecole.nom);
  }
}
