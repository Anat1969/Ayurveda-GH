import { motion, useReducedMotion } from 'framer-motion';
import { CONCEPTS, CLAIM } from '../data/concepts.js';
import { RECOMMENDATIONS } from '../data/recommendations.js';

const TONE = { tradition: '#C98A2A', assessment: '#1F8A9E', research: '#2E9E7A', none: '#9A8E80' };
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

// תרשים הבטיחות: זה בדיוק הסדר שבו המסנן בקוד בודק כל הודעה.
const STEPS = [
  { q: 'סימן אזהרה? כאב בחזה, דם, קוצר נשימה, חולשה בצד אחד', yes: 'רופא מיד · מד"א 101 · 112', tone: '#A8282E' },
  { q: 'מצוקה נפשית או מחשבות על פגיעה עצמית?', yes: 'ער"ן 1201, בכל שעה', tone: '#A8282E' },
  { q: 'תרופה, מינון, הריון, ילדים, מחלה כרונית?', yes: 'הודעת הפניה לרופא או לרוקח, ואז הסבר', tone: '#C98A2A' },
];

export function SafetyFlow() {
  const reduce = useReducedMotion();
  const rowH = 112;
  const H = 70 + STEPS.length * rowH + 80;
  return (
    <figure className="viz">
      <svg viewBox={`0 0 600 ${H}`} role="img" aria-label="תרשים הבטיחות של היועצת">
        <defs>
          <marker id="flow-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
            <path d="M0 0 L10 5 L0 10 Z" fill="#8A7B68" />
          </marker>
        </defs>
        <rect x="330" y="14" width="240" height="44" rx="22" className="flow-box" />
        <text x="450" y="42" textAnchor="middle" fontSize="15" fontWeight="600" className="svg-ink">הודעה מהמשתמש</text>
        {STEPS.map((s, i) => {
          const y = 70 + i * rowH;
          const cy = y + 52;
          return (
            <motion.g key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduce ? 0 : 0.25 * i }}>
              <line x1="450" y1={y - 12} x2="450" y2={cy - 40} stroke="#8A7B68" strokeWidth="2" markerEnd="url(#flow-arrow)" />
              <path d={`M450 ${cy - 38} L570 ${cy} L450 ${cy + 38} L330 ${cy} Z`} className="flow-diamond" />
              <foreignObject x="345" y={cy - 30} width="210" height="60">
                <div className="flow-q">{s.q}</div>
              </foreignObject>
              <line x1="330" y1={cy} x2="262" y2={cy} stroke={s.tone} strokeWidth="2" markerEnd="url(#flow-arrow)" />
              <text x="296" y={cy - 8} textAnchor="middle" fontSize="12" fontWeight="600" fill={s.tone}>כן</text>
              <rect x="20" y={cy - 26} width="236" height="52" rx="26" fill={s.tone} opacity=".14" stroke={s.tone} />
              <foreignObject x="30" y={cy - 22} width="216" height="44">
                <div className="flow-a" style={{ color: s.tone }}>{s.yes}</div>
              </foreignObject>
              <text x="464" y={cy + 58} fontSize="12" fontWeight="600" className="svg-muted" textAnchor="middle">לא</text>
            </motion.g>
          );
        })}
        <motion.g initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: reduce ? 0 : 0.9 }}>
          <line x1="450" y1={70 + STEPS.length * rowH - 22} x2="450" y2={70 + STEPS.length * rowH + 4} stroke="#8A7B68" strokeWidth="2" markerEnd="url(#flow-arrow)" />
          <rect x="300" y={70 + STEPS.length * rowH + 8} width="300" height="52" rx="26" fill="#2E9E7A" opacity=".16" stroke="#2E9E7A" />
          <foreignObject x="310" y={70 + STEPS.length * rowH + 12} width="280" height="44">
            <div className="flow-a" style={{ color: 'var(--kapha-ink)' }}>הסבר מסורתי, מסומן, עם הפניה קצרה</div>
          </foreignObject>
        </motion.g>
      </svg>
      <figcaption>
        זה הסדר שבו הקוד בודק כל הודעה, לפני שהיא מגיעה למודל. בשני המצבים הראשונים המודל לא מופעל בכלל, והתשובה קבועה.
      </figcaption>
    </figure>
  );
}
