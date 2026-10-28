import { motion, useReducedMotion } from 'framer-motion';
import { DOSHA_COLOR } from '../data/viz.js';

// משולש הדושות: כל נקודה היא יחס בין שלוש הדושות.
// פיטה (אש) למעלה, ואטה מימין, קאפה משמאל.
const V = { pitta: [250, 46], vata: [452, 396], kapha: [48, 396] };
const DNAME = { vata: 'ואטה', pitta: 'פיטה', kapha: 'קאפה' };

export function toShares(pct) {
  const sum = (pct.vata || 0) + (pct.pitta || 0) + (pct.kapha || 0);
  if (!sum) return { vata: 1 / 3, pitta: 1 / 3, kapha: 1 / 3 };
  return { vata: pct.vata / sum, pitta: pct.pitta / sum, kapha: pct.kapha / sum };
}

export const project = (s) => [
  s.vata * V.vata[0] + s.pitta * V.pitta[0] + s.kapha * V.kapha[0],
  s.vata * V.vata[1] + s.pitta * V.pitta[1] + s.kapha * V.kapha[1],
];

const REGIONS = [
  { t: 'ואטה', s: { vata: 0.74, pitta: 0.13, kapha: 0.13 } },
  { t: 'פיטה', s: { vata: 0.13, pitta: 0.74, kapha: 0.13 } },
  { t: 'קאפה', s: { vata: 0.13, pitta: 0.13, kapha: 0.74 } },
  { t: 'ואטה-פיטה', s: { vata: 0.44, pitta: 0.44, kapha: 0.12 } },
  { t: 'פיטה-קאפה', s: { vata: 0.12, pitta: 0.44, kapha: 0.44 } },
  { t: 'ואטה-קאפה', s: { vata: 0.44, pitta: 0.12, kapha: 0.44 } },
  { t: 'שלוש הדושות', s: { vata: 1 / 3, pitta: 1 / 3, kapha: 1 / 3 } },
];

const tri = `${V.pitta.join(',')} ${V.vata.join(',')} ${V.kapha.join(',')}`;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export default function Ternary({ points = [], arrow = null, trail = [], regions = false, label }) {
  const reduce = useReducedMotion();
  const grid = [1 / 3, 2 / 3].flatMap((t) => [
    [lerp(V.pitta, V.vata, t), lerp(V.pitta, V.kapha, t)],
    [lerp(V.vata, V.pitta, t), lerp(V.vata, V.kapha, t)],
    [lerp(V.kapha, V.pitta, t), lerp(V.kapha, V.vata, t)],
  ]);
  const from = arrow ? project(toShares(arrow[0])) : null;
  const to = arrow ? project(toShares(arrow[1])) : null;

  return (
    <svg viewBox="0 0 500 450" className="ternary" role="img" aria-label={label || 'משולש הדושות'}>
      <defs>
        <clipPath id="tri-clip"><polygon points={tri} /></clipPath>
        {Object.entries(V).map(([d]) => (
          <radialGradient key={d} id={`tg-${d}`}>
            <stop offset="0" stopColor={DOSHA_COLOR[d]} stopOpacity=".75" />
            <stop offset="1" stopColor={DOSHA_COLOR[d]} stopOpacity="0" />
          </radialGradient>
        ))}
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="7" refY="5" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill="#1E2430" />
        </marker>
      </defs>
      <polygon points={tri} className="tri-base" />
      <g clipPath="url(#tri-clip)">
        {Object.entries(V).map(([d, [x, y]]) => (
          <circle key={d} cx={x} cy={y} r="300" fill={`url(#tg-${d})`} />
        ))}
      </g>
      {grid.map(([a, b], i) => (
        <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#fff" strokeOpacity=".55" strokeDasharray="4 5" />
      ))}
      <polygon points={tri} fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="2" />

      {regions &&
        REGIONS.map((r, i) => {
          const [x, y] = project(r.s);
          return (
            <motion.text
              key={r.t} x={x} y={y + 5} textAnchor="middle" fontSize={r.t.includes('-') || r.t.includes(' ') ? 13 : 16} fontWeight="600" fill="#fff"
              initial={{ opacity: 0 }} whileInView={{ opacity: 0.95 }} viewport={{ once: true }} transition={{ delay: 0.1 * i }}
              style={{ paintOrder: 'stroke', stroke: 'rgba(30,36,48,.35)', strokeWidth: 3 }}
            >
              {r.t}
            </motion.text>
          );
        })}

      {Object.entries(V).map(([d, [x, y]]) => (
        <text key={d} x={x} y={d === 'pitta' ? y - 16 : y + 32} textAnchor="middle" fontSize="20" fontWeight="600" fill={DOSHA_COLOR[d]}>
          {DNAME[d]}
        </text>
      ))}

      {trail.length > 1 && (
        <polyline
          points={trail.map((p) => project(toShares(p)).join(',')).join(' ')}
          fill="none" stroke="#1E2430" strokeOpacity=".35" strokeWidth="2" strokeDasharray="3 4"
        />
      )}
      {trail.map((p, i) => {
        const [x, y] = project(toShares(p));
        return <circle key={i} cx={x} cy={y} r="5" fill="#1E2430" opacity={0.15 + (0.5 * i) / trail.length} />;
      })}

      {arrow && (
        <motion.line
          x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke="#1E2430" strokeWidth="3" markerEnd="url(#arrowhead)"
          initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.4 }}
        />
      )}

      {points.map((p, i) => {
        const [x, y] = project(toShares(p.pct));
        return (
          <g key={p.label || i}>
            {!reduce && p.pulse && (
              <motion.circle cx={x} cy={y} r="12" initial={{ r: 12 }} fill="none" stroke={p.color || '#1E2430'} strokeWidth="2"
                animate={{ r: [12, 26], opacity: [0.8, 0] }} transition={{ duration: 1.8, repeat: Infinity }} />
            )}
            <motion.circle
              r={p.r || 11} cx={x} cy={y} fill={p.color || '#1E2430'} stroke="#fff" strokeWidth="3"
              initial={false} animate={{ cx: x, cy: y }} transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            />
            {p.label && (
              <motion.text
                textAnchor="middle" fontSize="13" fontWeight="600" className="svg-ink"
                initial={false} animate={{ x, y: p.below ? y + 32 : y - 20 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                style={{ paintOrder: 'stroke', stroke: 'rgba(255,250,240,.85)', strokeWidth: 4 }}
              >
                {p.label}
              </motion.text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
