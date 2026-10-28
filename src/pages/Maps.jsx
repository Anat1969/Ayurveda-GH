import { motion } from 'framer-motion';
import {
  ConceptGraph, ElementsFlow, GunaLab, BodyMap, DoshaClock, SeasonWheel, LifeStages, AgniFlames, DhatuCascade, PrakritiMap, VikritiDemo, ClaimMeter, SafetyFlow,
  TasteWheel, DoshaBuild,
} from '../viz/index.jsx';
import { go } from '../lib/router.js';

export const MAPS = [
  { id: 'graph', k: 'מפת ידע', t: 'כל המושגים והקשרים', V: ConceptGraph },
  { id: 'elements', k: 'זרימה', t: 'מהיסודות לדושות', V: ElementsFlow },
  { id: 'build', k: 'מבנה', t: 'מבנה הגוף של הדושות', V: DoshaBuild },
  { id: 'gunas', k: 'מעבדה', t: 'הדומה מגביר את הדומה', V: GunaLab },
  { id: 'tastes', k: 'גלגל', t: 'שש הטעמים', V: TasteWheel },
  { id: 'body', k: 'מפת גוף', t: 'מושבי הדושות', V: BodyMap },
  { id: 'clock', k: 'שעון חי', t: 'הדושות לאורך היממה', V: () => <DoshaClock routine /> },
  { id: 'seasons', k: 'גלגל', t: 'העונות בישראל', V: SeasonWheel },
  { id: 'life', k: 'ציר', t: 'שלבי החיים', V: LifeStages },
  { id: 'agni', k: 'ארבעה מצבים', t: 'אש העיכול', V: AgniFlames },
  { id: 'dhatu', k: 'מפל', t: 'שבע הרקמות', V: DhatuCascade },
  { id: 'prakriti', k: 'משולש', t: 'שבעת סוגי החוקה', V: PrakritiMap },
  { id: 'vikriti', k: 'תנועה', t: 'איזון נוכחי סביב החוקה', V: VikritiDemo },
  { id: 'evidence', k: 'מד', t: 'ממסורת למחקר', V: ClaimMeter },
  { id: 'safety', k: 'שערים', t: 'מתי פונים לרופא', V: SafetyFlow },
];

// מפות: בחירה אחת בכל פעם, כך שכל המחשה מקבלת את כל המסך.
export default function Maps({ param }) {
  const m = MAPS.find((x) => x.id === param) || MAPS[0];
  return (
    <div className="screen">
      <div className="maps-layout">
        <aside className="map-side">
          <div>
            <div className="eyebrow">מפות ותרשימים · {MAPS.length}</div>
            <h1 style={{ fontSize: 'clamp(32px, 3vw, 44px)' }}>האיורוודה במבט אחד</h1>
          </div>
          <nav className="map-list" aria-label="בחירת מפה">
            {MAPS.map((x, k) => (
              <button key={x.id} aria-current={x.id === m.id ? 'true' : undefined} onClick={() => go(`/maps/${x.id}`)}>
                <span className="mono">{String(k + 1).padStart(2, '0')}</span>
                <span>{x.t}</span>
              </button>
            ))}
          </nav>
        </aside>
        <motion.section key={m.id} id={`map-${m.id}`} className="stage map-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 3 }}>{m.k}</div>
            <h2 style={{ margin: 0 }}>{m.t}</h2>
          </div>
          <m.V />
        </motion.section>
      </div>
    </div>
  );
}
