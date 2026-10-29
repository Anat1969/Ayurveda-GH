import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { Stage3D, Holo, Smoke, FloatLabel, Ring, DrawLine, HOLO } from './kit.jsx';
import { Claim } from '../components/Shell.jsx';

// גוף האדם כהולוגרמה: מעטפת שקופה שזוהרת בשוליים, שלד דק, ואיברים מוארים.
// שתי שכבות שלא מתערבבות: האנטומיה (מיקום האיברים לפי אנטומיה מקובלת, בדגם סכמטי)
// ומעליה מושבי הדושות לפי המסורת, מסומנים כמסורת.

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const tube = (pts, r, seg = 200, radial = 12, closed = false) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed, 'catmullrom', 0.4), seg, r, radial, closed);

// מעי גס עם קפלים (האוסטרה): רדיוס שמשתנה לאורך הצינור
function haustra(geo, r, radial, every = 0.55) {
  const p = geo.attributes.position;
  const n = geo.attributes.normal;
  const ring = radial + 1;
  for (let i = 0; i < p.count; i++) {
    const k = Math.floor(i / ring);
    const bump = Math.abs(Math.sin(k * every)) * r * 0.32;
    p.setXYZ(i, p.getX(i) + n.getX(i) * bump, p.getY(i) + n.getY(i) * bump, p.getZ(i) + n.getZ(i) * bump);
  }
  geo.computeVertexNormals();
  return geo;
}

// עץ הסימפונות: ענפים שמתפצלים בתוך הריאה
function bronchi(start, dir, len, r, depth, out, seed) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const grow = (p, d, l, rr, dd) => {
    const end = p.clone().add(d.clone().multiplyScalar(l));
    const mid = p.clone().lerp(end, 0.5).add(V((rnd() - 0.5) * 0.03, (rnd() - 0.5) * 0.03, (rnd() - 0.5) * 0.03));
    out.push({ pts: [p, mid, end], r: rr });
    if (dd <= 0) return;
    for (const sgn of [-1, 1]) {
      const nd = d.clone().applyAxisAngle(V(0, 0, 1), sgn * (0.45 + rnd() * 0.35)).applyAxisAngle(V(1, 0, 0), (rnd() - 0.5) * 0.9).normalize();
      grow(end, nd, l * (0.68 + rnd() * 0.12), rr * 0.68, dd - 1);
    }
  };
  grow(start, dir, len, r, depth);
}

function useAnatomy() {
  return useMemo(() => {
    // מעטפת הגוף: גו מסובב, בקנה מידה עמוק פחות מרוחב
    const prof = [[0.0, 0.56], [0.25, 0.64], [0.55, 0.6], [0.85, 0.53], [1.15, 0.56], [1.5, 0.64], [1.85, 0.7], [2.1, 0.72], [2.3, 0.66], [2.42, 0.42], [2.5, 0.16]];
    const torsoPts = prof.map(([y, r]) => new THREE.Vector2(r, y));
    const torso = new THREE.LatheGeometry(new THREE.SplineCurve(torsoPts).getPoints(60), 72);

    // צלעות: עשרה זוגות סביב בית החזה
    const ribs = [];
    for (let k = 0; k < 10; k++) {
      const y0 = 2.12 - k * 0.105;
      const rx = 0.36 + Math.sin(((k + 1) / 11) * Math.PI) * 0.26;
      for (const sgn of [-1, 1]) {
        const pts = [];
        for (let i = 0; i <= 20; i++) {
          const t = (i / 20) * Math.PI * (k > 7 ? 0.62 : 0.86);
          pts.push(V(sgn * (Math.sin(t) * rx + 0.03), y0 - Math.pow(t / Math.PI, 1.6) * 0.32, -Math.cos(t) * 0.32));
        }
        ribs.push(pts);
      }
    }
    const spine = Array.from({ length: 26 }, (_, i) => {
      const y = 0.2 + i * 0.09;
      return V(0, y, -0.3 + Math.sin(y * 1.6) * 0.04);
    });

    // דרכי הנשימה
    const trachea = tube([V(0, 2.95, 0.06), V(0, 2.55, 0.06), V(0, 2.12, 0.04)], 0.045, 40);
    const branches = [];
    bronchi(V(0, 2.12, 0.04), V(0.62, -0.78, 0).normalize(), 0.22, 0.032, 4, branches, 11);
    bronchi(V(0, 2.12, 0.04), V(-0.62, -0.78, 0).normalize(), 0.24, 0.034, 4, branches, 29);
    const bronchiGeo = branches.map((b) => tube(b.pts, Math.max(b.r, 0.006), 12, 6));

    // מערכת העיכול
    const esophagus = tube([V(0, 2.95, -0.04), V(0.02, 2.4, -0.1), V(0.06, 1.8, -0.06), V(0.16, 1.38, 0.02)], 0.035, 60);
    const stomach = tube([V(0.16, 1.4, 0.02), V(0.36, 1.33, 0.08), V(0.46, 1.16, 0.12), V(0.38, 0.98, 0.14), V(0.18, 0.94, 0.14), V(0.02, 1.0, 0.12)], 0.1, 80, 16);
    // מעי דק: לולאות צפופות במרכז הבטן
    const small = [];
    const rows = 6;
    for (let r = 0; r < rows; r++) {
      const y = 0.86 - r * 0.1;
      const dir = r % 2 ? -1 : 1;
      for (let i = 0; i <= 26; i++) {
        const u = i / 26;
        const x = dir * (-0.3 + u * 0.6);
        small.push(V(x + Math.sin(u * Math.PI * 9 + r) * 0.035, y + Math.sin(u * Math.PI * 7 + r * 2) * 0.035, 0.16 + Math.cos(u * Math.PI * 5 + r) * 0.06));
      }
    }
    const smallGeo = tube(small, 0.04, 900, 10);
    // מעי גס: עולה, רוחבי, יורד, סיגמואידי, חלחולת
    const colonPts = [V(-0.42, 0.2, 0.1), V(-0.47, 0.55, 0.08), V(-0.45, 0.95, 0.06), V(-0.2, 1.0, 0.16), V(0, 0.93, 0.2), V(0.22, 1.0, 0.16), V(0.46, 0.96, 0.06), V(0.48, 0.55, 0.06), V(0.43, 0.2, 0.08), V(0.25, 0.08, 0.12), V(0.06, 0.06, 0.08), V(0.02, -0.2, 0.0)];
    const colonGeo = haustra(tube(colonPts, 0.075, 320, 14), 0.075, 14);
    // כבד
    const liver = new THREE.SphereGeometry(1, 40, 28);
    return { torso, ribs, spine, trachea, bronchiGeo, esophagus, stomach, smallGeo, colonGeo, liver };
  }, []);
}

const SEATS = [
  { d: 'kapha', n: 1, name: 'קאפה', seat: 'חזה וקיבה', sk: 'Uras, Amashaya', role: 'מבנה, סיכה וחוסן', organs: ['lungs', 'stomach', 'heart'], ring: { c: [0, 1.62, 0.05], rx: 0.82, rz: 0.42 }, label: [-1.95, 2.15, 0], anchor: [-0.55, 1.75, 0.1] },
  { d: 'pitta', n: 2, name: 'פיטה', seat: 'מעי דק', sk: 'Grahani', role: 'עיכול, חום והמרה', organs: ['small', 'liver'], ring: { c: [0, 0.6, 0.12], rx: 0.6, rz: 0.34 }, label: [1.95, 0.95, 0], anchor: [0.4, 0.66, 0.18] },
  { d: 'vata', n: 3, name: 'ואטה', seat: 'מעי גס ואגן', sk: 'Pakvashaya', role: 'תנועה, נשימה והפרשה', organs: ['colon'], ring: { c: [0, 0.12, 0.06], rx: 0.66, rz: 0.36 }, label: [-1.95, 0.15, 0], anchor: [-0.48, 0.3, 0.1] },
];
const ORGAN_NAME = { lungs: 'ריאות', heart: 'לב', stomach: 'קיבה', liver: 'כבד', small: 'מעי דק', colon: 'מעי גס' };
const ORGAN_AT = { lungs: [0.62, 1.95, 0.2], heart: [0.12, 1.52, 0.3], stomach: [0.62, 1.18, 0.2], liver: [-0.62, 1.28, 0.2], small: [0, 0.62, 0.35], colon: [0.62, 0.3, 0.2] };

function Breath({ children, on = true }) {
  const reduce = useReducedMotion();
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current || reduce || !on) return;
    const k = 1 + Math.sin(s.clock.elapsedTime * 0.9) * 0.035;
    ref.current.scale.set(k, k * 1.02, k);
  });
  return <group ref={ref}>{children}</group>;
}
function Beat({ children }) {
  const reduce = useReducedMotion();
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current || reduce) return;
    const t = (s.clock.elapsedTime * 1.15) % 1;
    const k = 1 + (t < 0.12 ? Math.sin((t / 0.12) * Math.PI) * 0.12 : 0);
    ref.current.scale.setScalar(k);
  });
  return <group ref={ref}>{children}</group>;
}
function Sway({ children }) {
  const reduce = useReducedMotion();
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current || reduce) return;
    ref.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.18) * 0.32;
  });
  return <group ref={ref}>{children}</group>;
}

function Body({ active }) {
  const a = useAnatomy();
  const lit = (organ) => !active || SEATS.find((s) => s.d === active).organs.includes(organ);
  const k = (organ) => (lit(organ) ? 1 : 0.28);
  const BODY = HOLO.body;
  return (
    <Sway>
      {/* מעטפת הגוף */}
      <mesh geometry={a.torso} scale={[1, 1, 0.58]}><Holo color={BODY} base={0.015} glow={1.1} power={2.6} /></mesh>
      {[-1, 1].map((sg) => (
        <group key={sg}>
          <mesh position={[sg * 0.72, 2.22, 0]} scale={[0.24, 0.2, 0.2]}><sphereGeometry args={[1, 32, 24]} /><Holo color={BODY} base={0.01} glow={1} power={2.6} /></mesh>
          <mesh position={[sg * 0.86, 1.55, -0.02]} rotation={[0, 0, sg * 0.08]}><capsuleGeometry args={[0.12, 1.1, 8, 24]} /><Holo color={BODY} base={0.005} glow={0.55} power={3} opacity={0.7} /></mesh>
          <mesh position={[sg * 0.3, -0.4, 0]}><capsuleGeometry args={[0.24, 0.6, 8, 24]} /><Holo color={BODY} base={0.005} glow={0.6} power={3} opacity={0.6} /></mesh>
        </group>
      ))}
      <mesh position={[0, 2.66, -0.02]}><cylinderGeometry args={[0.15, 0.17, 0.32, 32, 1, true]} /><Holo color={BODY} base={0.01} glow={1} power={2.6} /></mesh>
      <mesh position={[0, 3.06, 0.02]} scale={[0.24, 0.31, 0.27]}><sphereGeometry args={[1, 48, 40]} /><Holo color={BODY} base={0.015} glow={1.2} power={2.4} /></mesh>

      {/* שלד: עמוד שדרה, צלעות, עצם החזה ועצמות הבריח */}
      <Line points={a.spine} color="#BFE6FF" lineWidth={2.4} transparent opacity={0.45} />
      {a.spine.map((p, i) => (
        <mesh key={i} position={p}><boxGeometry args={[0.07, 0.05, 0.06]} /><Holo color="#BFE6FF" base={0.08} glow={0.9} /></mesh>
      ))}
      {a.ribs.map((r, i) => <Line key={i} points={r} color="#9FD4FF" lineWidth={1.4} transparent opacity={0.42} />)}
      <Line points={[V(0, 2.22, 0.32), V(0, 1.5, 0.33)]} color="#9FD4FF" lineWidth={2} transparent opacity={0.4} />
      {[-1, 1].map((sg) => <Line key={sg} points={[V(0, 2.26, 0.26), V(sg * 0.38, 2.34, 0.18), V(sg * 0.72, 2.3, 0.04)]} color="#9FD4FF" lineWidth={1.6} transparent opacity={0.45} />)}
      {[-1, 1].map((sg) => <Line key={`p${sg}`} points={[V(sg * 0.06, 0.05, -0.2), V(sg * 0.42, 0.35, -0.05), V(sg * 0.5, 0.22, 0.1), V(sg * 0.22, -0.06, 0.18)]} color="#9FD4FF" lineWidth={1.4} transparent opacity={0.35} />)}

      {/* נשימה: קנה, סימפונות וריאות */}
      <mesh geometry={a.trachea}><Holo color="#FF8A4D" base={0.3 * k('lungs')} glow={1.2 * k('lungs')} /></mesh>
      {a.bronchiGeo.map((g, i) => <mesh key={i} geometry={g}><Holo color="#FF7A45" base={0.35 * k('lungs')} glow={1.1 * k('lungs')} /></mesh>)}
      <Breath>
        {[-1, 1].map((sg) => (
          <mesh key={sg} position={[sg * 0.37, 1.8, 0.02]} scale={[sg > 0 ? 0.3 : 0.32, 0.5, 0.27]}>
            <sphereGeometry args={[1, 48, 40]} />
            <Holo color={HOLO.lung} base={0.1 * k('lungs')} glow={1.5 * k('lungs')} power={1.8} />
          </mesh>
        ))}
      </Breath>
      <group position={[0.1, 1.55, 0.14]}>
        <Beat><mesh scale={[0.14, 0.17, 0.13]} rotation={[0, 0, -0.4]}><sphereGeometry args={[1, 32, 24]} /><Holo color="#FF3D5A" base={0.35 * k('heart')} glow={1.4 * k('heart')} /></mesh></Beat>
      </group>

      {/* עיכול */}
      <mesh geometry={a.esophagus}><Holo color="#4FA3FF" base={0.2} glow={1} /></mesh>
      <mesh geometry={a.liver} position={[-0.3, 1.24, 0.08]} scale={[0.42, 0.2, 0.26]} rotation={[0, 0, -0.18]}>
        <Holo color="#D9673A" base={0.14 * k('liver')} glow={1.3 * k('liver')} power={1.8} />
      </mesh>
      <mesh geometry={a.stomach}><Holo color="#3FC3E8" base={0.22 * k('stomach')} glow={1.3 * k('stomach')} flow={0.6 * k('stomach')} /></mesh>
      <mesh geometry={a.smallGeo}><Holo color="#FFB03A" base={0.3 * k('small')} glow={1.3 * k('small')} flow={1 * k('small')} /></mesh>
      <mesh geometry={a.colonGeo}><Holo color="#FF7A2E" base={0.28 * k('colon')} glow={1.4 * k('colon')} flow={0.8 * k('colon')} /></mesh>
    </Sway>
  );
}

export function AnatomyScene({ highlight = null }) {
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const active = hover || pinned || highlight;
  const shown = SEATS.find((z) => z.d === active);
  return (
    <figure className="viz scene anatomy3d">
      <div className="anatomy3d-layout">
        <Stage3D camera={[0, 0.7, 6]} target={[0, 1.3, 0]} size={[5.2, 4.3]} label="גוף האדם: איברי הנשימה והעיכול, ומושבי הדושות לפי המסורת" shadowY={-0.9} shadowScale={8}>
          <Body active={active} />
          <Smoke at={[0, 3.35, 0]} />
          {SEATS.map((z, i) => {
            const on = !active || active === z.d;
            return (
              <group key={z.d}>
                {on && <Ring key={`${z.d}-${active}`} center={z.ring.c} rx={z.ring.rx} rz={z.ring.rz} color={HOLO[z.d]} width={active === z.d ? 2 : 1.2} delay={0.4 + i * 0.3} dashed={!active} />}
                <DrawLine points={[z.anchor, [z.label[0] * 0.66, z.label[1] - 0.12, 0]]} color={HOLO[z.d]} width={1} opacity={on ? 0.85 : 0.2} delay={0.8 + i * 0.3} />
                <FloatLabel position={z.label} title={`${z.n} · ${z.name}`} sub={`${z.seat} · ${z.sk}`} tone={HOLO[z.d]} size="l" active={active === z.d} delay={1 + i * 0.3} />
              </group>
            );
          })}
          {shown && shown.organs.map((o) => (
            <FloatLabel key={`${active}-${o}`} position={ORGAN_AT[o]} title={ORGAN_NAME[o]} tone={HOLO.ink} size="s" delay={0.2} />
          ))}
        </Stage3D>
        <ol className="seat-list" aria-label="מושבי הדושות">
          {SEATS.map((z) => (
            <li key={z.d}>
              <button
                type="button" className={`seat d-${z.d}`} aria-pressed={pinned === z.d}
                onMouseEnter={() => setHover(z.d)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(z.d)} onBlur={() => setHover(null)}
                onClick={() => setPinned(pinned === z.d ? null : z.d)}
              >
                <span className="mono seat-n">{z.n}</span>
                <span>
                  <span className="dosha-name seat-name">{z.name}</span>
                  <span className="seat-place">{z.seat}</span>
                  <span className="seat-role">{z.role}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <figcaption>
        <Claim type="research" /> מיקום האיברים לפי אנטומיה מקובלת, בדגם סכמטי ולא כאטלס. <Claim type="tradition" /> הטבעות הן מושבי הדושות העיקריים לפי צ׳ראקה ואשטאנגה הרידאיה. גררו כדי לסובב.
        <a className="credit" href="/anatomy/digestive.svg" target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 5 }}>לאיור האנטומי המלא: Mariana Ruiz (LadyofHats), נחלת הכלל, Wikimedia Commons</a>
      </figcaption>
    </figure>
  );
}
