import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ELEMENTS, DOSHA_COLOR, DOSHA_TINT, BUILD } from '../data/viz.js';
import { ElementGlyph } from './Glyphs.jsx';

// חמשת היסודות עולים כאדים אל שלוש הדושות. מים משותפים לפיטה ולקאפה.
const EX = { space: 530, air: 415, fire: 300, water: 185, earth: 70 };
const DX = { vata: 472, pitta: 262, kapha: 104 };
const DNAME = { vata: 'ואטה', pitta: 'פיטה', kapha: 'קאפה' };
const EY = 300;
const DY = 70;

const links = ELEMENTS.flatMap((e) => e.doshas.map((d) => ({ e: e.id, d, color: e.color })));
const path = (l) => `M ${EX[l.e]} ${EY - 28} C ${EX[l.e]} ${EY - 130}, ${DX[l.d]} ${DY + 130}, ${DX[l.d]} ${DY + 46}`;

export default function ElementsFlow() {
  const reduce = useReducedMotion();
  const [focus, setFocus] = useState(null);
  const lit = (l) => !focus || focus === l.e || focus === l.d;

  return (
    <figure className="viz">
      <svg viewBox="0 0 600 380" role="img" aria-label="חלל ואוויר יוצרים ואטה, אש ומים יוצרים פיטה, מים ואדמה יוצרים קאפה">
        {links.map((l, i) => (
          <g key={`${l.e}-${l.d}`} opacity={lit(l) ? 1 : 0.12} style={{ transition: 'opacity .5s cubic-bezier(.22,1,.36,1)' }}>
            <motion.path
              id={`flow-${l.e}-${l.d}`} d={path(l)} fill="none" stroke={l.color} strokeWidth="1.2"
              initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
              transition={{ duration: 1.6, delay: 0.12 * i, ease: [0.22, 1, 0.36, 1] }}
            />
            {!reduce &&
              [0, 1].map((k) => (
                <circle key={k} r="3" fill={l.color} opacity="0">
                  <animateMotion dur="5s" begin={`${k * 2.5 + i * 0.3}s`} repeatCount="indefinite" path={path(l)} />
                  <animate attributeName="opacity" values="0;.8;0" dur="5s" begin={`${k * 2.5 + i * 0.3}s`} repeatCount="indefinite" />
                </circle>
              ))}
          </g>
        ))}

        {ELEMENTS.map((e, i) => (
          <motion.g
            key={e.id} tabIndex={0} role="button" aria-label={`${e.name}: יוצר ${e.doshas.map((d) => DNAME[d]).join(' ו')}`}
            onMouseEnter={() => setFocus(e.id)} onMouseLeave={() => setFocus(null)} onFocus={() => setFocus(e.id)} onBlur={() => setFocus(null)}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.08 * i, duration: 0.8 }}
            style={{ cursor: 'pointer' }}
          >
            <circle cx={EX[e.id]} cy={EY} r="34" fill="transparent" />
            <ElementGlyph id={e.id} x={EX[e.id]} y={EY} r={22} />
            <text x={EX[e.id]} y={EY + 46} textAnchor="middle" fontSize="16" className="svg-ink">{e.name}</text>
            <text x={EX[e.id]} y={EY + 62} textAnchor="middle" fontSize="10.5" className="svg-mono">{e.sk}</text>
          </motion.g>
        ))}

        {Object.keys(DX).map((d, i) => (
          <motion.g
            key={d} tabIndex={0} role="button" aria-label={DNAME[d]}
            onMouseEnter={() => setFocus(d)} onMouseLeave={() => setFocus(null)} onFocus={() => setFocus(d)} onBlur={() => setFocus(null)}
            initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 1 + 0.15 * i, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} style={{ cursor: 'pointer' }}
          >
            <ellipse cx={DX[d]} cy={DY} rx={46 * BUILD[d].w} ry={44 * BUILD[d].h} fill={DOSHA_TINT[d]} opacity=".28" />
            <ellipse cx={DX[d]} cy={DY} rx={46 * BUILD[d].w} ry={44 * BUILD[d].h} fill="none" stroke={DOSHA_COLOR[d]} strokeWidth="1.5" />
            <text x={DX[d]} y={DY + 9} textAnchor="middle" fontSize="26" className="svg-display" fill={DOSHA_COLOR[d]}>{DNAME[d]}</text>
          </motion.g>
        ))}
      </svg>
      <figcaption>
        <span className="claim tradition">מסורת</span> כל דושה נוצרת משני יסודות, כמו אדים שעולים מחומר. לכל יסוד צורה: <mark className="hl">חלל ריק, אוויר נע, אש עולה, מים מתפשטים, אדמה מלאה</mark>. צורת הדושה היא מבנה הגוף שלה: ואטה צרה, פיטה בינונית, קאפה רחבה. מים משותפים לפיטה ולקאפה. עמדו על יסוד או על דושה כדי לראות את הקשרים.
      </figcaption>
    </figure>
  );
}
