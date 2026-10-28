import {
  VizCard, ConceptGraph, ElementsFlow, GunaLab, BodyMap, DoshaClock, SeasonWheel, LifeStages, AgniFlames, DhatuCascade, PrakritiMap, VikritiDemo, ClaimMeter, SafetyFlow,
} from '../viz/index.jsx';

const MAPS = [
  { id: 'graph', k: 'מפת ידע', t: 'כל המושגים והקשרים', V: ConceptGraph },
  { id: 'elements', k: 'זרימה', t: 'מהיסודות לדושות', V: ElementsFlow },
  { id: 'gunas', k: 'מעבדה', t: 'הדומה מגביר את הדומה', V: GunaLab },
  { id: 'body', k: 'מפת גוף', t: 'מושבי הדושות', V: BodyMap },
  { id: 'clock', k: 'שעון חי', t: 'הדושות לאורך היממה', V: () => <DoshaClock routine /> },
  { id: 'seasons', k: 'גלגל', t: 'העונות בישראל', V: SeasonWheel },
  { id: 'life', k: 'ציר', t: 'שלבי החיים', V: LifeStages },
  { id: 'agni', k: 'ארבעה מצבים', t: 'אש העיכול', V: AgniFlames },
  { id: 'dhatu', k: 'מפל', t: 'שבע הרקמות', V: DhatuCascade },
  { id: 'prakriti', k: 'משולש', t: 'שבעת סוגי החוקה', V: PrakritiMap },
  { id: 'vikriti', k: 'תנועה', t: 'איזון נוכחי סביב החוקה', V: VikritiDemo },
  { id: 'evidence', k: 'מד', t: 'ממסורת למחקר', V: ClaimMeter },
  { id: 'safety', k: 'תרשים זרימה', t: 'מתי פונים לרופא', V: SafetyFlow },
];

export default function Maps() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">מפות ותרשימים</div>
        <h1>האיורוודה במבט אחד</h1>
        <p className="lead">שלוש עשרה המחשות. כל אחת מסבירה רעיון אחד, ורובן מגיבות למגע.</p>
      </div>
      <nav className="chips" aria-label="קפיצה למפה">
        {MAPS.map((m) => (
          <a key={m.id} className="chip" href="#/maps" onClick={(e) => { e.preventDefault(); document.getElementById(`map-${m.id}`)?.scrollIntoView({ behavior: 'smooth' }); }}>{m.t}</a>
        ))}
      </nav>
      <div className="maps-grid">
        {MAPS.map((m) => (
          <VizCard key={m.id} id={`map-${m.id}`} kicker={m.k} title={m.t}>
            <m.V />
          </VizCard>
        ))}
      </div>
    </div>
  );
}
