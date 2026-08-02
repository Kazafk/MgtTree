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
