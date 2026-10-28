import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MONTHS, MONTH_DOSHA, SEASON_TEXT, DOSHA_COLOR } from '../data/viz.js';

const DNAME = { vata: 'ואטה', pitta: 'פיטה', kapha: 'קאפה' };
const C = 200;
const ang = (i) => (i / 12) * Math.PI * 2 - Math.PI / 2;
const pt = (i, r) => [C + r * Math.cos(ang(i)), C + r * Math.sin(ang(i))];

function seg(i, r1, r2) {
  const a = i - 0.48;
  const b = i + 0.48;
  const [x1, y1] = pt(a, r2);
  const [x2, y2] = pt(b, r2);
  const [x3, y3] = pt(b, r1);
  const [x4, y4] = pt(a, r1);
  return `M ${x1} ${y1} A ${r2} ${r2} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${r1} ${r1} 0 0 0 ${x4} ${y4} Z`;
}

// גלגל העונות בישראל. ההתאמה לאקלים המקומי היא הערכה.
export function SeasonWheel() {
  const reduce = useReducedMotion();
  const month = new Date().getMonth();
  const [hover, setHover] = useState(null);
  const m = hover ?? month;
  const d = MONTH_DOSHA[m];

  return (
    <figure className="viz">
      <svg viewBox="0 0 400 400" role="img" aria-label={`גלגל העונות. החודש: ${MONTHS[month]}, עונת ${DNAME[MONTH_DOSHA[month]]}`}>
        <circle cx={C} cy={C} r="190" className="clock-face-soft" />
        {MONTHS.map((name, i) => {
          const [tx, ty] = pt(i, 160);
          const isNow = i === month;
          return (
            <g key={name} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
              <motion.path
                d={seg(i, 128, 186)} fill={DOSHA_COLOR[MONTH_DOSHA[i]]}
                initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: isNow ? 1 : hover === i ? 0.95 : 0.6, scale: 1 }}
                animate={{ opacity: isNow ? 1 : hover === i ? 0.95 : 0.6 }}
                viewport={{ once: true }} transition={{ delay: reduce ? 0 : i * 0.05 }}
                style={{ originX: '200px', originY: '200px' }} stroke="#FFF7EA" strokeWidth="2"
              />
              <text x={tx} y={ty + 4} textAnchor="middle" fontSize="12.5" fontWeight={isNow ? 700 : 500} fill="#fff" style={{ pointerEvents: 'none' }}>
                {name}
              </text>
            </g>
          );
        })}
        {!reduce && (
          <motion.path
            d={seg(month, 122, 192)} fill="none" stroke="#1E2430" strokeWidth="3"
            animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 2.4, repeat: Infinity }}
          />
        )}
        <circle cx={C} cy={C} r="110" className="clock-center" />
        <text x={C} y={C - 24} textAnchor="middle" fontSize="12" className="svg-mono">{hover === null ? 'החודש' : 'בחודש'}</text>
        <text x={C} y={C + 2} textAnchor="middle" fontSize="20" fontWeight="600" className="svg-ink">{MONTHS[m]}</text>
        <text x={C} y={C + 34} textAnchor="middle" fontSize="26" fontWeight="600" fill={DOSHA_COLOR[d]}>{DNAME[d]}</text>
      </svg>
      <figcaption>
        <span className="claim assessment">הערכה</span> {SEASON_TEXT[d]} המסורת מחלקת את השנה לשש עונות לפי האקלים בהודו. החלוקה כאן מותאמת לישראל.
      </figcaption>
    </figure>
  );
}

// שלבי החיים: מעבר הדרגתי, בלי גילאים מדויקים.
export function LifeStages() {
  const stages = [
    { d: 'kapha', t: 'ילדות', s: 'צמיחה ובנייה' },
    { d: 'pitta', t: 'בגרות', s: 'עשייה והמרה' },
    { d: 'vata', t: 'זקנה', s: 'קלילות ויובש' },
  ];
  return (
    <figure className="viz">
      <svg viewBox="0 0 600 170" role="img" aria-label="ילדות קאפה, בגרות פיטה, זקנה ואטה">
        <defs>
          <linearGradient id="life" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor={DOSHA_COLOR.kapha} />
            <stop offset=".5" stopColor={DOSHA_COLOR.pitta} />
            <stop offset="1" stopColor={DOSHA_COLOR.vata} />
          </linearGradient>
        </defs>
        <motion.rect
          x="20" y="58" width="560" height="38" rx="19" fill="url(#life)"
          initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: 'easeOut' }}
          style={{ originX: '580px' }}
        />
        <rect x="20" y="58" width="560" height="14" rx="7" fill="#fff" opacity=".25" />
        {stages.map((s, i) => {
          const x = 500 - i * 200;
          return (
            <motion.g key={s.d} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.3 }}>
              <text x={x} y="40" textAnchor="middle" fontSize="19" fontWeight="600" className="svg-ink">{s.t}</text>
              <text x={x} y="83" textAnchor="middle" fontSize="16" fontWeight="600" fill="#fff">{DNAME[s.d]}</text>
              <text x={x} y="124" textAnchor="middle" fontSize="13.5" className="svg-muted">{s.s}</text>
            </motion.g>
          );
        })}
        <text x="300" y="158" textAnchor="middle" fontSize="11.5" className="svg-mono">המעבר הדרגתי. הגילאים המדויקים משתנים בין פרשנויות</text>
      </svg>
      <figcaption>
        <span className="claim tradition">מסורת</span> הסדר הכללי: קאפה בילדות, פיטה בבגרות, ואטה בזקנה. <span className="claim assessment">הערכה</span> כל גיל מדויק הוא פרשנות.
      </figcaption>
    </figure>
  );
}
