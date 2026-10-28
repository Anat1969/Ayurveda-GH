import { lazy, Suspense, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { hasWebGL } from '../three/webgl.js';

const VesselsScene = lazy(() => import('../three/Scenes2.jsx').then((m) => ({ default: m.VesselsScene })));
import { GUNA_PAIRS, GUNA_PRESETS, GUNA_NAME, DOSHA_COLOR, gunaEffect } from '../data/viz.js';

const DNAME = { vata: 'ואטה', pitta: 'פיטה', kapha: 'קאפה' };
const ORDER = ['vata', 'pitta', 'kapha'];

// מעבדת האיכויות: בוחרים חוויה או איכויות, ורואים מה קורה לכל דושה.
// העיקרון (מסורת): הדומה מגביר את הדומה, וההפך מאזן.
export default function GunaLab({ compact = false }) {
  const [preset, setPreset] = useState('icecream');
  const [picked, setPicked] = useState(() => ({ ...pairsFrom(GUNA_PRESETS[0].q) }));
  const qualities = Object.values(picked).filter(Boolean);
  const effect = useMemo(() => gunaEffect(qualities), [qualities.join()]);

  function choosePreset(p) {
    setPreset(p.id);
    setPicked(pairsFrom(p.q));
  }
  function toggle(pair, k) {
    setPreset(null);
    setPicked((cur) => ({ ...cur, [pair]: cur[pair] === k ? null : k }));
  }

  const explain = ORDER.map((d) => {
    const e = effect[d];
    if (!e.same.length && !e.opposite.length) return null;
    const parts = [];
    if (e.same.length) parts.push(`מגביר דרך ${e.same.map((q) => GUNA_NAME[q]).join(', ')}`);
    if (e.opposite.length) parts.push(`מאזן דרך ${e.opposite.map((q) => GUNA_NAME[q]).join(', ')}`);
    return { d, text: parts.join('; ') };
  }).filter(Boolean);

  return (
    <figure className="viz guna-lab">
      <div className="chips" role="group" aria-label="חוויות לדוגמה">
        {GUNA_PRESETS.map((p) => (
          <button key={p.id} className="chip" aria-pressed={preset === p.id} onClick={() => choosePreset(p)}>{p.t}</button>
        ))}
      </div>

      <div className="lab-body">
        {hasWebGL() ? (
          <div className="vessels-wrap">
            <Suspense fallback={<div className="stage3d vessels loading" />}><VesselsScene effect={effect} /></Suspense>
            <div className="gauges-line" aria-live="polite">
              {ORDER.map((d) => {
                const s = effect[d].score;
                return <span key={d} className="gauge"><b style={{ color: DOSHA_COLOR[d] }}>{DNAME[d]}</b> {s > 0 ? `מגביר · ${s}` : s < 0 ? `מאזן · ${-s}` : 'ללא שינוי'}</span>;
              })}
            </div>
          </div>
        ) : (
        <div className="gauges" aria-live="polite">
          {ORDER.map((d) => {
            const s = effect[d].score;
            const h = Math.min(Math.abs(s), 5) * 9.5;
            return (
              <div key={d} className="gauge">
                <div className="gauge-tube">
                  <div className="gauge-mid" />
                  <motion.div
                    className="gauge-fill"
                    style={{ background: DOSHA_COLOR[d], [s >= 0 ? 'bottom' : 'top']: '50%' }}
                    initial={false}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <b className="svg-display" style={{ color: DOSHA_COLOR[d], fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 21 }}>{DNAME[d]}</b>
                <span className="mono small">{s > 0 ? `מגביר · ${s}` : s < 0 ? `מאזן · ${-s}` : 'ללא שינוי'}</span>
              </div>
            );
          })}
        </div>
        )}

        {!compact && (
          <div className="pairs">
            {GUNA_PAIRS.map((p) => (
              <div key={p.id} className="pair">
                <button aria-pressed={picked[p.id] === p.a.k} onClick={() => toggle(p.id, p.a.k)}>{p.a.t}</button>
                <span className="pair-line" />
                <button aria-pressed={picked[p.id] === p.b.k} onClick={() => toggle(p.id, p.b.k)}>{p.b.t}</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <figcaption>
        <span className="claim tradition">מסורת</span> הדומה מגביר את הדומה, וההפך מאזן.
        {explain.length ? ' ' + explain.map((e) => `${DNAME[e.d]}: ${e.text}.`).join(' ') : ' בחרו איכויות כדי לראות את ההשפעה.'}{' '}
        <span className="claim assessment">הערכה</span> השיוך של איכויות לחוויות מודרניות הוא פרשנות לפי העיקרון.
      </figcaption>
    </figure>
  );
}

function pairsFrom(list) {
  const out = {};
  for (const p of GUNA_PAIRS) {
    out[p.id] = list.includes(p.a.k) ? p.a.k : list.includes(p.b.k) ? p.b.k : null;
  }
  return out;
}
