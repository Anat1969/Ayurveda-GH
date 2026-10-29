import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { ELEMENTS, BUILD, TASTES } from '../data/viz.js';
import { Stage3D, useColors, ElementObject, BodySculpture, Plinth, Arrow, Ring, FloatLabel, Hover, BUILD3D } from './kit.jsx';
import { Claim } from '../components/Shell.jsx';

const ORDER = ['vata', 'pitta', 'kapha'];
const DNAME = { vata: 'ואטה', pitta: 'פיטה', kapha: 'קאפה' };
const EL = Object.fromEntries(ELEMENTS.map((e) => [e.id, e]));
const tintOf = (c, d) => c[`${d}-tint`] || c[d];

// ---------------- מהיסודות לדושות ----------------
const EX = { space: 2.7, air: 1.35, fire: 0, water: -1.35, earth: -2.7 };
const DX = { vata: 2.0, pitta: 0, kapha: -2.0 };
const EZ = 1.3;
const DZ = -1.5;

export function ElementsScene() {
  const c = useColors();
  const [focus, setFocus] = useState(null);
  const lit = (e, d) => !focus || focus === e || focus === d;
  return (
    <figure className="viz scene">
      <Stage3D camera={[0, 2.6, 8.6]} target={[0, 0.85, 0]} size={[6.9, 3.6]} label="חלל ואוויר יוצרים ואטה, אש ומים יוצרים פיטה, מים ואדמה יוצרים קאפה">
        {ORDER.map((d) => (
          <group key={d} position={[DX[d], 0, DZ]} onPointerOver={(e) => { e.stopPropagation(); setFocus(d); }} onPointerOut={() => setFocus(null)}>
            <Plinth r={0.42 * BUILD3D[d].w} />
            <BodySculpture d={d} tint={tintOf(c, d)} scale={0.78} active={!focus || focus === d || ELEMENTS.some((e) => e.id === focus && e.doshas.includes(d))} />
            <FloatLabel position={[0, 2.25 * BUILD3D[d].h, 0]} title={DNAME[d]} sub={BUILD3D[d].el.map((x) => EL[x].name).join(' + ')} tone={c[d]} size="l" delay={1.4} />
          </group>
        ))}
        {ELEMENTS.map((e, i) => (
          <group key={e.id} position={[EX[e.id], 0.42, EZ]} onPointerOver={(ev) => { ev.stopPropagation(); setFocus(e.id); }} onPointerOut={() => setFocus(null)}>
            <Hover phase={i * 1.3} amp={0.06}><ElementObject id={e.id} r={0.3} /></Hover>
            <FloatLabel position={[0, -0.62, 0]} title={e.name} sub={e.sk} tone={c.ink} delay={0.2 + i * 0.12} />
          </group>
        ))}
        {ELEMENTS.flatMap((e, i) => e.doshas.map((d, k) => (
          <Arrow key={`${e.id}-${d}`} from={[EX[e.id], 0.85, EZ]} to={[DX[d], 1.35, DZ + 0.2]} lift={0.9 + k * 0.25}
            color={lit(e.id, d) ? c[d] : c.hair} opacity={lit(e.id, d) ? 0.95 : 0.35} delay={0.5 + i * 0.18} flow width={1.4} />
        )))}
        <Ring center={[0, 0.02, EZ]} rx={3.35} rz={0.62} color={c.line} delay={0.1} dashed />
      </Stage3D>
      <figcaption>
        <Claim type="tradition" /> כל דושה נוצרת משני יסודות. לכל יסוד חומר: <mark className="hl">חלל זכוכית ריקה, אוויר פנינים בתנועה, אש להבה, מים עדשת מים, אדמה אבן</mark>. הדושה היא פסל גוף מזכוכית, והיסודות שלה בתוכו. מים משותפים לפיטה ולקאפה. עמדו על יסוד או על דושה.
      </figcaption>
    </figure>
  );
}

// ---------------- מבנה הגוף של הדושות ----------------
function Turn({ children, on }) {
  const reduce = useReducedMotion();
  const ref = useRef();
  useFrame((s, dt) => {
    if (!ref.current || reduce) return;
    const target = on ? ref.current.rotation.y + dt * 0.35 : THREE.MathUtils.lerp(ref.current.rotation.y, 0, 0.05);
    ref.current.rotation.y = target;
  });
  return <group ref={ref}>{children}</group>;
}

export function BuildScene({ initial }) {
  const c = useColors();
  const [sel, setSel] = useState(initial || 'pitta');
  const X = { vata: 1.55, pitta: 0, kapha: -1.65 };
  const b = BUILD[sel];
  return (
    <figure className="viz scene build3d stacked">
      <Stage3D camera={[0, 1.5, 8.2]} target={[0, 1.5, 0]} size={[5.6, 3.4]} label="מבנה הגוף של ואטה, פיטה וקאפה">
        {ORDER.map((d) => (
          <group key={d} position={[X[d], 0, 0]} onClick={(e) => { e.stopPropagation(); setSel(d); }}
            onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
            <Plinth r={0.55 * BUILD3D[d].w} />
            <Turn on={sel === d}><BodySculpture d={d} tint={tintOf(c, d)} active={sel === d} /></Turn>
            {sel === d && <Ring key={sel} center={[0, 0.02, 0]} rx={0.95 * BUILD3D[d].w + 0.25} rz={0.42} color={c[d]} width={1.6} />}
            
            <FloatLabel position={[0, 2.85 * BUILD3D[d].h, 0]} title={DNAME[d]} sub={BUILD[d].frame.split(',')[0]} tone={c[d]} size="l" active={sel === d} delay={0.3} />
          </group>
        ))}
        <FloatLabel key={`t-${sel}`} position={[X[sel] + { vata: 0.85, pitta: 0.95, kapha: -1.25 }[sel], 1.9 * BUILD3D[sel].h, 0]}
          title={`${BUILD[sel].el.map((x) => EL[x].name).join(' ו')} בתוך החזה`} sub="היסודות של הדושה" tone={c.ink} size="s" delay={0.8} />
      </Stage3D>
      <div className="legend-block">
        <div className="seg" role="group" aria-label="בחירת דושה">
          {ORDER.map((d) => (
            <button key={d} className={`seg-btn d-${d}`} aria-pressed={sel === d} onClick={() => setSel(d)}>{DNAME[d]}</button>
          ))}
        </div>
        <p className="legend-title"><b className={`dosha-name d-${sel}`}>{b.name}</b>: <mark className="hl">{b.frame}</mark></p>
        <ul className="legend-list">{b.traits.map((t) => <li key={t}>{t}</li>)}</ul>
        <p className="caption"><Claim type="tradition" /> צ׳ראקה סמהיטה, ויממנה סתהאנה 8 (פסוקים 96 עד 98). רוב האנשים הם צירוף של שתי דושות.</p>
      </div>
    </figure>
  );
}

// ---------------- שש הטעמים ----------------
function Grow({ s, children }) {
  const reduce = useReducedMotion();
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    const v = reduce ? s : THREE.MathUtils.lerp(ref.current.scale.x, s, 0.06);
    ref.current.scale.setScalar(v);
  });
  return <group ref={ref}>{children}</group>;
}

export function TastesScene() {
  const c = useColors();
  const [sel, setSel] = useState('madhura');
  const t = TASTES.find((x) => x.id === sel);
  const RX = 3.7;
  const RZ = 2.15;
  const pos = (i) => {
    const a = (-90 + i * 60) * (Math.PI / 180);
    return [Math.cos(a) * RX, 0.55, -Math.sin(a) * RZ];
  };
  const DP = { vata: [0.95, 0, 0], pitta: [0, 0, -0.2], kapha: [-1.0, 0, 0] };
  const sp = pos(TASTES.indexOf(t));
  return (
    <figure className="viz scene tastes3d stacked">
      <Stage3D camera={[0, 3.6, 8.4]} target={[0, 0.5, 0]} size={[8.9, 4.6]} label="שש הטעמים, היסודות שלהם והשפעתם על הדושות">
        <Ring center={[0, 0.02, 0]} rx={RX} rz={RZ} color={c.line} dashed width={1} />
        {ORDER.map((d) => (
          <group key={d} position={DP[d]}>
            <Plinth r={0.3 * BUILD3D[d].w} />
            <Grow s={t.eff[d] > 0 ? 1.18 : 0.82}><BodySculpture d={d} tint={tintOf(c, d)} scale={0.46} /></Grow>
            <FloatLabel position={[0, t.eff[d] > 0 ? 1.68 : 1.24, 0]} title={DNAME[d]} sub={t.eff[d] > 0 ? 'מגביר' : 'מאזן'} tone={c[d]} />
          </group>
        ))}
        {ORDER.map((d) => (
          <Arrow key={`${sel}-${d}`} from={[sp[0], sp[1] + 0.25, sp[2]]} to={[DP[d][0], 0.75, DP[d][2]]} lift={0.8}
            color={c[d]} flow={t.eff[d] > 0} width={t.eff[d] > 0 ? 1.2 : 1.8} delay={0.05} />
        ))}
        {TASTES.map((x, i) => {
          const p = pos(i);
          const on = x.id === sel;
          return (
            <group key={x.id} position={p} onClick={(e) => { e.stopPropagation(); setSel(x.id); }} onPointerOver={(e) => { e.stopPropagation(); setSel(x.id); }}>
              <Hover phase={i} amp={on ? 0.08 : 0.03}>
                <group position={[0.2, 0, 0]}><ElementObject id={x.el[0]} r={on ? 0.24 : 0.19} still={!on} /></group>
                <group position={[-0.2, 0, 0]}><ElementObject id={x.el[1]} r={on ? 0.24 : 0.19} still={!on} /></group>
              </Hover>
              {on && <Ring key={sel} center={[0, -0.5, 0]} rx={0.62} rz={0.26} color={c.brass} width={1.4} />}
              <FloatLabel position={[0, -0.58, 0.05]} title={x.name} sub={on ? `${EL[x.el[0]].name} + ${EL[x.el[1]].name}` : x.sk} tone={on ? c.ink : c.muted} active={on} />
            </group>
          );
        })}
      </Stage3D>
      <div className="legend-block">
        <div className="seg seg-wrap" role="group" aria-label="בחירת טעם">
          {TASTES.map((x) => (
            <button key={x.id} className="seg-btn" aria-pressed={x.id === sel} aria-label={`${x.name}: ${EL[x.el[0]].name} ו${EL[x.el[1]].name}`} onClick={() => setSel(x.id)}>{x.name}</button>
          ))}
        </div>
        <p className="legend-title"><b>{t.name}</b> <span className="mono muted small">{t.sk}</span>: {EL[t.el[0]].name} ו{EL[t.el[1]].name}</p>
        <ul className="legend-list">
          <li>מאזן: <mark className="hl">{ORDER.filter((d) => t.eff[d] < 0).map((d) => DNAME[d]).join(' ו')}</mark> <span className="muted small">(קו רציף, הפסל מתכווץ)</span></li>
          <li>מגביר: <b>{ORDER.filter((d) => t.eff[d] > 0).map((d) => DNAME[d]).join(' ו')}</b> <span className="muted small">(קו זורם, הפסל גדל)</span></li>
          <li className="muted">למשל: {t.ex}</li>
        </ul>
        <p className="caption"><Claim type="tradition" /> צ׳ראקה סמהיטה, סוטרה סתהאנה 1 ו-26. <Claim type="none" /> ההשפעה על הדושות לא נבדקה במחקר.</p>
      </div>
    </figure>
  );
}
