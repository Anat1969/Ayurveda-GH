import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import { Stage3D, Holo, Ring, FloatLabel, HOLO, SCAN } from './kit.jsx';
import { useBody, centerOf, SOURCE } from './anatomyData.js';
import { Claim } from '../components/Shell.jsx';

// לוח אנטומי מדעי: איברים אמיתיים מ-BodyParts3D, בשכבות שאפשר להדליק ולכבות.
// שכבת המסורת (מושבי הדושות) מונחת מעליהם בנפרד, ומסומנת כמסורת.

const LAYERS = [
  { id: 'skin', t: 'עור' },
  { id: 'bones', t: 'שלד' },
  { id: 'breath', t: 'נשימה ולב' },
  { id: 'digest', t: 'עיכול' },
  { id: 'seats', t: 'מושבי הדושות (מסורת)' },
];

// צבע וחומר לכל איבר. base הוא מילוי פנימי, glow הוא שוליים.
const ORGANS = {
  skin: { layer: 'skin', c: '#3FA9F5', base: 0.004, glow: 0.7, power: 3.2 },
  bones: { layer: 'bones', c: '#A9D8FF', base: 0.006, glow: 0.42, power: 2.6 },
  brain: { layer: 'bones', c: '#8FA8FF', base: 0.004, glow: 0.22, power: 3 },
  lungR: { layer: 'breath', c: '#FF6F5E', base: 0.025, glow: 0.9, power: 2.2, name: 'ריאה ימנית' },
  lungL: { layer: 'breath', c: '#FF6F5E', base: 0.025, glow: 0.9, power: 2.2, name: 'ריאה שמאלית' },
  airway: { layer: 'breath', c: '#FFB35C', base: 0.22, glow: 0.9, power: 1.6, name: 'קנה הנשימה והסימפונות' },
  heart: { layer: 'breath', c: '#FF3D5A', base: 0.12, glow: 1.1, power: 1.8, name: 'לב' },
  diaphragm: { layer: 'breath', c: '#E0874E', base: 0.005, glow: 0.35, power: 2.6, name: 'סרעפת' },
  esophagus: { layer: 'digest', c: '#4FA3FF', base: 0.25, glow: 1, power: 1.8, name: 'ושט' },
  stomach: { layer: 'digest', c: '#3FC3E8', base: 0.08, glow: 1.0, power: 1.9, name: 'קיבה' },
  liver: { layer: 'digest', c: '#D9673A', base: 0.05, glow: 0.95, power: 2, name: 'כבד' },
  pancreas: { layer: 'digest', c: '#F3B06A', base: 0.12, glow: 1, power: 1.8, name: 'לבלב' },
  small: { layer: 'digest', c: '#FFB03A', base: 0.09, glow: 1.0, power: 1.8, name: 'מעי דק' },
  large: { layer: 'digest', c: '#FF7A2E', base: 0.08, glow: 1.05, power: 1.8, name: 'מעי גס' },
  kidneys: { layer: 'digest', c: '#C98A6B', base: 0.06, glow: 0.8, power: 2, name: 'כליות' },
  bladder: { layer: 'digest', c: '#9FC9E8', base: 0.05, glow: 0.7, power: 2 },
};

const SEATS = [
  { d: 'kapha', n: 1, name: 'קאפה', seat: 'חזה וקיבה', sk: 'Uras, Amashaya', organs: ['lungR', 'lungL', 'heart', 'stomach', 'airway'], at: 'lungL', dy: 0.0 },
  { d: 'pitta', n: 2, name: 'פיטה', seat: 'מעי דק', sk: 'Grahani', organs: ['small', 'liver', 'pancreas'], at: 'small', dy: 0.04 },
  { d: 'vata', n: 3, name: 'ואטה', seat: 'מעי גס ואגן', sk: 'Pakvashaya', organs: ['large', 'bladder'], at: 'large', dy: -0.08 },
];
const CALLOUT_ORGANS = ['lungR', 'heart', 'liver', 'stomach', 'small', 'large'];

function Breathing({ geo, children, kind }) {
  const reduce = useReducedMotion();
  const ref = useRef();
  const c = useMemo(() => centerOf(geo), [geo]);
  useFrame((s) => {
    if (!ref.current || reduce) return;
    const t = s.clock.elapsedTime;
    let k = 1;
    if (kind === 'breath') k = 1 + Math.sin(t * 1.1) * 0.028;
    if (kind === 'beat') { const p = (t * 1.15) % 1; k = 1 + (p < 0.14 ? Math.sin((p / 0.14) * Math.PI) * 0.06 : 0); }
    ref.current.position.set(c.x * (1 - k), c.y * (1 - k), c.z * (1 - k));
    ref.current.scale.setScalar(k);
  });
  return <group ref={ref}>{children}</group>;
}

// קו סריקה שיורד לאורך הגוף, כמו בסורק
function Scanner({ top, bottom }) {
  const reduce = useReducedMotion();
  useEffect(() => () => { SCAN.value = -100; }, []);
  useFrame((s) => {
    if (reduce) { SCAN.value = -100; return; }
    const k = (s.clock.elapsedTime / 9) % 1;
    SCAN.value = k < 0.8 ? top - (top - bottom) * (k / 0.8) : -100;
  });
  return null;
}

// כניסה בשכבות: עור, שלד, נשימה, עיכול
function Intro({ children, delay }) {
  const reduce = useReducedMotion();
  const ref = useRef();
  const t0 = useRef(null);
  useFrame((s) => {
    if (!ref.current) return;
    if (t0.current === null) t0.current = s.clock.elapsedTime;
    const p = reduce ? 1 : Math.min(1, Math.max(0, (s.clock.elapsedTime - t0.current - delay) / 1.2));
    ref.current.visible = p > 0;
    ref.current.traverse((o) => { if (o.material?.uniforms?.uOpacity) o.material.uniforms.uOpacity.value = (o.userData.op ?? 1) * p; });
  });
  return <group ref={ref}>{children}</group>;
}

function Organs({ body, layers, active }) {
  const lit = (id) => !active || SEATS.find((s) => s.d === active).organs.includes(id);
  return Object.entries(ORGANS).map(([id, o]) => {
    if (!body[id] || !layers[o.layer]) return null;
    const dim = o.layer === 'breath' || o.layer === 'digest' ? (lit(id) ? 1 : 0.22) : active ? 0.55 : 1;
    const mesh = (
      <mesh geometry={body[id]} userData={{ op: dim }}>
        <Holo color={o.c} base={o.base} glow={o.glow} power={o.power} opacity={dim} />
      </mesh>
    );
    const delay = { skin: 0, bones: 0.3, breath: 0.8, digest: 1.1 }[o.layer] || 0;
    if (id === 'lungR' || id === 'lungL' || id === 'airway') return <Intro key={id} delay={delay}><Breathing geo={body[id]} kind="breath">{mesh}</Breathing></Intro>;
    if (id === 'heart') return <Intro key={id} delay={delay}><Breathing geo={body[id]} kind="beat">{mesh}</Breathing></Intro>;
    return <Intro key={id} delay={delay}>{mesh}</Intro>;
  });
}

export function AnatomyScene({ highlight = null }) {
  const body = useBody();
  const [layers, setLayers] = useState({ skin: true, bones: true, breath: true, digest: true, seats: true });
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const active = hover || pinned || highlight;
  const H = body?.height || 3.44;
  const anchors = useMemo(() => {
    if (!body) return {};
    const a = {};
    for (const id of Object.keys(ORGANS)) if (body[id]) {
      const c = centerOf(body[id]);
      a[id] = [c.x, c.y, body[id].boundingBox.max.z * 0.6 + c.z * 0.4];
    }
    return a;
  }, [body]);
  const torsoW = body ? (body.lungL.boundingBox.max.x - body.lungR.boundingBox.min.x) / 2 : 0.3;
  const seatY = (s) => (anchors[s.at] ? anchors[s.at][1] + s.dy : 0);
  const seat = SEATS.find((s) => s.d === active);
  const shownOrgans = seat ? seat.organs.filter((o) => ORGANS[o].name && o !== 'lungL' && o !== 'airway') : CALLOUT_ORGANS;

  return (
    <figure className="viz scene anatomy3d">
      <Stage3D camera={[0, 0.15, 6]} target={[0, H * 0.745, 0]} size={[1.2, H * 0.53]} fov={30} bloom={0.55} label="מודל אנטומי: איברי הנשימה והעיכול, ומושבי הדושות לפי המסורת" shadowY={0} shadowScale={4}>
        {body && (
          <>
            <Scanner top={H * 0.98} bottom={H * 0.42} />
            <Organs body={body} layers={layers} active={active} />
            {layers.seats && SEATS.map((s, i) => (
              <Ring key={`${s.d}-${active}`} center={[0, seatY(s), 0.0]} rx={torsoW * (s.d === 'kapha' ? 1.25 : 1.1)} rz={torsoW * 0.75}
                color={HOLO[s.d]} width={active === s.d ? 2.4 : 1.3} dashed={active !== s.d} delay={1.6 + i * 0.3} />
            ))}
            {layers.seats && SEATS.map((s) => (
              <FloatLabel key={`l-${s.d}`} position={[(s.d === 'pitta' ? 1 : -1) * torsoW * 1.1, seatY(s), torsoW * 0.5]} side={s.d === 'pitta' ? 'right' : 'left'}
                title={`${s.n} · ${s.name}`} sub={`מושב במסורת: ${s.seat}`} tone={HOLO[s.d]} size="l" active={active === s.d}
                onClick={() => setPinned(pinned === s.d ? null : s.d)} />
            ))}
            {shownOrgans.filter((o) => layers[ORGANS[o].layer] && anchors[o]).map((o) => (
              <FloatLabel key={`o-${o}`} position={anchors[o]} title={ORGANS[o].name} tone={ORGANS[o].c} size="s" side={anchors[o][0] < 0 ? 'left' : 'right'} />
            ))}
          </>
        )}
      </Stage3D>
      <div className="plate-controls">
        <div className="seg seg-wrap" role="group" aria-label="שכבות">
          {LAYERS.map((l) => (
            <button key={l.id} className="seg-btn" aria-pressed={layers[l.id]} onClick={() => setLayers({ ...layers, [l.id]: !layers[l.id] })}>{l.t}</button>
          ))}
        </div>
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
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <figcaption>
        <b>מבט קדמי, ימין הגוף בצד שמאל של האיור.</b> <Claim type="research" /> האיברים הם מודלים תלת ממדיים ממאגר מדעי שנבנה מהדמיה רפואית. <Claim type="tradition" /> הטבעות הן מושבי הדושות לפי צ׳ראקה ואשטאנגה הרידאיה, מעל האנטומיה ולא במקומה. גררו כדי לסובב.
        <span className="credit" style={{ display: 'block', marginTop: 5 }}>
          מודלים: {SOURCE} · <a href="/anatomy/digestive.svg" target="_blank" rel="noreferrer">איור מערכת העיכול: Mariana Ruiz (LadyofHats), נחלת הכלל</a>
        </span>
      </figcaption>
    </figure>
  );
}
