import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DHATUS, AGNI_STATES, DOSHA_COLOR } from '../data/viz.js';

const DNAME = { vata: 'ואטה', pitta: 'פיטה', kapha: 'קאפה' };

// שבע הרקמות על קו זהב אנכי. אור עובר לאורך הקו, מהמזון אל הרקמה האחרונה.
export function DhatuCascade() {
  const reduce = useReducedMotion();
  const step = 58;
  const top = 30;
  const H = top + (DHATUS.length - 1) * step + 40;
  return (
    <figure className="viz">
      <svg viewBox={`0 0 600 ${H}`} role="img" aria-label="שבע הרקמות, מנוזל התזונה ועד רקמת הרבייה">
        <line x1="300" y1="6" x2="300" y2={H - 20} className="stroke-brass" strokeWidth="1.5" />
        {!reduce && <line x1="300" y1="6" x2="300" y2={H - 20} stroke="var(--ember)" strokeWidth="2.5" strokeDasharray="34 1400" className="sweep" />}
        <text x="300" y="2" textAnchor="middle" fontSize="11" className="svg-mono">מזון</text>
        {DHATUS.map((d, i) => {
          const y = top + i * step;
          const side = i % 2 === 0 ? 1 : -1;
          return (
            <motion.g key={d.sk} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
              <circle cx="300" cy={y} r="6" fill="var(--raised)" className="stroke-brass" strokeWidth="1.5" />
              <line x1={300 + side * 10} y1={y} x2={300 + side * 80} y2={y} className="stroke-line" />
              <text x={300 + side * 170} y={y - 3} textAnchor="middle" fontSize="20" className="svg-display" fill="var(--brass)">{d.t}</text>
              <text x={300 + side * 170} y={y + 16} textAnchor="middle" fontSize="13" className="svg-ink">{d.he}</text>
              <text x={300 - side * 50} y={y + 4} textAnchor="middle" fontSize="11" className="svg-mono">{String(i + 1).padStart(2, '0')} · {d.sk}</text>
            </motion.g>
          );
        })}
      </svg>
      <figcaption>
        <span className="claim tradition">מסורת</span> המזון הופך לנוזל תזונה, וממנו נבנות שאר הרקמות לפי הסדר. עיכול טוב בתחילת השרשרת מזין את כולה. <span className="claim assessment">הערכה</span> מודל של תזונה ובנייה, לא אטלס אנטומי.
      </figcaption>
    </figure>
  );
}

// ארבעה מצבים של אש העיכול: מנורת שמן (דיה) בקו, והלהבה בקצב שמבטא את המצב.
const FLAME = 'M0 -64 C 14 -44 24 -28 22 -8 C 20 10 10 20 0 20 C -10 20 -20 10 -22 -8 C -24 -28 -14 -44 0 -64 Z';
const MOTION = {
  sama: { scaleY: [1, 1.04, 1], transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' } },
  vishama: { scaleY: [1, 1.2, 0.85, 1.1, 0.92, 1], rotate: [0, -5, 4, -2, 3, 0], transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } },
  tikshna: { scaleY: [1.35, 1.45, 1.35], scaleX: [0.86, 0.82, 0.86], transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } },
  manda: { scaleY: [0.58, 0.62, 0.58], opacity: [0.55, 0.7, 0.55], transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' } },
};
const STATIC = { sama: { scaleY: 1 }, vishama: { scaleY: 1.1, rotate: -4 }, tikshna: { scaleY: 1.4, scaleX: 0.86 }, manda: { scaleY: 0.6, opacity: 0.65 } };

export function AgniFlames() {
  const reduce = useReducedMotion();
  const [pick, setPick] = useState('sama');
  const cur = AGNI_STATES.find((a) => a.id === pick);
  return (
    <figure className="viz">
      <svg viewBox="0 0 600 220" role="img" aria-label="ארבעת מצבי אגני: מאוזן, לא סדיר, חד מדי ואיטי">
        <defs>
          <radialGradient id="lamp-glow"><stop offset="0" stopColor="var(--ember)" stopOpacity=".32" /><stop offset="1" stopColor="var(--ember)" stopOpacity="0" /></radialGradient>
          <linearGradient id="flame-fill" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#F3D9A4" /><stop offset=".55" stopColor="#E0874E" /><stop offset="1" stopColor="#B4532A" /></linearGradient>
        </defs>
        {AGNI_STATES.map((a, i) => {
          const x = 525 - i * 150;
          const on = pick === a.id;
          const tint = a.d ? DOSHA_COLOR[a.d] : 'var(--brass)';
          return (
            <g key={a.id} transform={`translate(${x} 124)`} onClick={() => setPick(a.id)} onMouseEnter={() => setPick(a.id)} onFocus={() => setPick(a.id)}
              style={{ cursor: 'pointer' }} role="button" tabIndex={0} aria-label={`${a.t}: ${a.he}`}>
              <circle r="62" cy="-16" fill="url(#lamp-glow)" opacity={on ? 1 : 0.35} />
              <motion.g style={{ originY: '20px' }} animate={reduce ? STATIC[a.id] : MOTION[a.id]}>
                <path d={FLAME} fill="url(#flame-fill)" opacity={on ? 0.95 : 0.6} />
              </motion.g>
              <path d="M-38 24 Q 0 52 38 24 Z" fill="var(--raised)" className="stroke-brass" strokeWidth="1.5" />
              <line x1="-44" y1="24" x2="44" y2="24" className="stroke-brass" strokeWidth="1.5" />
              <text y="74" textAnchor="middle" fontSize="18" className="svg-display" fill={on ? tint : 'var(--ink)'}>{a.t}</text>
              <text y="92" textAnchor="middle" fontSize="12" className="svg-muted">{a.he}</text>
            </g>
          );
        })}
      </svg>
      <figcaption>
        <span className="claim tradition">מסורת</span> <b>{cur.t} ({cur.sk})</b>: {cur.text}{cur.d ? ` קשור ל${DNAME[cur.d]}.` : ''}
      </figcaption>
    </figure>
  );
}
