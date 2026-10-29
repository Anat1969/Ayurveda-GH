import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

// מודלים אנטומיים אמיתיים מ-BodyParts3D (DBCLS), CC BY 4.0.
// הקובץ נבנה ב-scripts/pack-anatomy.cjs: איברים ממוזגים, מפושטים בשמירת צורה ומכווצים (meshopt).
// יחידות הסצנה: 2 יחידות למטר, כפות הרגליים ב-y=0, הגוף פונה אל +z, ימין הגוף בצד שמאל של המסך.
export const SOURCE = 'BodyParts3D, © The Database Center for Life Science, CC BY 4.0';
export const UNITS_PER_M = 2;

let promise = null;
let cache = null;

export function loadBody() {
  if (cache) return Promise.resolve(cache);
  if (!promise) {
    promise = (async () => {
      const [man, buf] = await Promise.all([
        fetch('/anatomy/body.json').then((r) => r.json()),
        fetch('/anatomy/body.bin').then((r) => r.arrayBuffer()),
      ]);
      await MeshoptDecoder.ready;
      const { center, half } = man;
      const skin = man.organs.find((o) => o.id === 'skin');
      const out = {};
      let minZ = Infinity;
      const raw = {};
      for (const o of man.organs) {
        const vq = new Uint8Array(o.vcount * 8);
        MeshoptDecoder.decodeVertexBuffer(vq, o.vcount, 8, new Uint8Array(buf, o.v[0], o.v[1]));
        const q = new Int16Array(vq.buffer);
        const pos = new Float32Array(o.vcount * 3);
        for (let i = 0; i < o.vcount; i++) {
          const x = (q[i * 4] / 32767) * half + center[0];
          const y = (q[i * 4 + 1] / 32767) * half + center[1];
          const z = (q[i * 4 + 2] / 32767) * half + center[2];
          pos[i * 3] = x;
          pos[i * 3 + 1] = z;
          pos[i * 3 + 2] = -y;
          if (o === skin) minZ = Math.min(minZ, z);
        }
        const ib = new Uint8Array(o.icount * 4);
        MeshoptDecoder.decodeIndexBuffer(ib, o.icount, 4, new Uint8Array(buf, o.i[0], o.i[1]));
        raw[o.id] = { pos, idx: new Uint32Array(ib.buffer) };
      }
      const k = UNITS_PER_M / 1000;
      // מרכז הגוף על ציר y, כפות הרגליים ב-0
      const sk = raw.skin.pos;
      let cx = 0;
      let cz = 0;
      for (let i = 0; i < sk.length; i += 3) { cx += sk[i]; cz += sk[i + 2]; }
      cx /= sk.length / 3;
      cz /= sk.length / 3;
      for (const [id, r] of Object.entries(raw)) {
        for (let i = 0; i < r.pos.length; i += 3) {
          r.pos[i] = (r.pos[i] - cx) * k;
          r.pos[i + 1] = (r.pos[i + 1] - minZ) * k;
          r.pos[i + 2] = (r.pos[i + 2] - cz) * k;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(r.pos, 3));
        g.setIndex(new THREE.BufferAttribute(r.idx, 1));
        g.computeVertexNormals();
        g.computeBoundingBox();
        g.computeBoundingSphere();
        out[id] = g;
      }
      out.height = out.skin.boundingBox.max.y;
      cache = out;
      return out;
    })();
  }
  return promise;
}

export function useBody() {
  const [b, setB] = useState(cache);
  useEffect(() => {
    let on = true;
    if (!b) loadBody().then((x) => on && setB(x)).catch(() => {});
    return () => { on = false; };
  }, []);
  return b;
}

export const centerOf = (g) => {
  const c = new THREE.Vector3();
  g.boundingBox.getCenter(c);
  return c;
};
