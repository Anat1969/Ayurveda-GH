import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import {
  CLOCK, CLOCK_TEXT, ROUTINE_MARKS, dosha24, MONTHS, MONTH_DOSHA, SEASON_TEXT, DHATUS, AGNI_STATES, CONCEPT_LINKS, GROUP_COLOR,
} from '../data/viz.js';
import { CONCEPTS, GROUPS } from '../data/concepts.js';
import { go } from '../lib/router.js';
import { Stage3D, useColors, ElementObject, BodySculpture, Plinth, Arrow, Ring, FloatLabel, Hover, DrawLine, Brass, Glass, Holo, BUILD3D } from './kit.jsx';
import { Claim } from '../components/Shell.jsx';

const DNAME = { vata: 'ואטה', pitta: 'פיטה', kapha: 'קאפה' };
const ORDER = ['vata', 'pitta', 'kapha'];
const tintOf = (c, d) => c[`${d}-tint`] || c[d];
// "var(--ember)" -> צבע ממשי
const res = (c, v, fb) => {
  if (!v) return fb;
  const m = /var\(--([\w-]+)/.exec(v);
  return m ? c[m[1]] || fb : v;
};
const ease = (a, b, k = 0.08) => a + (b - a) * k;

// ======================= משולש החוקה כפריזמה מזכוכית =======================
const V2 = { pitta: [250, 60], vata: [450, 406], kapha: [50, 406] };
const to3 = ([x, y]) => [((x - 250) / 100) * 0.95, ((y - 290) / 100) * 0.95];
function shares(pct) {
  const s = (pct.vata || 0) + (pct.pitta || 0) + (pct.kapha || 0);
  if (!s) return { vata: 1 / 3, pitta: 1 / 3, kapha: 1 / 3 };
  return { vata: pct.vata / s, pitta: pct.pitta / s, kapha: pct.kapha / s };
}
export function proj3(pct) {
  const s = shares(pct);
  const x = s.vata * V2.vata[0] + s.pitta * V2.pitta[0] + s.kapha * V2.kapha[0];
  const y = s.vata * V2.vata[1] + s.pitta * V2.pitta[1] + s.kapha * V2.kapha[1];
  return to3([x, y]);
}
const REGIONS = [
  { t: 'ואטה', s: { vata: 0.74, pitta: 0.13, kapha: 0.13 } },
  { t: 'פיטה', s: { vata: 0.13, pitta: 0.74, kapha: 0.13 } },
  { t: 'קאפה', s: { vata: 0.13, pitta: 0.13, kapha: 0.74 } },
  { t: 'ואטה-פיטה', s: { vata: 0.44, pitta: 0.44, kapha: 0.12 } },
  { t: 'פיטה-קאפה', s: { vata: 0.12, pitta: 0.44, kapha: 0.44 } },
  { t: 'ואטה-קאפה', s: { vata: 0.44, pitta: 0.12, kapha: 0.44 } },
  { t: 'שלוש הדושות', s: { vata: 1 / 3, pitta: 1 / 3, kapha: 1 / 3 } },
];
const OUTV = { pitta: [0, -1], vata: [0.87, 0.5], kapha: [-0.87, 0.5] };

function Bead({ target, color, r = 0.11, pulse, label, below, c }) {
  const reduce = useReducedMotion();
  const g = useRef();
  const halo = useRef();
  const first = useRef(true);
  useFrame((s) => {
    if (!g.current) return;
    if (first.current || reduce) { g.current.position.set(target[0], 0.32, target[1]); first.current = false; }
    else {
      g.current.position.x = ease(g.current.position.x, target[0], 0.06);
      g.current.position.z = ease(g.current.position.z, target[1], 0.06);
    }
    if (halo.current && !reduce) {
      const k = (s.clock.elapsedTime * 0.25) % 1;
      halo.current.scale.setScalar(1 + k * 2.2);
      halo.current.material.opacity = 0.6 * (1 - k);
    }
  });
  return (
    <group ref={g}>
      <mesh><sphereGeometry args={[r, 32, 32]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.25} metalness={0.2} /></mesh>
      <mesh position={[0, -0.16, 0]}><cylinderGeometry args={[0.006, 0.006, 0.32, 6]} /><meshBasicMaterial color={color} transparent opacity={0.6} /></mesh>
      {pulse && (
        <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
          <ringGeometry args={[r * 1.1, r * 1.25, 48]} /><meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
      {label && <FloatLabel position={[0, below ? -0.62 : 0.42, below ? 0.3 : 0]} title={label} tone={color} size="s" />}
    </group>
  );
}

export function PrismScene({ points = [], arrow = null, trail = [], regions = false, label, className = '' }) {
  const c = useColors();
  const geo = useMemo(() => {
    const sh = new THREE.Shape();
    const P = ['pitta', 'vata', 'kapha'].map((d) => to3(V2[d]));
    sh.moveTo(P[0][0], P[0][1]);
    sh.lineTo(P[1][0], P[1][1]);
    sh.lineTo(P[2][0], P[2][1]);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.04, bevelSegments: 3 });
    g.rotateX(Math.PI / 2);
    g.translate(0, 0.16, 0);
    return g;
  }, []);
  const focus = points.find((p) => p.pulse) || points[0];
  const fp = focus ? proj3(focus.pct) : [0, 0];
  const edge = ['pitta', 'vata', 'kapha', 'pitta'].map((d) => { const p = to3(V2[d]); return [p[0], 0.2, p[1]]; });
  return (
    <figure className={`viz scene ternary3d ${className}`}>
      <Stage3D camera={[0, 5.2, 4.6]} target={[0, 0, -0.3]} size={[6.5, 4.7]} label={label || 'משולש הדושות'}>
        <mesh geometry={geo} position={[0, 0.2, 0]}><Glass color="#F6EFE2" thickness={0.5} rough={0.06} /></mesh>
        <DrawLine points={edge} color={c.brass} width={1.6} />
        {/* קרן אור אחת נכנסת, ושלוש יוצאות מהקודקודים */}
        <DrawLine points={[[3.6, 1.8, -1.6], [fp[0], 0.3, fp[1]]]} color={c.ember} width={1.2} flow delay={0.3} opacity={0.7} />
        {ORDER.map((d) => {
          const p = to3(V2[d]);
          const o = OUTV[d];
          return <DrawLine key={d} points={[[p[0], 0.22, p[1]], [p[0] + o[0] * 0.55, 0.22, p[1] + o[1] * 0.55]]} color={c[d]} width={2.4} delay={0.8} />;
        })}
        {ORDER.map((d) => {
          const p = to3(V2[d]);
          const o = OUTV[d];
          return <FloatLabel key={d} position={[p[0] + o[0] * 0.8, 0.3, p[1] + o[1] * 0.75]} title={DNAME[d]} tone={c[d]} size="l" delay={0.6} />;
        })}
        {regions && REGIONS.map((r, i) => {
          const p = proj3(r.s);
          return <FloatLabel key={r.t} position={[p[0], 0.32, p[1]]} title={r.t} tone={c.ink} size="s" delay={0.9 + i * 0.1} />;
        })}
        {trail.length > 1 && <DrawLine points={trail.map((t) => { const p = proj3(t); return [p[0], 0.31, p[1]]; })} color={c.muted} width={1} dashed />}
        {trail.map((t, i) => {
          const p = proj3(t);
          return <mesh key={i} position={[p[0], 0.31, p[1]]}><sphereGeometry args={[0.045, 16, 16]} /><meshBasicMaterial color={c.muted} transparent opacity={0.3 + (0.5 * i) / trail.length} /></mesh>;
        })}
        {arrow && (() => {
          const a = proj3(arrow[0]);
          const b = proj3(arrow[1]);
          return <Arrow key={`${a.join()}-${b.join()}`} from={[a[0], 0.34, a[1]]} to={[b[0], 0.34, b[1]]} lift={0.5} color={c.ink} width={1.6} delay={0.5} />;
        })()}
        {points.map((p, i) => (
          <Bead key={p.label || i} target={proj3(p.pct)} color={res(c, p.color, c.ink)} r={(p.r || 8) / 70} pulse={p.pulse} label={p.label} below={p.below} c={c} />
        ))}
      </Stage3D>
    </figure>
  );
}

// ======================= שערי הבטיחות =======================
const GATES = [
  { n: 1, r: 2.15, tone: 'alert', q: 'סימן אזהרה', ex: 'כאב בחזה, דם, קוצר נשימה, חולשה בצד אחד', out: 'רופא מיד: מד"א 101 או 112', stop: true },
  { n: 2, r: 1.55, tone: 'alert', q: 'מצוקה נפשית', ex: 'מחשבות על פגיעה עצמית', out: 'ער"ן 1201, בכל שעה', stop: true },
  { n: 3, r: 0.98, tone: 'brass', q: 'תרופה, מינון, הריון, ילדים, מחלה כרונית', ex: '', out: 'הפניה לרופא או לרוקח, ואז הסבר', stop: false },
];
function Messenger({ onGate }) {
  const reduce = useReducedMotion();
  const ref = useRef();
  const stops = [3.3, 2.15, 2.15, 1.55, 1.55, 0.98, 0.98, 0.25, 0.25];
  const times = [0, 0.1, 0.22, 0.32, 0.44, 0.54, 0.66, 0.78, 1];
  const last = useRef(0);
  useFrame((s) => {
    if (!ref.current || reduce) return;
    const k = (s.clock.elapsedTime / 10) % 1;
    let i = times.findIndex((t) => t > k) - 1;
    if (i < 0) i = times.length - 2;
    const f = (k - times[i]) / (times[i + 1] - times[i]);
    const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
    const x = stops[i] + (stops[i + 1] - stops[i]) * e;
    ref.current.position.set(x, 0.18, 0);
    const g = stops[i] === stops[i + 1] ? [2.15, 1.55, 0.98].indexOf(stops[i]) + 1 : 0;
    if (g !== last.current) { last.current = g; onGate(g); }
  });
  return (
    <mesh ref={ref} position={[3.3, 0.18, 0]}>
      <sphereGeometry args={[0.09, 32, 32]} />
      <meshStandardMaterial color="#FFFFFF" emissive="#F3D9A4" emissiveIntensity={1.2} />
    </mesh>
  );
}
export function GatesScene() {
  const c = useColors();
  const [hover, setHover] = useState(null);
  const [live, setLive] = useState(0);
  const lit = hover || live;
  return (
    <figure className="viz scene gates3d">
      <Stage3D camera={[0, 4.6, 5.6]} target={[-0.35, 0.3, 0]} size={[7.0, 4.8]} label="שלושה שערים שכל הודעה עוברת לפני שהיא מגיעה להסבר">
        {GATES.map((g) => (
          g.stop ? (
            <mesh key={g.n} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
              <torusGeometry args={[g.r, lit === g.n ? 0.05 : 0.035, 24, 160]} />
              <meshStandardMaterial color={c[g.tone]} emissive={c[g.tone]} emissiveIntensity={lit === g.n ? 0.8 : 0.1} roughness={0.35} />
            </mesh>
          ) : (
            <group key={g.n}>
              {Array.from({ length: 40 }, (_, k) => {
                const a = (k / 40) * Math.PI * 2;
                return <mesh key={k} position={[Math.cos(a) * g.r, 0.06, Math.sin(a) * g.r]}><sphereGeometry args={[lit === g.n ? 0.05 : 0.038, 12, 12]} /><Brass /></mesh>;
              })}
            </group>
          )
        ))}
        <mesh position={[0, 0.16, 0]} scale={[1, 0.45, 1]}><sphereGeometry args={[0.42, 48, 48]} /><Glass color={c['kapha-tint']} thickness={0.8} tint={1} /></mesh>
        <Messenger onGate={setLive} />
        <DrawLine points={[[3.4, 0.18, 0], [0.3, 0.18, 0]]} color={c.line} width={1} dashed delay={0.4} />
        {GATES.map((g, i) => (
          <DrawLine key={`k${g.n}`} points={[[-g.r * 0.7, 0.09, -g.r * 0.7], [-2.05, 1.92 - i * 0.8, -0.4]]} color={c[g.tone]} width={1} delay={0.3 + i * 0.2} />
        ))}
        {GATES.map((g, i) => (
          <FloatLabel key={g.n} position={[-2.55, 2.05 - i * 0.8, -0.4]} title={`${g.n} · ${g.q.split(',')[0]}`} sub={g.stop ? 'עוצר' : 'מפנה וממשיך'} tone={c[g.tone]} size="s" active={lit === g.n} delay={0.4 + i * 0.2} />
        ))}
        <FloatLabel position={[0, 0.2, 0.85]} title="4 · הסבר" sub="מסומן לפי סוג הטענה" tone={c.kapha} size="s" delay={1.2} />
      </Stage3D>
      <ol className="gate-legend">
        {GATES.map((g) => (
          <li key={g.n} onMouseEnter={() => setHover(g.n)} onMouseLeave={() => setHover(null)} style={{ '--tone': `var(--${g.tone})` }} aria-current={lit === g.n ? 'true' : undefined}>
            <span className="gate-n mono">{g.n}</span>
            <span>
              <b>{g.q}?</b>{g.ex && <span className="muted"> {g.ex}</span>}
              <span className="gate-out">כן: <mark className="hl">{g.out}</mark>{g.stop ? '. המודל לא מופעל.' : '.'}</span>
            </span>
          </li>
        ))}
        <li style={{ '--tone': 'var(--kapha)' }}>
          <span className="gate-n mono">4</span>
          <span><b>עבר את כל השערים</b><span className="gate-out">הסבר מסורתי, מסומן לפי סוג הטענה, עם הפניה קצרה.</span></span>
        </li>
      </ol>
      <figcaption>האור הלבן הוא הודעה. היא נבדקת מבחוץ פנימה, לפני שהיא מגיעה למודל. טבעת מלאה עוצרת אותה, טבעת של פנינים מוסיפה הפניה וממשיכה.</figcaption>
    </figure>
  );
}

// ======================= שעון הדושות: קערת פליז =======================
const hourPos = (h, R, y = 0) => {
  const a = (h / 24) * Math.PI * 2;
  return [Math.sin(a) * R, y, -Math.cos(a) * R];
};
function Bowl({ R = 2, H = 0.75 }) {
  const geo = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const v = i / 40;
      const r = R * (0.42 + 0.58 * Math.sin((v * Math.PI) / 2));
      pts.push(new THREE.Vector2(r, v * H));
    }
    for (let i = 40; i >= 0; i--) {
      const v = i / 40;
      const r = (R - 0.06) * (0.42 + 0.58 * Math.sin((v * Math.PI) / 2));
      pts.push(new THREE.Vector2(r, v * H + 0.05));
    }
    return new THREE.LatheGeometry(pts, 128);
  }, [R, H]);
  return <mesh geometry={geo}><meshStandardMaterial color="#B8893E" metalness={1} roughness={0.26} side={THREE.DoubleSide} /></mesh>;
}
function Hand({ h, R, color }) {
  const reduce = useReducedMotion();
  const hand = useRef();
  useFrame(() => {
    if (!hand.current) return;
    const target = -(h / 24) * Math.PI * 2;
    hand.current.rotation.y = reduce ? target : ease(hand.current.rotation.y, target, 0.04);
  });
  return (
    <group ref={hand} position={[0, 0.66, 0]}>
      <mesh position={[0, 0, -R * 0.45]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.018, 0.018, R * 0.9, 12]} /><Brass /></mesh>
      <mesh position={[0, 0.02, -R * 0.9]}><sphereGeometry args={[0.08, 24, 24]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} /></mesh>
      <mesh><cylinderGeometry args={[0.07, 0.07, 0.05, 24]} /><Brass /></mesh>
    </group>
  );
}
export function ClockScene({ routine = false }) {
  const c = useColors();
  const reduce = useReducedMotion();
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  const cur = dosha24(h);
  const R = 2;
  return (
    <figure className="viz scene">
      <Stage3D camera={[0, 5, 4.2]} target={[0, 0.3, 0]} size={[6.2, 4.8]} label={`שעון הדושות. עכשיו שעת ${DNAME[cur]}`}>
        <Bowl R={R} />
        <mesh position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[R * 0.93, 96]} /><Holo color="#3FC3E8" base={0.16} glow={1.2} /></mesh>
        {CLOCK.map((s) => {
          const on = (h >= s.from && h < s.to) || (h + 24 >= s.from && h + 24 < s.to);
          const a0 = (s.from / 24) * Math.PI * 2;
          const arc = ((s.to - s.from) / 24) * Math.PI * 2;
          return (
            <mesh key={s.from} rotation={[-Math.PI / 2, 0, Math.PI / 2 - a0 - arc]} position={[0, 0.8, 0]}>
              <torusGeometry args={[R + 0.06, on ? 0.07 : 0.045, 16, 64, arc * 0.96]} />
              <meshStandardMaterial color={c[s.d]} roughness={0.4} emissive={c[s.d]} emissiveIntensity={on ? 0.25 : 0.05} />
            </mesh>
          );
        })}
        {CLOCK.map((s) => {
          const mid = (s.from + s.to) / 2;
          return <FloatLabel key={`l${s.from}`} position={hourPos(mid, R + 0.62, 0.8)} title={DNAME[s.d]} sub={`${String(s.from % 24).padStart(2, '0')}–${String(s.to % 24).padStart(2, '0')}`} tone={c[s.d]} size="s" delay={0.3} />;
        })}
        <Hand h={h} R={R} color={c.ember} />
        <FloatLabel position={[0, 1.45, 0]} title={`עכשיו: שעת ${DNAME[cur]}`} sub={CLOCK_TEXT[cur].split('.')[0]} tone={c[cur]} size="l" delay={0.8} />
        {routine && ROUTINE_MARKS.map((m, i) => (
          <group key={m.t}>
            <mesh position={hourPos(m.h, R + 0.06, 0.92)}><sphereGeometry args={[0.07, 24, 24]} /><meshStandardMaterial color="#FFFFFF" emissive="#FFF1CF" emissiveIntensity={1.4} toneMapped={false} /></mesh>
            <FloatLabel position={hourPos(m.h, R - 0.55, 0.95)} title={m.t} tone={c.ink} size="s" delay={1 + i * 0.2} />
          </group>
        ))}
      </Stage3D>
      <figcaption>
        <Claim type="tradition" /> היממה מתחלקת לשני מחזורים של קאפה, פיטה וואטה. המחוג בקערה מראה את השעה עכשיו.{routine ? ' הפנינים על השפה הן השגרה המסורתית: קימה לפני הזריחה, ארוחה עיקרית בצהריים ושינה מוקדמת.' : ''}
      </figcaption>
    </figure>
  );
}

// ======================= מנורת השמן: ארבעת מצבי אגני =======================
const FLAME = {
  sama: { h: 1, w: 1, jitter: 0.04, speed: 3, glow: 1 },
  vishama: { h: 0.9, w: 0.9, jitter: 0.28, speed: 9, glow: 0.8 },
  tikshna: { h: 1.6, w: 0.75, jitter: 0.08, speed: 6, glow: 1.6 },
  manda: { h: 0.5, w: 0.8, jitter: 0.03, speed: 1.5, glow: 0.35 },
};
function Lamp({ id, on }) {
  const reduce = useReducedMotion();
  const f = useRef();
  const light = useRef();
  const p = FLAME[id];
  const geo = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const v = i / 24;
      const w = Math.sin(Math.PI * Math.pow(v, 0.6)) * (1 - v * 0.4);
      pts.push(new THREE.Vector2(w * 0.16, v * 0.62));
    }
    return new THREE.LatheGeometry(pts, 32);
  }, []);
  const bowl = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 24; i++) { const v = i / 24; pts.push(new THREE.Vector2(0.12 + 0.48 * Math.sin((v * Math.PI) / 2), v * 0.24)); }
    return new THREE.LatheGeometry(pts, 64);
  }, []);
  useFrame((s) => {
    if (!f.current) return;
    const t = s.clock.elapsedTime;
    const j = reduce ? 0 : (id === 'vishama' ? (Math.sin(t * 7.1) * Math.sin(t * 3.3 + 1) + Math.sin(t * 13)) * p.jitter : Math.sin(t * p.speed) * p.jitter);
    f.current.scale.set(p.w * (1 - j * 0.3), p.h * (1 + j), p.w * (1 - j * 0.3));
    f.current.rotation.z = id === 'vishama' && !reduce ? Math.sin(t * 5) * 0.12 : 0;
    if (light.current) light.current.intensity = (on ? 2.2 : 0.7) * p.glow * (1 + j);
  });
  return (
    <group>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.2, 0.3, 0.06, 48]} /><Brass /></mesh>
      <mesh geometry={bowl} position={[0, 0.06, 0]}><meshStandardMaterial color="#B8893E" metalness={1} roughness={0.25} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.27, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.55, 48]} /><meshStandardMaterial color="#7A5A20" roughness={0.2} metalness={0.3} /></mesh>
      <group ref={f} position={[0, 0.3, 0]}>
        <mesh geometry={geo}><meshBasicMaterial color="#E8742C" transparent opacity={on ? 0.6 : 0.3} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
        <mesh geometry={geo} scale={[0.6, 0.7, 0.6]}><meshBasicMaterial color="#FFB35C" transparent opacity={on ? 0.85 : 0.4} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
        <mesh geometry={geo} scale={[0.3, 0.38, 0.3]}><meshBasicMaterial color="#FFF4D8" transparent opacity={on ? 1 : 0.5} /></mesh>
      </group>
      <pointLight ref={light} position={[0, 0.7, 0]} distance={2.6} color="#FF9F50" />
    </group>
  );
}
export function AgniScene() {
  const c = useColors();
  const [pick, setPick] = useState('sama');
  const cur = AGNI_STATES.find((a) => a.id === pick);
  const X = [1.95, 0.65, -0.65, -1.95];
  return (
    <figure className="viz scene agni3d">
      <Stage3D camera={[0, 2.2, 6.4]} target={[0, 0.55, 0]} size={[5.3, 2.0]} label="ארבעת מצבי אגני: מאוזן, לא סדיר, חד מדי ואיטי">
        {AGNI_STATES.map((a, i) => (
          <group key={a.id} position={[X[i], 0, 0]} onClick={(e) => { e.stopPropagation(); setPick(a.id); }} onPointerOver={(e) => { e.stopPropagation(); setPick(a.id); }}>
            <Lamp id={a.id} on={pick === a.id} />
            {pick === a.id && <Ring key={pick} center={[0, 0.01, 0]} rx={0.85} rz={0.36} color={a.d ? c[a.d] : c.brass} width={1.5} />}
            <FloatLabel position={[0, -0.42, 0.3]} title={a.t} sub={a.he} tone={pick === a.id ? (a.d ? c[a.d] : c.brass) : c.ink} active={pick === a.id} />
          </group>
        ))}
      </Stage3D>
      <div className="seg seg-wrap" role="group" aria-label="מצבי אגני">
        {AGNI_STATES.map((a) => (
          <button key={a.id} className="seg-btn" aria-pressed={pick === a.id} aria-label={`${a.t}: ${a.he}`} onClick={() => setPick(a.id)} onMouseEnter={() => setPick(a.id)}>{a.t}</button>
        ))}
      </div>
      <figcaption>
        <Claim type="tradition" /> <b>{cur.t} ({cur.sk})</b>: {cur.text}{cur.d ? ` קשור ל${DNAME[cur.d]}.` : ''}
      </figcaption>
    </figure>
  );
}

// ======================= שבע הרקמות: עמוד של זכוכית =======================
function Nutrient({ n, onLevel }) {
  const reduce = useReducedMotion();
  const ref = useRef();
  const last = useRef(-1);
  useFrame((s) => {
    if (!ref.current || reduce) return;
    const k = (s.clock.elapsedTime / 9) % 1;
    const y = 3.7 - k * 3.9;
    ref.current.position.y = y;
    const lvl = Math.max(-1, Math.min(n - 1, Math.round((3.2 - y) / 0.5)));
    if (lvl !== last.current) { last.current = lvl; onLevel(lvl); }
  });
  return <mesh ref={ref} position={[0, 3.7, 0]}><sphereGeometry args={[0.08, 24, 24]} /><meshStandardMaterial color="#FFFFFF" emissive="#F3B06A" emissiveIntensity={1.4} /></mesh>;
}
export function DhatuScene() {
  const c = useColors();
  const [lvl, setLvl] = useState(-1);
  return (
    <figure className="viz scene">
      <Stage3D camera={[0, 1.6, 7.4]} target={[0, 1.7, 0]} size={[7.6, 4.7]} label="שבע הרקמות, מנוזל התזונה ועד רקמת הרבייה">
        <mesh position={[0, 1.75, 0]}><cylinderGeometry args={[0.02, 0.02, 3.6, 12]} /><Brass /></mesh>
        <FloatLabel position={[0, 4.0, 0]} title="מזון" sub="אהארה" tone={c.ink} size="s" />
        {DHATUS.map((d, i) => {
          const y = 3.2 - i * 0.5;
          const on = lvl === i;
          const r = 0.55 + i * 0.07;
          return (
            <group key={d.sk} position={[0, y, 0]}>
              <mesh scale={[1, 0.14, 1]}><sphereGeometry args={[r, 48, 24]} /><Glass color={on ? '#F3B06A' : '#F1E6D2'} thickness={0.4} tint={on ? 1 : 0} /></mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[r, 0.008, 8, 96]} /><meshBasicMaterial color={on ? c.ember : c.brass} /></mesh>
              <FloatLabel position={[(i % 2 ? -1 : 1) * (r + 1.3), 0, 0]} title={`${d.t} · ${d.he}`} sub={d.sk} tone={on ? c.ember : c.ink} size="s" active={on} delay={0.2 + i * 0.12} />
            </group>
          );
        })}
        <Nutrient n={DHATUS.length} onLevel={setLvl} />
      </Stage3D>
      <figcaption>
        <Claim type="tradition" /> המזון הופך לנוזל תזונה, וממנו נבנות שבע רקמות, <mark className="hl">כל רקמה מקודמתה</mark>. נקודת האור היא התזונה שיורדת בשרשרת. <Claim type="assessment" /> מודל של בנייה, לא אטלס.
      </figcaption>
    </figure>
  );
}

// ======================= גלגל העונות =======================
export function SeasonsScene() {
  const c = useColors();
  const month = new Date().getMonth();
  const [hover, setHover] = useState(null);
  const m = hover ?? month;
  const R = 2;
  const pos = (i, r = R, y = 0.3) => { const a = (i / 12) * Math.PI * 2; return [Math.sin(a) * r, y, -Math.cos(a) * r]; };
  return (
    <figure className="viz scene">
      <Stage3D camera={[0, 4.4, 5]} target={[0, 0.2, 0]} size={[6.4, 4.8]} label={`גלגל העונות. החודש: ${MONTHS[month]}, עונת ${DNAME[MONTH_DOSHA[month]]}`}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.3, 0]}><torusGeometry args={[R, 0.025, 16, 160]} /><Brass /></mesh>
        {MONTHS.map((t, i) => {
          const d = MONTH_DOSHA[i];
          const on = i === m;
          return (
            <group key={t} position={pos(i)} onPointerOver={(e) => { e.stopPropagation(); setHover(i); }} onPointerOut={() => setHover(null)}>
              <mesh><sphereGeometry args={[on ? 0.2 : 0.13, 32, 32]} /><meshStandardMaterial color={c[d]} emissive={c[d]} emissiveIntensity={on ? 1.6 : 0.6} roughness={0.3} toneMapped={false} /></mesh>
              {on && <Ring key={m} center={[0, -0.28, 0]} rx={0.34} rz={0.2} color={c[d]} width={1.4} />}
              <FloatLabel position={[0, on ? -0.5 : -0.36, 0]} title={t} tone={on ? c[d] : c.muted} size="s" active={on} />
            </group>
          );
        })}
        <Hover amp={0.05}><group position={[0, 0.5, 0]}><BodySculpture d={MONTH_DOSHA[m]} tint={tintOf(c, MONTH_DOSHA[m])} scale={0.58} /></group></Hover>
        <FloatLabel position={[0, 2.35, 0]} title={`עונת ${DNAME[MONTH_DOSHA[m]]}`} sub={SEASON_TEXT[MONTH_DOSHA[m]].split(':')[0]} tone={c[MONTH_DOSHA[m]]} size="l" />
      </Stage3D>
      <figcaption>
        <Claim type="assessment" /> {MONTHS[m]}: {SEASON_TEXT[MONTH_DOSHA[m]]} ההתאמה לאקלים בישראל היא פרשנות, לא שש העונות ההודיות. עמדו על חודש.
      </figcaption>
    </figure>
  );
}

// ======================= שלבי החיים =======================
export function LifeScene() {
  const c = useColors();
  const stages = [
    { d: 'kapha', t: 'ילדות', s: 'צמיחה ובנייה', x: 1.6, k: 0.6 },
    { d: 'pitta', t: 'בגרות', s: 'עשייה והמרה', x: 0, k: 0.85 },
    { d: 'vata', t: 'זקנה', s: 'קלילות ויובש', x: -1.6, k: 0.82 },
  ];
  return (
    <figure className="viz scene">
      <Stage3D camera={[0, 1.4, 7.4]} target={[0, 1.25, 0]} size={[5.6, 3.2]} label="ילדות קאפה, בגרות פיטה, זקנה ואטה">
        {stages.map((s, i) => (
          <group key={s.d} position={[s.x, 0, 0]}>
            <Plinth r={0.42} />
            <BodySculpture d={s.d} tint={tintOf(c, s.d)} scale={s.k} />
            <FloatLabel position={[0, 2.55 * BUILD3D[s.d].h * s.k + 0.4, 0]} title={`${s.t} · ${DNAME[s.d]}`} sub={s.s} tone={c[s.d]} delay={0.4 + i * 0.3} />
          </group>
        ))}
        <Arrow from={[1.7, 0.08, 0.8]} to={[-1.7, 0.08, 0.8]} lift={0.25} color={c.brass} width={1.4} delay={0.2} />
      </Stage3D>
      <figcaption>
        <Claim type="tradition" /> הסדר הכללי: קאפה בילדות, פיטה בבגרות, ואטה בזקנה. <Claim type="assessment" /> המעבר הדרגתי, וכל גיל מדויק הוא פרשנות.
      </figcaption>
    </figure>
  );
}

// ======================= כלי הזכוכית של מעבדת האיכויות =======================
function Vessel({ d, score, c }) {
  const reduce = useReducedMotion();
  const liq = useRef();
  const target = 0.5 + Math.max(-5, Math.min(5, score)) * 0.085;
  useFrame(() => {
    if (!liq.current) return;
    const v = reduce ? target : ease(liq.current.scale.y, target, 0.06);
    liq.current.scale.y = v;
    liq.current.position.y = 0.05 + v * 0.9;
  });
  return (
    <group>
      <mesh position={[0, 1.0, 0]}><cylinderGeometry args={[0.36, 0.36, 2, 48, 1, true]} /><Glass thickness={0.15} /></mesh>
      <mesh ref={liq} position={[0, 0.5, 0]} scale={[1, 0.5, 1]}><cylinderGeometry args={[0.33, 0.33, 1.8, 48]} /><Holo color={c[d]} base={0.45} glow={1.2} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.95, 0]}><torusGeometry args={[0.39, 0.012, 8, 64]} /><Brass /></mesh>
      <Plinth r={0.44} />
    </group>
  );
}
export function VesselsScene({ effect }) {
  const c = useColors();
  const X = { vata: 1.3, pitta: 0, kapha: -1.3 };
  return (
    <Stage3D camera={[0, 1.6, 6.4]} target={[0, 1.0, 0]} size={[4.1, 3.0]} label="שלושה כלים: גובה הנוזל הוא ההשפעה על כל דושה" className="vessels">
      {ORDER.map((d) => {
        const s = effect[d].score;
        return (
          <group key={d} position={[X[d], 0, 0]}>
            <Vessel d={d} score={s} c={c} />
            <FloatLabel position={[0, 2.35, 0]} title={DNAME[d]} sub={s > 0 ? `מגביר · ${s}` : s < 0 ? `מאזן · ${-s}` : 'ללא שינוי'} tone={c[d]} />
          </group>
        );
      })}
      <FloatLabel position={[1.95, 0.95, 0]} title="קו האיזון" tone={c.brass} size="s" />
    </Stage3D>
  );
}

// ======================= מפת הידע כקבוצת כוכבים =======================
function Sway({ children }) {
  const reduce = useReducedMotion();
  const g = useRef();
  useFrame((s) => {
    if (g.current && !reduce) g.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.12) * 0.22;
  });
  return <group ref={g}>{children}</group>;
}
export function ConstellationScene({ layout }) {
  const c = useColors();
  const reduce = useReducedMotion();
  const { nodes, links, byId } = layout;
  const [hover, setHover] = useState(null);
  const P = (n) => [(320 - n.x) / -70, (480 - n.y) / 70 - 0.6, ({ foundations: 0.6, doshas: 0.2, person: -0.3, routine: 0.3, sources: -0.6 })[n.group]];
  const term = Object.fromEntries(CONCEPTS.map((x) => [x.id, x]));
  const deg = {};
  for (const [a, b] of links) { deg[a] = (deg[a] || 0) + 1; deg[b] = (deg[b] || 0) + 1; }
  const near = (id) => !hover || id === hover || links.some(([a, b]) => (a === hover && b === id) || (b === hover && a === id));
  return (
    <figure className="viz scene">
      <Stage3D camera={[0, 0.6, 9]} target={[0, 2.8, 0]} size={[10.8, 6.8]} label="מפת הידע: כל המושגים והקשרים ביניהם" shadowY={-0.2}>
        <Sway>
          {links.map(([a, b], i) => {
            const on = !hover || a === hover || b === hover;
            return <DrawLine key={`${a}-${b}`} points={[P(byId[a]), P(byId[b])]} color={on && hover ? c.brass : c.line} width={on && hover ? 1.6 : 0.9} opacity={on ? 0.75 : 0.12} delay={0.02 * i} />;
          })}
          {nodes.map((n) => {
            const r = 0.06 + (deg[n.id] || 0) * 0.018;
            const col = res(c, GROUP_COLOR[n.group], c.brass);
            const on = near(n.id);
            return (
              <group key={n.id} position={P(n)}>
                <mesh onPointerOver={(e) => { e.stopPropagation(); setHover(n.id); }} onPointerOut={() => setHover(null)} onClick={() => go(`/library/${n.id}`)}>
                  <sphereGeometry args={[r, 32, 32]} />
                  <meshStandardMaterial color={col} emissive={col} emissiveIntensity={hover === n.id ? 2.2 : on ? 1 : 0.25} transparent opacity={on ? 1 : 0.35} toneMapped={false} />
                </mesh>
                <Html position={[0, -r - 0.16, 0]} center zIndexRange={[20, 0]}>
                  <button type="button" className={`star-label ${on ? '' : 'dim'}`} data-concept={n.id} aria-label={term[n.id].term}
                    onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(n.id)} onBlur={() => setHover(null)}
                    onClick={() => go(`/library/${n.id}`)}>{term[n.id].term}</button>
                </Html>
              </group>
            );
          })}
        </Sway>
      </Stage3D>
      <figcaption>
        <div className="legend">{GROUPS.map((x) => <span key={x.id}><i style={{ background: GROUP_COLOR[x.id] }} />{x.title}</span>)}</div>
        עמדו על מושג כדי לראות את הקשרים שלו, ולחצו כדי לפתוח אותו. גודל הכוכב מבטא את מספר הקשרים.
      </figcaption>
    </figure>
  );
}
