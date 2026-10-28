import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ELEMENTS, DOSHA_COLOR } from '../data/viz.js';

// חמשת היסודות זורמים לשלוש הדושות. מים משותפים לפיטה ולקאפה.
const EX = { space: 530, air: 415, fire: 300, water: 185, earth: 70 };
const DX = { vata: 472, pitta: 262, kapha: 104 };
const DNAME = { vata: 'ואטה', pitta: 'פיטה', kapha: 'קאפה' };
const EY = 70;
const DY = 300;

const links = ELEMENTS.flatMap((e) => e.doshas.map((d) => ({ e: e.id, d, color: e.color })));
const path = (l) => `M ${EX[l.e]} ${EY + 34} C ${EX[l.e]} ${EY + 140}, ${DX[l.d]} ${DY - 150}, ${DX[l.d]} ${DY - 44}`;

export default function ElementsFlow() {
  const reduce = useReducedMotion();
  const [focus, setFocus] = useState(null);
  const lit = (l) => !focus || focus === l.e || focus === l.d;

  return (
    <figure className="viz">
      <svg viewBox="0 0 600 370" role="img" aria-label="חלל ואוויר יוצרים ואטה, אש ומים יוצרים פיטה, מים ואדמה יוצרים קאפה">
        <defs>
          {ELEMENTS.map((e) => (
            <radialGradient key={e.id} id={`el-${e.id}`} cx=".35" cy=".3" r=".8">
              <stop offset="0" stopColor="#fff" stopOpacity=".85" />
              <stop offset=".35" stopColor={e.color} />
              <stop offset="1" stopColor={e.color} stopOpacity=".85" />
            </radialGradient>
          ))}
          {Object.entries(DOSHA_COLOR).map(([d, c]) => (
            <radialGradient key={d} id={`do-${d}`} cx=".35" cy=".3" r=".85">
              <stop offset="0" stopColor="#fff" stopOpacity=".7" />
              <stop offset=".4" stopColor={c} />
              <stop offset="1" stopColor={c} />
            </radialGradient>
          ))}
        </defs>

        {links.map((l, i) => (
          <g key={`${l.e}-${l.d}`} opacity={lit(l) ? 1 : 0.12} style={{ transition: 'opacity .3s' }}>
            <motion.path
              id={`flow-${l.e}-${l.d}`} d={path(l)} fill="none" stroke={l.color} strokeWidth="10" strokeLinecap="round" opacity=".28"
              initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.15 * i }}
            />
            <path d={path(l)} fill="none" stroke={l.color} strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" opacity=".8" />
            {!reduce &&
              [0, 1, 2].map((k) => (
                <circle key={k} r="4.5" fill={l.color}>
                  <animateMotion dur="2.8s" begin={`${k * 0.93 + i * 0.2}s`} repeatCount="indefinite">
                    <mpath href={`#flow-${l.e}-${l.d}`} />
                  </animateMotion>
                </circle>
              ))}
          </g>
        ))}

        {ELEMENTS.map((e, i) => (
          <motion.g
            key={e.id} tabIndex={0} role="button" aria-label={`${e.name}: יוצר ${e.doshas.map((d) => DNAME[d]).join(' ו')}`}
            onMouseEnter={() => setFocus(e.id)} onMouseLeave={() => setFocus(null)} onFocus={() => setFocus(e.id)} onBlur={() => setFocus(null)}
            initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}
            transition={{ type: 'spring', delay: 0.08 * i }} style={{ originX: `${EX[e.id]}px`, originY: `${EY}px`, cursor: 'pointer' }}
          >
            <circle cx={EX[e.id]} cy={EY} r="34" fill={`url(#el-${e.id})`} stroke="#fff" strokeOpacity=".6" />
            <text x={EX[e.id]} y={EY + 6} textAnchor="middle" fontSize="17" fontWeight="600" fill="#fff">{e.name}</text>
            <text x={EX[e.id]} y={EY - 44} textAnchor="middle" fontSize="11" className="svg-mono">{e.sk}</text>
          </motion.g>
        ))}

        {Object.keys(DX).map((d, i) => (
          <motion.g
            key={d} tabIndex={0} role="button" aria-label={DNAME[d]}
            onMouseEnter={() => setFocus(d)} onMouseLeave={() => setFocus(null)} onFocus={() => setFocus(d)} onBlur={() => setFocus(null)}
            initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.9 + 0.12 * i }} style={{ cursor: 'pointer' }}
          >
            <ellipse cx={DX[d]} cy={DY} rx="64" ry="40" fill={`url(#do-${d})`} />
            <ellipse cx={DX[d] - 12} cy={DY - 20} rx="32" ry="9" fill="#fff" opacity=".35" />
            <text x={DX[d]} y={DY + 8} textAnchor="middle" fontSize="22" fontWeight="600" fill="#fff">{DNAME[d]}</text>
          </motion.g>
        ))}
      </svg>
      <figcaption>
        <span className="claim tradition">מסורת</span> כל דושה נוצרת משני יסודות. מים משותפים לפיטה ולקאפה. עמדו על יסוד או על דושה כדי לראות את הקשרים.
      </figcaption>
    </figure>
  );
}
