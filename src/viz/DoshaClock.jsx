import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CLOCK, CLOCK_TEXT, DOSHA_COLOR, ROUTINE_MARKS, dosha24 } from '../data/viz.js';

const DNAME = { vata: 'ואטה', pitta: 'פיטה', kapha: 'קאפה' };
const C = 200;
// הצהריים למעלה, חצות למטה: השמש בשיאה בראש השעון.
const ang = (h) => ((h - 12) / 24) * Math.PI * 2 - Math.PI / 2;
const pt = (h, r) => [C + r * Math.cos(ang(h)), C + r * Math.sin(ang(h))];

function arc(from, to, r1, r2) {
  const [x1, y1] = pt(from, r2);
  const [x2, y2] = pt(to, r2);
  const [x3, y3] = pt(to, r1);
  const [x4, y4] = pt(from, r1);
  const large = to - from > 12 ? 1 : 0;
  return `M ${x1} ${y1} A ${r2} ${r2} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r1} ${r1} 0 ${large} 0 ${x4} ${y4} Z`;
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function DoshaClock({ routine = false, compact = false }) {
  const reduce = useReducedMotion();
  const now = useNow();
  const h = now.getHours() + now.getMinutes() / 60;
  const current = dosha24(h);
  const [hover, setHover] = useState(null);
  const shown = hover || current;
  const slot = CLOCK.find((c) => c.d === shown && (hover ? true : (h >= c.from && h < c.to) || (h + 24 >= c.from && h + 24 < c.to)));
  const [hx, hy] = pt(h, 150);

  return (
    <figure className={`viz ${compact ? 'viz-compact' : ''}`}>
      <svg viewBox={routine ? '-36 -24 472 448' : '0 0 400 400'} role="img" aria-label={`שעון הדושות. עכשיו שעת ${DNAME[current]}`}>
        <defs>
          <radialGradient id="clock-face" cx=".5" cy=".35" r=".7">
            <stop offset="0" stopColor="#FFF6E6" stopOpacity=".95" />
            <stop offset="1" stopColor="#F3E3CC" stopOpacity=".6" />
          </radialGradient>
        </defs>
        <circle cx={C} cy={C} r="188" fill="url(#clock-face)" className="clock-face" />
        {CLOCK.map((c, i) => {
          const isNow = c.d === current && ((h >= c.from && h < c.to) || (h + 24 >= c.from && h + 24 < c.to));
          return (
            <motion.path
              key={i} d={arc(c.from, c.to, 112, 176)} fill={DOSHA_COLOR[c.d]}
              initial={{ opacity: 0 }} whileInView={{ opacity: hover && hover !== c.d ? 0.25 : isNow ? 1 : 0.62 }}
              animate={{ opacity: hover && hover !== c.d ? 0.25 : isNow ? 1 : 0.62 }} viewport={{ once: true }}
              transition={{ delay: reduce ? 0 : 0.1 * i }} stroke="#FFF7EA" strokeWidth="3"
              onMouseEnter={() => setHover(c.d)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}
            />
          );
        })}
        {CLOCK.map((c, i) => {
          const [x, y] = pt((c.from + c.to) / 2, 144);
          return (
            <text key={`t${i}`} x={x} y={y + 6} textAnchor="middle" fontSize="16" fontWeight="600" fill="#fff" style={{ pointerEvents: 'none' }}>
              {DNAME[c.d]}
            </text>
          );
        })}
        {[0, 6, 12, 18].map((t) => {
          const [x, y] = pt(t, 194);
          return (
            <text key={t} x={x} y={y + 4} textAnchor="middle" fontSize="12" className="svg-mono">
              {String(t).padStart(2, '0')}:00
            </text>
          );
        })}
        <motion.line
          x1={C} y1={C} x2={hx} y2={hy} stroke="#1E2430" strokeWidth="4" strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }}
        />
        {!reduce && (
          <motion.circle cx={hx} cy={hy} r="9" initial={{ r: 9 }} fill="#FFF4D6" stroke="#1E2430" strokeWidth="3"
            animate={{ r: [8, 12, 8] }} transition={{ duration: 2, repeat: Infinity }} />
        )}
        <circle cx={C} cy={C} r="96" className="clock-center" />
        <text x={C} y={C - 26} textAnchor="middle" fontSize="12" className="svg-mono">
          {hover ? 'בשעות אלה' : `עכשיו ${now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`}
        </text>
        <text x={C} y={C + 8} textAnchor="middle" fontSize="30" fontWeight="600" fill={DOSHA_COLOR[shown]}>
          {DNAME[shown]}
        </text>
        {routine &&
          ROUTINE_MARKS.map((m) => {
            const [x1, y1] = pt(m.h, 110);
            const [x2, y2] = pt(m.h, 196);
            const [tx, ty] = pt(m.h, 216);
            return (
              <g key={m.t}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} className="routine-mark" strokeWidth="2.5" strokeDasharray="4 3" />
                <text x={tx} y={ty + 4} textAnchor="middle" fontSize="13" fontWeight="600" className="svg-ink" style={{ paintOrder: 'stroke', stroke: 'var(--bg)', strokeWidth: 4 }}>{m.t}</text>
              </g>
            );
          })}
        {slot && (
          <text x={C} y={C + 34} textAnchor="middle" fontSize="13" className="svg-mono">
            {String(slot.from % 24).padStart(2, '0')}:00 עד {String(slot.to % 24).padStart(2, '0')}:00
          </text>
        )}
      </svg>
      {!compact && (
        <figcaption>
          <span className="claim tradition">מסורת</span> {CLOCK_TEXT[shown]} המחזור חוזר פעמיים ביממה. השעות בקירוב.
        </figcaption>
      )}
    </figure>
  );
}
