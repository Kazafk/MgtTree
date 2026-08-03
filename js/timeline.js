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
