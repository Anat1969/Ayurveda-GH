// התוצאות נשמרות במכשיר בלבד. שום מידע אישי לא נשלח לשרת.
const KEYS = { prakriti: 'ayur.prakriti.v1', vikriti: 'ayur.vikriti.v1' };

function read(kind) {
  try {
    const raw = localStorage.getItem(KEYS[kind]);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(kind, list) {
  try {
    localStorage.setItem(KEYS[kind], JSON.stringify(list));
    window.dispatchEvent(new Event('ayur-storage'));
    return true;
  } catch {
    return false;
  }
}

export const loadResults = (kind) => read(kind);
export const latestResult = (kind) => read(kind)[0] || null;

export function saveResult(kind, entry) {
  const item = { id: `${Date.now()}`, date: new Date().toISOString(), ...entry };
  return write(kind, [item, ...read(kind)].slice(0, 30)) ? item : null;
}

export const deleteResult = (kind, id) => write(kind, read(kind).filter((r) => r.id !== id));
export const clearResults = () => write('prakriti', []) && write('vikriti', []);
