import { motion, useReducedMotion } from 'framer-motion';
import { DOSHA_COLOR } from '../data/viz.js';

// משולש החוקה כפריזמה: אור אחד נכנס ומתפרק לשלוש דושות.
// כל נקודה בתוכו היא יחס בין שלוש הדושות. פיטה למעלה, ואטה מימין, קאפה משמאל.
const V = { pitta: [250, 60], vata: [450, 406], kapha: [50, 406] };
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
// כיוון היציאה של כל קרן מהקודקוד, החוצה מהמשולש
const OUT = { pitta: [0, -34], vata: [30, 22], kapha: [-30, 22] };

export default function Ternary({ points = [], arrow = null, trail = [], regions = false, label }) {
  const reduce = useReducedMotion();
  const grid = [1 / 3, 2 / 3].flatMap((t) => [
    [lerp(V.pitta, V.vata, t), lerp(V.pitta, V.kapha, t)],
    [lerp(V.vata, V.pitta, t), lerp(V.vata, V.kapha, t)],
    [lerp(V.kapha, V.pitta, t), lerp(V.kapha, V.vata, t)],
  ]);
  const from = arrow ? project(toShares(arrow[0])) : null;
  const to = arrow ? project(toShares(arrow[1])) : null;
  const focus = points.find((p) => p.pulse) || points[0];
  const fp = focus ? project(toShares(focus.pct)) : [250, 290];

  return (
    <svg viewBox="-46 -32 592 504" className="ternary" role="img" aria-label={label || 'משולש הדושות'}>
      <defs>
        <radialGradient id="prism-light">
          <stop offset="0" stopColor="var(--ember)" stopOpacity=".35" />
          <stop offset="1" stopColor="var(--ember)" stopOpacity="0" />
        </radialGradient>
        {Object.keys(V).map((d) => (
          <radialGradient key={d} id={`pg-${d}`}>
            <stop offset="0" stopColor={DOSHA_COLOR[d]} stopOpacity=".22" />
            <stop offset="1" stopColor={DOSHA_COLOR[d]} stopOpacity="0" />
          </radialGradient>
        ))}
        <clipPath id="prism-clip"><polygon points={tri} /></clipPath>
      </defs>

      {/* קרן האור הנכנסת */}
      <line x1="540" y1="190" x2={fp[0]} y2={fp[1]} stroke="var(--brass)" strokeWidth="1" strokeOpacity=".55" strokeDasharray="2 5" className={reduce ? undefined : 'sweep'} />

      <polygon points={tri} className="tri-base" />
      <g clipPath="url(#prism-clip)">
        {Object.entries(V).map(([d, [x, y]]) => (
          <circle key={d} cx={x} cy={y} r="240" fill={`url(#pg-${d})`} />
        ))}
        <circle cx={fp[0]} cy={fp[1]} r="110" fill="url(#prism-light)" />
      </g>
      {grid.map(([a, b], i) => (
        <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="stroke-hair" strokeDasharray="2 5" />
      ))}
      <polygon points={tri} fill="none" className="stroke-brass" strokeWidth="1.5" />

      {/* שלוש הקרניים היוצאות */}
      {Object.entries(V).map(([d, [x, y]]) => (
        <line key={d} x1={x} y1={y} x2={x + OUT[d][0]} y2={y + OUT[d][1]} stroke={DOSHA_COLOR[d]} strokeWidth="2" />
      ))}
      {Object.entries(V).map(([d, [x, y]]) => (
        <text key={d} x={x + OUT[d][0] * 1.6} y={y + OUT[d][1] * 1.6 + (d === 'pitta' ? -4 : 16)} textAnchor="middle" fontSize="24" className="svg-display" fill={DOSHA_COLOR[d]}>
          {DNAME[d]}
        </text>
      ))}

      {regions &&
        REGIONS.map((r, i) => {
          const [x, y] = project(r.s);
          return (
            <motion.text
              key={r.t} x={x} y={y + 5} textAnchor="middle" fontSize={r.t.includes('-') || r.t.includes(' ') ? 12 : 15} className="svg-ink graph-label"
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.12 * i, duration: 0.8 }}
            >
              {r.t}
            </motion.text>
          );
        })}

      {trail.length > 1 && (
        <polyline points={trail.map((p) => project(toShares(p)).join(',')).join(' ')} fill="none" stroke="var(--muted)" strokeWidth="1" strokeDasharray="2 4" />
      )}
      {trail.map((p, i) => {
        const [x, y] = project(toShares(p));
        return <circle key={i} cx={x} cy={y} r="4" fill="var(--muted)" opacity={0.25 + (0.5 * i) / trail.length} />;
      })}

      {arrow && (
        <motion.line
          x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke="var(--ink)" strokeWidth="1.5"
          initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      )}

      {points.map((p, i) => {
        const [x, y] = project(toShares(p.pct));
        const color = p.color || 'var(--ink)';
        return (
          <g key={p.label || i}>
            {!reduce && p.pulse && (
              <motion.circle cx={x} cy={y} r="12" initial={{ r: 12 }} fill="none" stroke={color} strokeWidth="1"
                animate={{ r: [12, 22, 12], opacity: [0.7, 0.15, 0.7] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
            )}
            <motion.circle
              r={p.r || 8} cx={x} cy={y} fill={color} stroke="var(--raised)" strokeWidth="2"
              initial={false} animate={{ cx: x, cy: y }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
            {p.label && (
              <motion.text
                textAnchor="middle" fontSize="12.5" className="svg-ink graph-label" style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                initial={false} animate={{ x, y: p.below ? y + 28 : y - 18 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
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
