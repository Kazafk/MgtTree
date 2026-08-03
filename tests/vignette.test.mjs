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
