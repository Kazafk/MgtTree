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
      .html(generateVignette(ecole.categorie, MARKER_SIZE));
  }
}
