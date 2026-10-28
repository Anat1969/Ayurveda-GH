import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BUILD, TASTES, DOSHA_COLOR } from '../data/viz.js';
import { BodyFigure, DoshaGlyph, ElementGlyph, EL } from './Glyphs.jsx';
import { Claim } from '../components/Shell.jsx';

const ORDER = ['vata', 'pitta', 'kapha'];
const DNAME = { vata: 'ואטה', pitta: 'פיטה', kapha: 'קאפה' };

// מבנה הגוף של שלוש הדושות: אותו גוף, בפרופורציות של כל חוקה.
// ואטה: היסודות זזים (תנועה). פיטה: האש נושמת (חום). קאפה: הכול עומד (יציבות).
export function DoshaBuild({ initial }) {
  const [sel, setSel] = useState(initial || 'pitta');
  const X = { vata: 470, pitta: 300, kapha: 128 };
  const b = BUILD[sel];
  return (
    <figure className="viz build">
      <svg viewBox="0 0 600 400" role="img" aria-label="מבנה הגוף של ואטה, פיטה וקאפה">
        <line x1="20" y1="352" x2="580" y2="352" className="stroke-hair" />
        {ORDER.map((d) => (
          <g key={d} role="button" tabIndex={0} aria-label={`${DNAME[d]}: ${BUILD[d].frame}`} aria-pressed={sel === d}
            onClick={() => setSel(d)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(d)} style={{ cursor: 'pointer' }}>
            <rect x={X[d] - 80} y="20" width="160" height="370" fill="transparent" />
            <BodyFigure d={d} cx={X[d]} gy={350} H={290} active={sel === d} />
            <text x={X[d]} y="384" textAnchor="middle" fontSize="22" className="svg-display" fill={DOSHA_COLOR[d]}>{DNAME[d]}</text>
          </g>
        ))}
      </svg>
      <div className="legend-block">
        <div className="seg" role="group" aria-label="בחירת דושה">
          {ORDER.map((d) => (
            <button key={d} className={`seg-btn d-${d}`} aria-pressed={sel === d} onClick={() => setSel(d)}>{DNAME[d]}</button>
          ))}
        </div>
        <p className="legend-title"><b className={`dosha-name d-${sel}`}>{b.name}</b>: <mark className="hl">{b.frame}</mark></p>
        <ul className="legend-list">
          {b.traits.map((t) => <li key={t}>{t}</li>)}
          <li className="muted">בתוך הגו: {EL[b.el[0]].name} ו{EL[b.el[1]].name}</li>
        </ul>
        <p className="caption"><Claim type="tradition" /> צ׳ראקה סמהיטה, ויממנה סתהאנה 8 (פסוקים 96 עד 98). אף אחד אינו "טהור": רוב האנשים הם צירוף של שתי דושות.</p>
      </div>
    </figure>
  );
}

// שש הטעמים: כל טעם הוא זוג יסודות. בחירה בטעם מראה אילו דושות הוא מגביר ואילו הוא מאזן.
export function TasteWheel() {
  const reduce = useReducedMotion();
  const [sel, setSel] = useState('madhura');
  const t = TASTES.find((x) => x.id === sel);
  const C = [300, 206];
  const pos = (i) => {
    const a = (-90 + i * 60) * (Math.PI / 180);
    return [C[0] + Math.cos(a) * 232, C[1] + Math.sin(a) * 166];
  };
  const DP = { vata: [384, 206], pitta: [300, 206], kapha: [212, 206] };
  const si = TASTES.indexOf(t);
  const sp = pos(si);
  return (
    <figure className="viz tastes">
      <svg viewBox="0 0 600 440" role="img" aria-label="שש הטעמים, היסודות שלהם והשפעתם על הדושות">
        <ellipse cx={C[0]} cy={C[1]} rx="232" ry="166" fill="none" className="stroke-hair" />
        {ORDER.map((d) => (
          <line key={d} x1={sp[0]} y1={sp[1]} x2={DP[d][0]} y2={DP[d][1]} stroke={DOSHA_COLOR[d]} strokeWidth="1.4"
            strokeDasharray={t.eff[d] > 0 ? '3 5' : undefined} opacity=".8" />
        ))}
        {ORDER.map((d) => (
          <motion.g key={d} initial={false} animate={{ scale: reduce ? 1 : t.eff[d] > 0 ? 1.22 : 0.82 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} style={{ transformOrigin: `${DP[d][0]}px ${DP[d][1]}px`, transformBox: 'view-box' }}>
            <DoshaGlyph d={d} x={DP[d][0]} y={DP[d][1]} s={1.55} />
          </motion.g>
        ))}
        {ORDER.map((d) => (
          <text key={d} x={DP[d][0]} y={DP[d][1] + 62} textAnchor="middle" fontSize="15" fill={DOSHA_COLOR[d]}>{DNAME[d]}</text>
        ))}
        {TASTES.map((x, i) => {
          const [px, py] = pos(i);
          const on = x.id === sel;
          return (
            <g key={x.id} role="button" tabIndex={0} aria-pressed={on} aria-label={`${x.name}: ${EL[x.el[0]].name} ו${EL[x.el[1]].name}`}
              onClick={() => setSel(x.id)} onMouseEnter={() => setSel(x.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(x.id)}
              style={{ cursor: 'pointer' }} opacity={on ? 1 : 0.62}>
              <circle cx={px} cy={py} r="38" fill="transparent" />
              {on && <ellipse cx={px} cy={py - 2} rx="38" ry="25" fill="var(--ember)" fillOpacity=".08" className="stroke-brass" strokeWidth="1" />}
              <ElementGlyph id={x.el[0]} x={px + 12} y={py - 2} r={14} still={!on} />
              <ElementGlyph id={x.el[1]} x={px - 12} y={py - 2} r={14} still={!on} />
              <text x={px} y={py + 41} textAnchor="middle" fontSize="16" className="svg-ink" fontWeight={on ? 600 : 400}>{x.name}</text>
            </g>
          );
        })}
      </svg>
      <div className="legend-block">
        <p className="legend-title"><b>{t.name}</b> <span className="mono muted small">{t.sk}</span>: {EL[t.el[0]].name} ו{EL[t.el[1]].name}</p>
        <ul className="legend-list">
          <li>מאזן: <mark className="hl">{ORDER.filter((d) => t.eff[d] < 0).map((d) => DNAME[d]).join(' ו')}</mark> <span className="muted small">(קו רציף, הדושה קטנה)</span></li>
          <li>מגביר: <b>{ORDER.filter((d) => t.eff[d] > 0).map((d) => DNAME[d]).join(' ו')}</b> <span className="muted small">(קו מקווקו, הדושה גדלה)</span></li>
          <li className="muted">למשל: {t.ex}</li>
        </ul>
        <p className="caption"><Claim type="tradition" /> צ׳ראקה סמהיטה, סוטרה סתהאנה 1 ו-26. <Claim type="none" /> ההשפעה על הדושות לא נבדקה במחקר.</p>
      </div>
    </figure>
  );
}
