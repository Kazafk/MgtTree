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
assertEqual(roots.length, 1, 'un seul nœud sans parent structurant → une seule racine');
assertEqual(roots[0].id, 'a', 'la racine doit être "a"');
assertEqual(roots[0].children.map(c => c.id), ['b'], '"b" doit être enfant structurant de "a"');
assertEqual(crossLinks, [{ de: 'a', vers: 'c' }], 'la filiation synthese doit devenir un cross-link, pas un enfant');

const twoParents = minimalDataset();
twoParents.filiations.push({ de: 'c', vers: 'b', type: 'rupture' });
assertThrows(() => buildStructuralTree(twoParents.ecoles, twoParents.filiations), 'un nœud avec deux filiations structurantes doit lever une exception');

// matchesFilters
assertEqual(matchesFilters(idx.get('a'), { categorie: 'industriel' }), true, 'doit matcher sur categorie');
assertEqual(matchesFilters(idx.get('a'), { categorie: 'humain' }), false, 'ne doit pas matcher categorie différente');
assertEqual(matchesFilters(idx.get('a'), { periodeMin: 1910 }), false, 'doit filtrer sur periodeMin');

console.log('data.test.mjs: tous les tests passent');
