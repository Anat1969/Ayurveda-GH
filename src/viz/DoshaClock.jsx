import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CLOCK, CLOCK_TEXT, DOSHA_COLOR, DOSHA_TINT, ROUTINE_MARKS, dosha24 } from '../data/viz.js';

// שעון הדושות כקערת פליז במבט מלמעלה. הצהריים למעלה, חצות למטה.
const DNAME = { vata: 'ואטה', pitta: 'פיטה', kapha: 'קאפה' };
const C = 200;
const ang = (h) => ((h - 12) / 24) * Math.PI * 2 - Math.PI / 2;
const pt = (h, r) => [C + r * Math.cos(ang(h)), C + r * Math.sin(ang(h))];

function wedge(from, to, r) {
  const [x1, y1] = pt(from, r);
  const [x2, y2] = pt(to, r);
  return `M ${C} ${C} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const inSlot = (c, h) => (h >= c.from && h < c.to) || (h + 24 >= c.from && h + 24 < c.to);

export default function DoshaClock({ routine = false, compact = false }) {
  const reduce = useReducedMotion();
  const now = useNow();
  const h = now.getHours() + now.getMinutes() / 60;
  const current = dosha24(h);
  const [hover, setHover] = useState(null);
  const shown = hover || current;
  const slot = CLOCK.find((c) => c.d === shown && (hover ? true : inSlot(c, h)));
  const [hx, hy] = pt(h, 168);

  return (
    <figure className={`viz ${compact ? 'viz-compact' : ''}`}>
      <svg viewBox={routine ? '-36 -24 472 448' : '-20 -20 440 440'} role="img" aria-label={`שעון הדושות. עכשיו שעת ${DNAME[current]}`}>
        <circle cx={C} cy={C} r="182" className="clock-face" strokeWidth="1.5" />
        <circle cx={C} cy={C} r="174" fill="none" className="stroke-line" />
        {CLOCK.map((c, i) => {
          const isNow = inSlot(c, h);
          const lit = hover ? hover === c.d : isNow;
          return (
            <motion.path
              key={i} d={wedge(c.from, c.to, 174)} fill={DOSHA_TINT[c.d]}
              initial={{ opacity: 0 }} animate={{ opacity: lit ? 0.42 : 0.12 }}
              transition={{ duration: 0.8, delay: reduce ? 0 : 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={() => setHover(c.d)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}
            />
          );
        })}
        {CLOCK.map((c, i) => {
          const [x1, y1] = pt(c.from, 112);
          const [x2, y2] = pt(c.from, 174);
          const [tx, ty] = pt((c.from + c.to) / 2, 143);
          return (
            <g key={`s${i}`} style={{ pointerEvents: 'none' }}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-line" />
              <text x={tx} y={ty + 6} textAnchor="middle" fontSize="17" className="svg-display" fill={DOSHA_COLOR[c.d]}>{DNAME[c.d]}</text>
            </g>
          );
        })}
        {Array.from({ length: 24 }, (_, t) => {
          const [x1, y1] = pt(t, 182);
          const [x2, y2] = pt(t, t % 6 === 0 ? 194 : 188);
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-brass" />;
        })}
        {[0, 6, 12, 18].map((t) => {
          const [x, y] = pt(t, 205);
          return <text key={t} x={x} y={y + 4} textAnchor="middle" fontSize="11" className="svg-mono">{String(t).padStart(2, '0')}</text>;
        })}

        <circle cx={C} cy={C} r="104" className="clock-center" />
        <circle cx={C} cy={C} r="96" fill="none" className="stroke-hair" strokeDasharray="1 5" />

        {routine &&
          ROUTINE_MARKS.map((m) => {
            const [x1, y1] = pt(m.h, 110);
            const [x2, y2] = pt(m.h, 196);
            const [tx, ty] = pt(m.h, 218);
            return (
              <g key={m.t}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} className="routine-mark" strokeWidth="1" strokeDasharray="3 3" />
                <text x={tx} y={ty + 4} textAnchor="middle" fontSize="12.5" className="svg-ink graph-label">{m.t}</text>
              </g>
            );
          })}

        <line x1={C} y1={C} x2={hx} y2={hy} className="stroke-brass" strokeWidth="1.5" />
        <circle cx={hx} cy={hy} r="7" fill="var(--ember)" className={reduce ? undefined : 'breathe'} />
        <circle cx={C} cy={C} r="3" fill="var(--brass)" />

        <text x={C} y={C - 28} textAnchor="middle" fontSize="11" className="svg-mono">
          {hover ? 'בשעות אלה' : `עכשיו ${now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`}
        </text>
        <text x={C} y={C + 12} textAnchor="middle" fontSize="34" className="svg-display" fill={DOSHA_COLOR[shown]}>{DNAME[shown]}</text>
        {slot && (
          <text x={C} y={C + 38} textAnchor="middle" fontSize="11.5" className="svg-mono">
            {String(slot.from % 24).padStart(2, '0')}:00–{String(slot.to % 24).padStart(2, '0')}:00
          </text>
        )}
      </svg>
      {!compact && (
        <figcaption>
          <span className="claim tradition">מסורת</span> {CLOCK_TEXT[shown]} המחזור חוזר פעמיים ביממה, והשעות בקירוב.
        </figcaption>
      )}
    </figure>
  );
}
