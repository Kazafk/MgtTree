export function assertEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${message || 'Assertion échouée'}\n  attendu: ${e}\n  obtenu:  ${a}`);
  }
}

export function assertThrows(fn, message) {
  try {
    fn();
  } catch (e) {
    return;
  }
  throw new Error(message || 'Attendu une exception, aucune levée');
}
