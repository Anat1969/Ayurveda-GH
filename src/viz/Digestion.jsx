import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DHATUS, AGNI_STATES, DOSHA_COLOR } from '../data/viz.js';

// שבע הרקמות: כל אחת נבנית מקודמתה. טיפות זורמות למטה לאורך השרשרת.
export function DhatuCascade() {
  const reduce = useReducedMotion();
  const tones = ['#F4C27A', '#E46A4E', '#C9502F', '#E8A33D', '#BFA889', '#5C8FB0', '#2E9E7A'];
  const W = 600;
  const step = 62;
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${DHATUS.length * step + 40}`} role="img" aria-label="שבע הרקמות, מנוזל התזונה ועד רקמת הרבייה">
        <defs>
          <linearGradient id="drop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFE0A6" />
            <stop offset="1" stopColor="#E8A33D" />
          </linearGradient>
        </defs>
        <line x1="300" y1="24" x2="300" y2={DHATUS.length * step} stroke="#E8A33D" strokeOpacity=".35" strokeWidth="6" strokeLinecap="round" />
        {DHATUS.map((d, i) => {
          const y = 34 + i * step;
          const w = 300 - i * 18;
          return (
            <motion.g key={d.sk} initial={{ opacity: 0, y: -16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, type: 'spring', damping: 14 }}>
              <rect x={300 - w / 2} y={y - 22} width={w} height="44" rx="22" fill={tones[i]} />
              <rect x={300 - w / 2 + 14} y={y - 19} width={w - 28} height="8" rx="4" fill="#fff" opacity=".22" />
              <text x="300" y={y + 6} textAnchor="middle" fontSize="16" fontWeight="600" fill="#fff">{d.t} · {d.he}</text>
              <text x={300 - w / 2 - 38} y={y + 5} textAnchor="middle" fontSize="12" className="svg-mono">{d.sk}</text>
              <text x={300 + w / 2 + 20} y={y + 5} textAnchor="middle" fontSize="12" className="svg-mono">{i + 1}</text>
            </motion.g>
          );
        })}
        {!reduce &&
          [0, 1, 2, 3].map((k) => (
            <motion.circle
              key={k} cx="300" cy="10" r="6" fill="url(#drop)" initial={{ cy: 10, opacity: 0 }}
              animate={{ cy: [10, DHATUS.length * step + 10], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 6, repeat: Infinity, delay: k * 1.5, ease: 'linear' }}
            />
          ))}
      </svg>
      <figcaption>
        <span className="claim tradition">מסורת</span> המזון הופך לנוזל תזונה, וממנו נבנות שאר הרקמות לפי הסדר. עיכול טוב בתחילת השרשרת מזין את כולה. <span className="claim assessment">הערכה</span> מודל של תזונה ובנייה, לא אטלס אנטומי.
      </figcaption>
    </figure>
  );
}

const FLAME = 'M0 -70 C 18 -48 30 -30 28 -8 C 26 14 14 26 0 26 C -14 26 -26 14 -28 -8 C -30 -30 -18 -48 0 -70 Z';
const INNER = 'M0 -38 C 9 -26 14 -16 13 -4 C 12 8 6 14 0 14 C -6 14 -12 8 -13 -4 C -14 -16 -9 -26 0 -38 Z';

const MOTION = {
  sama: { scaleY: [1, 1.05, 1], scaleX: [1, 0.98, 1], transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } },
  vishama: { scaleY: [1, 1.25, 0.8, 1.15, 0.9, 1], rotate: [0, -6, 5, -3, 4, 0], transition: { duration: 2.2, repeat: Infinity, times: [0, 0.15, 0.35, 0.6, 0.8, 1] } },
  tikshna: { scaleY: [1.35, 1.5, 1.35], scaleX: [0.9, 0.85, 0.9], transition: { duration: 0.7, repeat: Infinity } },
  manda: { scaleY: [0.62, 0.68, 0.62], opacity: [0.65, 0.8, 0.65], transition: { duration: 3.6, repeat: Infinity } },
};
const STATIC = { sama: { scaleY: 1 }, vishama: { scaleY: 1.1, rotate: -4 }, tikshna: { scaleY: 1.4, scaleX: 0.88 }, manda: { scaleY: 0.64, opacity: 0.7 } };

// ארבעה מצבים של אש העיכול, כל אחד בתנועה שמבטאת אותו.
export function AgniFlames() {
  const reduce = useReducedMotion();
  const [pick, setPick] = useState('sama');
  const cur = AGNI_STATES.find((a) => a.id === pick);
  return (
    <figure className="viz">
      <svg viewBox="0 0 600 230" role="img" aria-label="ארבעת מצבי אגני: מאוזן, לא סדיר, חד מדי ואיטי">
        <defs>
          <radialGradient id="flame" cx=".5" cy=".75" r=".8">
            <stop offset="0" stopColor="#FFF1C9" />
            <stop offset=".45" stopColor="#F5A445" />
            <stop offset="1" stopColor="#C9452B" />
          </radialGradient>
          <radialGradient id="glow">
            <stop offset="0" stopColor="#FFB45E" stopOpacity=".55" />
            <stop offset="1" stopColor="#FFB45E" stopOpacity="0" />
          </radialGradient>
        </defs>
        {AGNI_STATES.map((a, i) => {
          const x = 525 - i * 150;
          const tint = a.d ? DOSHA_COLOR[a.d] : '#E8A33D';
          const on = pick === a.id;
          return (
            <g key={a.id} transform={`translate(${x} 130)`} onClick={() => setPick(a.id)} onMouseEnter={() => setPick(a.id)} style={{ cursor: 'pointer' }} role="button" tabIndex={0} aria-label={`${a.t}: ${a.he}`} onFocus={() => setPick(a.id)}>
              <circle r="70" cy="-10" fill="url(#glow)" opacity={on ? 1 : 0.45} />
              <ellipse cy="34" rx="44" ry="8" fill={tint} opacity=".35" />
              <motion.g style={{ originY: '26px' }} animate={reduce ? STATIC[a.id] : MOTION[a.id]}>
                <path d={FLAME} fill="url(#flame)" stroke={tint} strokeWidth={on ? 3 : 1.5} strokeOpacity=".7" />
                <path d={INNER} fill="#FFF6DC" opacity=".8" />
              </motion.g>
              <text y="66" textAnchor="middle" fontSize="16" fontWeight="600" fill={on ? tint : undefined} className={on ? undefined : 'svg-ink'}>{a.t}</text>
              <text y="86" textAnchor="middle" fontSize="12.5" className="svg-muted">{a.he}</text>
            </g>
          );
        })}
      </svg>
      <figcaption>
        <span className="claim tradition">מסורת</span> <b>{cur.t} ({cur.sk})</b>: {cur.text}
        {cur.d ? ` קשור ל${{ vata: 'ואטה', pitta: 'פיטה', kapha: 'קאפה' }[cur.d]}.` : ''}
      </figcaption>
    </figure>
  );
}
