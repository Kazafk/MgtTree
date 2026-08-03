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
