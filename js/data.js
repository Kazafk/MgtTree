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
    if (e.periode && e.periode.fin !== null && e.periode.fin !== undefined && typeof e.periode.fin !== 'number') errors.push(`${e.id}: periode.fin doit être un nombre ou null`);
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
