// אריזת מודלים אנטומיים מ-BodyParts3D לקובץ אחד קומפקטי לדפדפן.
// שימוש: node pack-anatomy.cjs <bp3d-dir> <out-dir>
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { MeshoptSimplifier, MeshoptEncoder } = require('meshoptimizer');

const [, , SRC, OUT] = process.argv;
const ZIP = path.join(SRC, 'partof.zip');

// איבר = קבוצת מושגים ב-FMA, ומספר משולשים מקסימלי אחרי פישוט
const ORGANS = [
  { id: 'skin', names: ['skin'], tris: 46000 },
  { id: 'bones', names: ['rib cage', 'vertebral column', 'sternum', 'right clavicle', 'left clavicle', 'right hip bone', 'left hip bone', 'sacrum', 'skull', 'right scapula', 'left scapula', 'right humerus', 'left humerus', 'right femur', 'left femur'], tris: 70000 },
  { id: 'brain', names: ['brain'], tris: 12000 },
  { id: 'lungR', names: ['right lung'], tris: 16000 },
  { id: 'lungL', names: ['left lung'], tris: 14000 },
  { id: 'airway', names: ['tracheobronchial tree'], tris: 14000 },
  { id: 'heart', names: ['heart'], tris: 12000 },
  { id: 'esophagus', names: ['esophagus'], tris: 2500 },
  { id: 'diaphragm', names: ['diaphragm'], tris: 5000 },
  { id: 'liver', names: ['liver', 'gallbladder'], tris: 10000 },
  { id: 'stomach', names: ['stomach'], tris: 6000 },
  { id: 'pancreas', names: ['pancreas'], tris: 3000 },
  { id: 'small', names: ['duodenum', 'jejunum', 'ileum'], tris: 26000 },
  { id: 'large', names: ['large intestine', 'cecum', 'appendix', 'rectum'], tris: 14000 },
  { id: 'kidneys', names: ['right kidney', 'left kidney'], tris: 5000 },
  { id: 'bladder', names: ['urinary bladder'], tris: 1500 },
];

const parts = fs.readFileSync(path.join(SRC, 'element_parts.txt'), 'utf8').split('\n').slice(1).map((l) => l.split('\t'));
const byName = {};
for (const [, name, fj] of parts) if (name && fj) (byName[name] ||= []).push(fj.trim());

function readObj(fj) {
  const txt = execFileSync('unzip', ['-p', ZIP, `partof_BP3D_4.0_obj_99/${fj}.obj`], { maxBuffer: 1 << 28 }).toString();
  const v = [];
  const f = [];
  for (const line of txt.split('\n')) {
    if (line.startsWith('v ')) {
      const [, x, y, z] = line.trim().split(/\s+/);
      v.push(+x, +y, +z);
    } else if (line.startsWith('f ')) {
      const ids = line.trim().split(/\s+/).slice(1).map((t) => parseInt(t, 10) - 1);
      for (let k = 1; k + 1 < ids.length; k++) f.push(ids[0], ids[k], ids[k + 1]);
    }
  }
  return { v, f };
}

function weld(pos, idx) {
  const map = new Map();
  const outP = [];
  const remap = new Uint32Array(pos.length / 3);
  for (let i = 0; i < pos.length / 3; i++) {
    const key = `${Math.round(pos[i * 3] * 20)},${Math.round(pos[i * 3 + 1] * 20)},${Math.round(pos[i * 3 + 2] * 20)}`;
    let n = map.get(key);
    if (n === undefined) {
      n = outP.length / 3;
      map.set(key, n);
      outP.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    }
    remap[i] = n;
  }
  const outI = new Uint32Array(idx.length);
  for (let i = 0; i < idx.length; i++) outI[i] = remap[idx[i]];
  return { pos: new Float32Array(outP), idx: outI };
}

function compact(pos, idx) {
  const used = new Int32Array(pos.length / 3).fill(-1);
  const outP = [];
  const outI = new Uint32Array(idx.length);
  for (let i = 0; i < idx.length; i++) {
    let n = used[idx[i]];
    if (n < 0) {
      n = used[idx[i]] = outP.length / 3;
      outP.push(pos[idx[i] * 3], pos[idx[i] * 3 + 1], pos[idx[i] * 3 + 2]);
    }
    outI[i] = n;
  }
  return { pos: new Float32Array(outP), idx: outI };
}

(async () => {
  await MeshoptSimplifier.ready;
  await MeshoptEncoder.ready;
  // גבולות הגוף לפי העור: מ"מ, z למעלה
  const meshes = [];
  for (const o of ORGANS) {
    const ids = o.names.flatMap((n) => byName[n] || []);
    if (!ids.length) throw new Error(`no parts for ${o.id}`);
    const P = [];
    const I = [];
    for (const fj of ids) {
      const { v, f } = readObj(fj);
      const base = P.length / 3;
      for (const x of v) P.push(x);
      for (const x of f) I.push(x + base);
    }
    let { pos, idx } = weld(new Float32Array(P), new Uint32Array(I));
    const before = idx.length / 3;
    if (idx.length / 3 > o.tris) {
      const [simp] = MeshoptSimplifier.simplify(idx, pos, 3, o.tris * 3, 0.02, []);
      ({ pos, idx } = compact(pos, simp));
    } else ({ pos, idx } = compact(pos, idx));
    console.log(o.id, ids.length, 'parts', before, '->', idx.length / 3, 'tris', pos.length / 3, 'verts');
    meshes.push({ id: o.id, pos, idx });
  }
  // קוונטיזציה משותפת לכל הגוף
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];
  for (const m of meshes) for (let i = 0; i < m.pos.length; i += 3) for (let a = 0; a < 3; a++) {
    min[a] = Math.min(min[a], m.pos[i + a]);
    max[a] = Math.max(max[a], m.pos[i + a]);
  }
  const center = min.map((v, a) => (v + max[a]) / 2);
  const half = Math.max(...max.map((v, a) => (v - min[a]) / 2));
  const chunks = [];
  let offset = 0;
  const manifest = { source: 'BodyParts3D, © The Database Center for Life Science, CC BY 4.0', units: 'mm', up: 'z', center, half, organs: [] };
  for (const m of meshes) {
    const n = m.pos.length / 3;
    const q = new Int16Array(n * 4);
    for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) q[i * 4 + a] = Math.round(((m.pos[i * 3 + a] - center[a]) / half) * 32767);
    const vb = MeshoptEncoder.encodeVertexBuffer(new Uint8Array(q.buffer), n, 8);
    const ib = MeshoptEncoder.encodeIndexBuffer(new Uint8Array(new Uint32Array(m.idx).buffer), m.idx.length, 4);
    manifest.organs.push({ id: m.id, vcount: n, icount: m.idx.length, v: [offset, vb.length], i: [offset + vb.length, ib.length] });
    chunks.push(Buffer.from(vb), Buffer.from(ib));
    offset += vb.length + ib.length;
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'body.bin'), Buffer.concat(chunks));
  fs.writeFileSync(path.join(OUT, 'body.json'), JSON.stringify(manifest, null, 1));
  console.log('bytes', offset);
})();
