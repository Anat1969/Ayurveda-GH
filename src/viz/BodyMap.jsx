import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DOSHA_COLOR } from '../data/viz.js';

// מושבי הדושות בגוף לפי המסורת: קאפה בחזה ובקיבה, פיטה במעי הדק, ואטה במעי הגס.
const ZONES = [
  { d: 'kapha', name: 'קאפה', seat: 'חזה וקיבה', role: 'מבנה, סיכה וחוסן', cx: 150, cy: 168, rx: 46, ry: 30, lx: 270 },
  { d: 'pitta', name: 'פיטה', seat: 'מעי דק', role: 'עיכול, חום והמרה', cx: 150, cy: 232, rx: 36, ry: 24, lx: 270 },
  { d: 'vata', name: 'ואטה', seat: 'מעי גס ואגן', role: 'תנועה, נשימה והפרשה', cx: 150, cy: 290, rx: 42, ry: 24, lx: 270 },
];

export default function BodyMap({ highlight = null }) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(null);
  const active = hover || highlight;

  return (
    <figure className="viz">
      <svg viewBox="0 0 420 470" role="img" aria-label="מפת הגוף: קאפה בחזה, פיטה במעי הדק, ואטה במעי הגס">
        <defs>
          <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFF8EE" stopOpacity=".95" />
            <stop offset="1" stopColor="#EED9BF" stopOpacity=".85" />
          </linearGradient>
          {ZONES.map((z) => (
            <radialGradient key={z.d} id={`zone-${z.d}`}>
              <stop offset="0" stopColor={DOSHA_COLOR[z.d]} stopOpacity=".95" />
              <stop offset=".6" stopColor={DOSHA_COLOR[z.d]} stopOpacity=".55" />
              <stop offset="1" stopColor={DOSHA_COLOR[z.d]} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>
        <g className="body-shape">
          <circle cx="150" cy="62" r="34" fill="url(#body)" />
          <path
            d="M150 100 C 104 100 86 120 84 150 L 70 270 C 66 300 72 330 92 344 L 104 440 C 106 456 128 456 130 440 L 142 352 L 158 352 L 170 440 C 172 456 194 456 196 440 L 208 344 C 228 330 234 300 230 270 L 216 150 C 214 120 196 100 150 100 Z"
            fill="url(#body)"
          />
          <path d="M86 150 C 60 190 52 240 56 290" stroke="url(#body)" strokeWidth="22" strokeLinecap="round" fill="none" />
          <path d="M214 150 C 240 190 248 240 244 290" stroke="url(#body)" strokeWidth="22" strokeLinecap="round" fill="none" />
        </g>

        {ZONES.map((z, i) => {
          const on = !active || active === z.d;
          return (
            <g key={z.d} onMouseEnter={() => setHover(z.d)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
              <motion.ellipse
                cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} fill={`url(#zone-${z.d})`}
                animate={reduce ? { opacity: on ? 1 : 0.2 } : { opacity: on ? [0.75, 1, 0.75] : 0.2, scale: on ? [1, 1.08, 1] : 1 }}
                transition={{ duration: 2.6, repeat: reduce ? 0 : Infinity, delay: i * 0.5 }}
                style={{ originX: `${z.cx}px`, originY: `${z.cy}px` }}
              />
              <motion.line
                x1={z.cx + z.rx * 0.6} y1={z.cy} x2={z.lx - 6} y2={z.cy} stroke={DOSHA_COLOR[z.d]} strokeWidth="1.5" strokeDasharray="3 4"
                initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.25 }}
                opacity={on ? 1 : 0.25}
              />
              <motion.g initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: on ? 1 : 0.3, x: 0 }} animate={{ opacity: on ? 1 : 0.3 }} viewport={{ once: true }} transition={{ delay: 0.6 + i * 0.25 }}>
                <text x={z.lx + 72} y={z.cy - 6} textAnchor="middle" fontSize="19" fontWeight="600" fill={DOSHA_COLOR[z.d]}>{z.name}</text>
                <text x={z.lx + 72} y={z.cy + 14} textAnchor="middle" fontSize="13.5" className="svg-ink">{z.seat}</text>
                <text x={z.lx + 72} y={z.cy + 32} textAnchor="middle" fontSize="12" className="svg-muted">{z.role}</text>
              </motion.g>
            </g>
          );
        })}
      </svg>
      <figcaption>
        <span className="claim tradition">מסורת</span> לכל דושה יש מושב עיקרי בגוף, ומשם היא פועלת בכל הגוף. <span className="claim assessment">הערכה</span> זו מפה מושגית, לא אנטומיה.
      </figcaption>
    </figure>
  );
}
