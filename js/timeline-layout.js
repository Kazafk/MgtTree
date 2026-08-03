export function dfsOrder(node) {
  const result = [node.id];
  for (const child of node.children || []) {
    result.push(...dfsOrder(child));
  }
  return result;
}

export function computeBands(roots) {
  return roots.map(root => ({ rootId: root.id, ids: dfsOrder(root) }));
}

export function computeYearDomain(bands, index, paddingYears = 3) {
  const years = bands.flatMap(band => band.ids.map(id => index.get(id).periode.debut));
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years) + paddingYears;
  return [minYear, maxYear];
}
