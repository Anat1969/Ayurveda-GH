import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// שתי שכבות שלא מתערבבות:
// 1. האיור: אנטומיה של מערכת העיכול (עובדה), איור רפואי בנחלת הכלל.
// 2. הסימון: מושבי הדושות העיקריים לפי המסורת (צ'ראקה ואשטאנגה הרידאיה). פרשנות על גבי האנטומיה.
// הקואורדינטות בשטח האיור המקורי. התצוגה חתוכה ל-viewBox 120 40 420 852, בלי השוליים הריקים.
const ZONES = [
  {
    d: 'kapha', n: 1, name: 'קאפה', seat: 'חזה וקיבה', sk: 'Uras, Amashaya', role: 'מבנה, סיכה וחוסן',
    shapes: [{ cx: 332, cy: 400, rx: 70, ry: 44 }, { cx: 396, cy: 536, rx: 58, ry: 42 }], mark: [396, 536],
  },
  {
    d: 'pitta', n: 2, name: 'פיטה', seat: 'מעי דק', sk: 'Grahani', role: 'עיכול, חום והמרה',
    shapes: [{ cx: 356, cy: 712, rx: 96, ry: 74 }], mark: [356, 712],
  },
  {
    d: 'vata', n: 3, name: 'ואטה', seat: 'מעי גס ואגן', sk: 'Pakvashaya', role: 'תנועה, נשימה והפרשה',
    shapes: [{ cx: 440, cy: 700, rx: 34, ry: 92 }, { cx: 338, cy: 818, rx: 62, ry: 42 }], mark: [338, 818],
  },
];

export default function BodyMap({ highlight = null, hero = false }) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const active = hover || pinned || highlight;
  const shown = ZONES.find((z) => z.d === active);

  return (
    <figure className={`viz ${hero ? 'anatomy-hero' : ''}`}>
      <div className="anatomy-layout">
        <div className="anatomy">
          <img src="/anatomy/digestive.svg" alt="איור אנטומי של מערכת העיכול: ושט, קיבה, כבד, מעי דק ומעי גס" width="420" height="852" />
          <svg className="overlay" viewBox="120 40 420 852" aria-hidden="true">
            <defs>
              {ZONES.map((z) => (
                <radialGradient key={z.d} id={`seat-${z.d}`}>
                  <stop offset="0" stopColor={`var(--${z.d}-tint, var(--${z.d}))`} stopOpacity=".55" />
                  <stop offset="1" stopColor={`var(--${z.d}-tint, var(--${z.d}))`} stopOpacity="0" />
                </radialGradient>
              ))}
            </defs>
            {ZONES.map((z, i) => {
              const on = !active || active === z.d;
              return (
                <g key={z.d} opacity={on ? 1 : 0.15} style={{ transition: 'opacity .5s cubic-bezier(.22,1,.36,1)' }}>
                  {z.shapes.map((s, k) => (
                    <g key={k}>
                      <ellipse cx={s.cx} cy={s.cy} rx={s.rx * 1.25} ry={s.ry * 1.25} fill={`url(#seat-${z.d})`} />
                      <motion.ellipse
                        cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill="none" stroke={`var(--${z.d})`} strokeWidth="2" strokeDasharray="4 6"
                        initial={reduce ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
                        transition={{ duration: 1.4, delay: 0.3 + i * 0.35, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </g>
                  ))}
                  <circle cx={z.mark[0]} cy={z.mark[1]} r="15" fill="var(--raised)" stroke={`var(--${z.d})`} strokeWidth="2" />
                  <text x={z.mark[0]} y={z.mark[1] + 6} textAnchor="middle" fontSize="17" fontFamily="IBM Plex Mono, monospace" fill={`var(--${z.d})`}>{z.n}</text>
                </g>
              );
            })}
            {shown && !reduce && (
              <circle className="breathe" cx={shown.mark[0]} cy={shown.mark[1]} r="22" fill="none" stroke="var(--ember)" strokeWidth="1.5" />
            )}
          </svg>
        </div>

        <ol className="seat-list" aria-label="מושבי הדושות">
          {ZONES.map((z) => (
            <li key={z.d}>
              <button
                type="button" className={`seat d-${z.d}`} aria-pressed={pinned === z.d}
                onMouseEnter={() => setHover(z.d)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(z.d)} onBlur={() => setHover(null)}
                onClick={() => setPinned(pinned === z.d ? null : z.d)}
              >
                <span className="mono seat-n">{z.n}</span>
                <span>
                  <span className="dosha-name seat-name">{z.name}</span>
                  <span className="seat-place">{z.seat}</span>
                  <span className="mono seat-sk">{z.sk}</span>
                  <span className="seat-role">{z.role}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <figcaption>
        <span className="claim research">עובדה מחקרית</span> האיור הוא אנטומיה. <span className="claim tradition">מסורת</span> הסימון הוא מושבי הדושות העיקריים לפי צ׳ראקה ואשטאנגה הרידאיה. מכל מושב, לפי המסורת, הדושה פועלת בכל הגוף.
        <span className="credit" style={{ display: 'block', marginTop: 5 }}>איור: Mariana Ruiz (LadyofHats), נחלת הכלל, Wikimedia Commons</span>
      </figcaption>
    </figure>
  );
}
