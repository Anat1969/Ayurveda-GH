import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CONCEPTS, CLAIM } from '../data/concepts.js';
import { RECOMMENDATIONS } from '../data/recommendations.js';

const TONE = { tradition: 'var(--brass)', assessment: 'var(--vata)', research: 'var(--kapha)', none: 'var(--muted)' };
const ORDER = ['tradition', 'assessment', 'research', 'none'];

export function claimCounts() {
  const c = { tradition: 0, assessment: 0, research: 0, none: 0 };
  for (const concept of CONCEPTS) for (const s of concept.sections) c[s.claim] += 1;
  for (const list of Object.values(RECOMMENDATIONS)) for (const r of list) c[r.claim] += 1;
  return c;
}

// מד ההוכחות: כמה מהתוכן באפליקציה הוא מסורת, וכמה נבדק במחקר.
export function ClaimMeter() {
  const reduce = useReducedMotion();
  const c = claimCounts();
  const total = ORDER.reduce((s, k) => s + c[k], 0);
  let acc = 0;
  return (
    <figure className="viz">
      <div className="meter" role="img" aria-label={ORDER.map((k) => `${CLAIM[k]} ${c[k]}`).join(', ')}>
        {ORDER.map((k, i) => {
          const w = (c[k] / total) * 100;
          const left = acc;
          acc += w;
          return (
            <motion.div
              key={k} className="meter-seg" style={{ background: TONE[k], insetInlineStart: `${left}%`, width: `${w}%` }}
              initial={reduce ? false : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
              transition={{ delay: 0.2 * i, duration: 0.6 }}
            />
          );
        })}
      </div>
      <div className="meter-legend">
        {ORDER.map((k) => (
          <div key={k}>
            <b className="mono" style={{ color: TONE[k] }}>{Math.round((c[k] / total) * 100)}%</b>
            <span>{CLAIM[k]}</span>
            <small className="muted">{c[k]} פסקאות</small>
          </div>
        ))}
      </div>
      <figcaption>
        כל פסקה בספרייה וכל המלצה מסומנות. רוב התוכן הוא תיאור של מסורת. רק {c.research} פסקאות נשענות על מחקר, ורובן מוקדמות או בודקות עיקרון כללי ולא את הטענה המסורתית עצמה.
      </figcaption>
    </figure>
  );
}

// תרשים הבטיחות כשערים קונצנטריים: כל הודעה עוברת מבחוץ פנימה, שער אחרי שער,
// בדיוק בסדר שבו המסנן בקוד (src/lib/safety.js) בודק אותה. הטקסט במקרא, לא בתוך הצורות.
const GATES = [
  { n: 1, r: 196, tone: 'var(--alert)', q: 'סימן אזהרה', ex: 'כאב בחזה, דם, קוצר נשימה, חולשה בצד אחד', out: 'רופא מיד: מד"א 101 או 112', stop: true },
  { n: 2, r: 146, tone: 'var(--alert)', q: 'מצוקה נפשית', ex: 'מחשבות על פגיעה עצמית', out: 'ער"ן 1201, בכל שעה', stop: true },
  { n: 3, r: 96, tone: 'var(--brass)', q: 'תרופה, מינון, הריון, ילדים, מחלה כרונית', ex: '', out: 'הפניה לרופא או לרוקח, ואז הסבר', stop: false },
];

export function SafetyFlow() {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(null);
  const C = 210;
  return (
    <figure className="viz gates">
      <svg viewBox="0 0 420 420" role="img" aria-label="שלושה שערים שכל הודעה עוברת לפני שהיא מגיעה להסבר">
        {GATES.map((g) => (
          <circle key={g.n} cx={C} cy={C} r={g.r} fill={g.tone} fillOpacity={hover === g.n ? 0.1 : 0.035}
            stroke={g.tone} strokeWidth={hover === g.n ? 2.2 : 1.3} strokeDasharray={g.stop ? undefined : '3 5'}
            style={{ transition: 'all .5s cubic-bezier(.22,1,.36,1)' }} />
        ))}
        <circle cx={C} cy={C} r="46" fill="var(--kapha)" fillOpacity={hover === 4 ? 0.3 : 0.16} stroke="var(--kapha)" strokeWidth="1.3" />
        {GATES.map((g) => (
          <g key={g.n}>
            <circle cx={C} cy={C - g.r} r="13" fill="var(--bg)" stroke={g.tone} strokeWidth="1.3" />
            <text x={C} y={C - g.r + 5} textAnchor="middle" fontSize="14" className="mono" fill={g.tone}>{g.n}</text>
          </g>
        ))}
        <text x={C} y={C + 6} textAnchor="middle" fontSize="16" className="mono" fill="var(--kapha)">4</text>
        {!reduce && (
          <motion.circle r="6" cy={C} fill="var(--ink)" initial={{ cx: 418 }}
            animate={{ cx: [418, C + 196, C + 196, C + 146, C + 146, C + 96, C + 96, C + 30, C + 30], opacity: [0, 1, 1, 1, 1, 1, 1, 1, 0] }}
            transition={{ duration: 9, times: [0, 0.08, 0.2, 0.3, 0.42, 0.52, 0.64, 0.76, 1], repeat: Infinity, ease: 'easeInOut' }} />
        )}
      </svg>
      <ol className="gate-legend">
        {GATES.map((g) => (
          <li key={g.n} onMouseEnter={() => setHover(g.n)} onMouseLeave={() => setHover(null)} style={{ '--tone': g.tone }}>
            <span className="gate-n mono">{g.n}</span>
            <span>
              <b>{g.q}?</b>{g.ex && <span className="muted"> {g.ex}</span>}
              <span className="gate-out">כן: <mark className="hl">{g.out}</mark>{g.stop ? '. המודל לא מופעל.' : '.'}</span>
            </span>
          </li>
        ))}
        <li onMouseEnter={() => setHover(4)} onMouseLeave={() => setHover(null)} style={{ '--tone': 'var(--kapha)' }}>
          <span className="gate-n mono">4</span>
          <span><b>עבר את כל השערים</b><span className="gate-out">הסבר מסורתי, מסומן לפי סוג הטענה, עם הפניה קצרה.</span></span>
        </li>
      </ol>
      <figcaption>הנקודה היא הודעה. היא נבדקת מבחוץ פנימה, לפני שהיא מגיעה למודל. שער מלא עוצר אותה, שער מקווקו מוסיף הפניה וממשיך.</figcaption>
    </figure>
  );
}
