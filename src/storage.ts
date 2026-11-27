/** Access browser storage defensively: privacy modes and quota policies can throw. */
export function readLocal(key: string): string | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage.getItem(key); }
  catch { return null; }
}

export function writeLocal(key: string, value: string): boolean {
  try { if (typeof localStorage === 'undefined') return false; localStorage.setItem(key, value); return true; }
  catch { return false; }
}
