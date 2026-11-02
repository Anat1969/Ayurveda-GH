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
  skin: { layer: 'skin', c: '#2F7FC1', base: 0.0, glow: 0.62, power: 2.6 },
  bones: { layer: 'bones', c: '#6E8496', base: 0.006, glow: 0.55, power: 2.3 },
  brain: { layer: 'bones', c: '#7A86B8', base: 0.01, glow: 0.35, power: 2.4 },
  lungR: { layer: 'breath', c: '#D44A3A', base: 0.07, glow: 0.85, power: 2.0, name: 'ריאה ימנית' },
  lungL: { layer: 'breath', c: '#D44A3A', base: 0.07, glow: 0.85, power: 2.0, name: 'ריאה שמאלית' },
  airway: { layer: 'breath', c: '#D9782A', base: 0.35, glow: 0.7, power: 1.6, name: 'קנה הנשימה והסימפונות' },
  heart: { layer: 'breath', c: '#B51E3A', base: 0.3, glow: 0.8, power: 1.8, name: 'לב' },
  diaphragm: { layer: 'breath', c: '#C9874E', base: 0.01, glow: 0.35, power: 2.4, name: 'סרעפת' },
  esophagus: { layer: 'digest', c: '#3A7FC0', base: 0.25, glow: 0.7, power: 1.8, name: 'ושט' },
  stomach: { layer: 'digest', c: '#1F8FB5', base: 0.16, glow: 0.8, power: 1.9, name: 'קיבה' },
  liver: { layer: 'digest', c: '#9C4328', base: 0.16, glow: 0.8, power: 2, name: 'כבד' },
  pancreas: { layer: 'digest', c: '#C98E3A', base: 0.18, glow: 0.7, power: 1.8, name: 'לבלב' },
  small: { layer: 'digest', c: '#D98A16', base: 0.2, glow: 0.8, power: 1.8, name: 'מעי דק' },
  large: { layer: 'digest', c: '#C9551E', base: 0.18, glow: 0.85, power: 1.8, name: 'מעי גס' },
  kidneys: { layer: 'digest', c: '#A0603F', base: 0.1, glow: 0.6, power: 2, name: 'כליות' },
  bladder: { layer: 'digest', c: '#5F8FB0', base: 0.08, glow: 0.5, power: 2 },
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
      <Stage3D camera={[0, 0.15, 6]} target={[0, H * 0.745, 0]} size={[1.2, H * 0.53]} fov={30} label="מודל אנטומי: איברי הנשימה והעיכול, ומושבי הדושות לפי המסורת" shadowY={0} shadowScale={4}>
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
