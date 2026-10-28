// זיהוי WebGL, בלי לטעון את three.js. בלי WebGL מוצגת ההמחשה השטוחה כגיבוי.
let webgl = null;
export function hasWebGL() {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement('canvas');
    webgl = Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    webgl = false;
  }
  return webgl;
}
