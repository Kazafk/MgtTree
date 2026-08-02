import { readFileSync } from 'node:fs';
import { validateData, buildStructuralTree } from '../js/data.js';

const raw = JSON.parse(readFileSync(new URL('../data.json', import.meta.url)));
validateData(raw);
const { roots } = buildStructuralTree(raw.ecoles, raw.filiations);
console.log(`OK — ${raw.ecoles.length} écoles, ${raw.filiations.length} filiations, ${roots.length} racines`);
