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
