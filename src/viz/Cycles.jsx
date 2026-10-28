import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MONTHS, MONTH_DOSHA, SEASON_TEXT, DOSHA_COLOR, DOSHA_TINT } from '../data/viz.js';

const DNAME = { vata: 'ואטה', pitta: 'פיטה', kapha: 'קאפה' };
const C = 200;
const ang = (i) => (i / 12) * Math.PI * 2 - Math.PI / 2;
const pt = (i, r) => [C + r * Math.cos(ang(i)), C + r * Math.sin(ang(i))];

function seg(i, r1, r2) {
  const a = i - 0.5;
  const b = i + 0.5;
  const [x1, y1] = pt(a, r2);
  const [x2, y2] = pt(b, r2);
  const [x3, y3] = pt(b, r1);
  const [x4, y4] = pt(a, r1);
  return `M ${x1} ${y1} A ${r2} ${r2} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${r1} ${r1} 0 0 0 ${x4} ${y4} Z`;
}

// גלגל העונות כטבעת פליז חרוטה. ההתאמה לאקלים בישראל היא הערכה.
export function SeasonWheel() {
  const reduce = useReducedMotion();
  const month = new Date().getMonth();
  const [hover, setHover] = useState(null);
  const m = hover ?? month;
  const d = MONTH_DOSHA[m];

  return (
    <figure className="viz">
      <svg viewBox="0 0 400 400" role="img" aria-label={`גלגל העונות. החודש: ${MONTHS[month]}, עונת ${DNAME[MONTH_DOSHA[month]]}`}>
        <circle cx={C} cy={C} r="188" className="clock-face-soft" strokeWidth="1.5" />
        {MONTHS.map((name, i) => {
          const [tx, ty] = pt(i, 156);
          const lit = i === m;
          const [l1x, l1y] = pt(i - 0.5, 126);
          const [l2x, l2y] = pt(i - 0.5, 186);
          return (
            <g key={name} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
              <motion.path
                d={seg(i, 126, 186)} fill={DOSHA_TINT[MONTH_DOSHA[i]]}
                initial={{ opacity: 0 }} animate={{ opacity: lit ? 0.5 : 0.14 }}
                transition={{ duration: 0.8, delay: reduce ? 0 : i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              />
              <line x1={l1x} y1={l1y} x2={l2x} y2={l2y} className="stroke-line" />
              <text x={tx} y={ty + 4} textAnchor="middle" fontSize="12" className="svg-ink" style={{ pointerEvents: 'none', fontWeight: lit ? 600 : 400 }}>{name}</text>
            </g>
          );
        })}
        <path d={seg(month, 120, 192)} fill="none" stroke="var(--ember)" strokeWidth="1.5" />
        <circle cx={C} cy={C} r="114" className="clock-center" />
        <text x={C} y={C - 26} textAnchor="middle" fontSize="11" className="svg-mono">{hover === null ? 'החודש' : 'בחודש'}</text>
        <text x={C} y={C + 2} textAnchor="middle" fontSize="20" className="svg-ink">{MONTHS[m]}</text>
        <text x={C} y={C + 38} textAnchor="middle" fontSize="32" className="svg-display" fill={DOSHA_COLOR[d]}>{DNAME[d]}</text>
      </svg>
      <figcaption>
        <span className="claim assessment">הערכה</span> {SEASON_TEXT[d]} המסורת מחלקת את השנה לשש עונות לפי האקלים בהודו. החלוקה כאן מותאמת לישראל.
      </figcaption>
    </figure>
  );
}

// שלבי החיים על קו זהב אנכי, בלי גילאים מדויקים.
export function LifeStages() {
  const stages = [
    { d: 'kapha', t: 'ילדות', s: 'צמיחה ובנייה' },
    { d: 'pitta', t: 'בגרות', s: 'עשייה והמרה' },
    { d: 'vata', t: 'זקנה', s: 'קלילות ויובש' },
  ];
  return (
    <figure className="viz">
      <svg viewBox="0 0 600 150" role="img" aria-label="ילדות קאפה, בגרות פיטה, זקנה ואטה">
        <motion.line x1="560" y1="70" x2="40" y2="70" className="stroke-brass" strokeWidth="1.5"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }} />
        {stages.map((s, i) => {
          const x = 480 - i * 180;
          return (
            <motion.g key={s.d} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.3, duration: 0.8 }}>
              <circle cx={x} cy="70" r="7" fill={DOSHA_COLOR[s.d]} />
              <text x={x} y="44" textAnchor="middle" fontSize="20" className="svg-ink">{s.t}</text>
              <text x={x} y="102" textAnchor="middle" fontSize="20" className="svg-display" fill={DOSHA_COLOR[s.d]}>{DNAME[s.d]}</text>
              <text x={x} y="124" textAnchor="middle" fontSize="12.5" className="svg-muted">{s.s}</text>
            </motion.g>
          );
        })}
        <text x="300" y="146" textAnchor="middle" fontSize="11" className="svg-mono">המעבר הדרגתי. הגילאים המדויקים משתנים בין פרשנויות</text>
      </svg>
      <figcaption>
        <span className="claim tradition">מסורת</span> הסדר הכללי: קאפה בילדות, פיטה בבגרות, ואטה בזקנה. <span className="claim assessment">הערכה</span> כל גיל מדויק הוא פרשנות.
      </figcaption>
    </figure>
  );
}
