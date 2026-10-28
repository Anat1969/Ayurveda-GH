import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import ElementsFlow from './ElementsFlow.jsx';
import DoshaClock from './DoshaClock.jsx';
import { SeasonWheel, LifeStages } from './Cycles.jsx';
import BodyMap from './BodyMap.jsx';
import { DhatuCascade, AgniFlames } from './Digestion.jsx';
import Ternary from './Ternary.jsx';
import GunaLab from './GunaLab.jsx';
import ConceptGraph from './ConceptGraph.jsx';
import { ClaimMeter, SafetyFlow } from './Evidence.jsx';
import { TasteWheel, DoshaBuild } from './Structure.jsx';

export { TasteWheel, DoshaBuild, ElementsFlow, DoshaClock, SeasonWheel, LifeStages, BodyMap, DhatuCascade, AgniFlames, Ternary, GunaLab, ConceptGraph, ClaimMeter, SafetyFlow };

// מפת שבעת סוגי החוקה
export function PrakritiMap() {
  return (
    <figure className="viz">
      <Ternary regions label="מפת שבעת סוגי החוקה" />
      <figcaption>
        <span className="claim tradition">מסורת</span> שבעה סוגי חוקה: שלושה של דושה אחת, שלושה של שתיים, ואחד של שלוש באיזון. כל נקודה במשולש היא יחס בין שלוש הדושות.
      </figcaption>
    </figure>
  );
}

// הדגמה: האיזון הנוכחי זז מהחוקה וחוזר אליה
const BASE = { vata: 25, pitta: 50, kapha: 25 };
const DRIFT = [
  { vata: 25, pitta: 50, kapha: 25 },
  { vata: 22, pitta: 66, kapha: 12 },
  { vata: 48, pitta: 38, kapha: 14 },
  { vata: 25, pitta: 50, kapha: 25 },
];
export function VikritiDemo() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(1);
  useEffect(() => {
    if (reduce) return undefined;
    const t = setInterval(() => setI((v) => (v + 1) % DRIFT.length), 2200);
    return () => clearInterval(t);
  }, [reduce]);
  const states = ['באיזון: קרוב לחוקה', 'קיץ ולחץ: פיטה עולה', 'חורף ונסיעות: ואטה עולה', 'שגרה מאזנת: חזרה לחוקה'];
  return (
    <figure className="viz">
      <Ternary
        points={[
          { pct: BASE, color: 'var(--ink)', label: 'חוקה', r: 9 },
          { pct: DRIFT[i], color: 'var(--ember)', label: 'איזון נוכחי', pulse: true, below: true },
        ]}
        label="האיזון הנוכחי זז סביב החוקה"
      />
      <figcaption>
        <motion.b key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{states[i]}</motion.b>{' '}
        <span className="claim tradition">מסורת</span> החוקה קבועה. האיזון הנוכחי זז סביבה לפי עונה, גיל ושגרה, והמטרה היא להחזיר אותו קרוב אליה.
      </figcaption>
    </figure>
  );
}

const BY_CONCEPT = {
  mahabhuta: [ElementsFlow],
  rasa: [TasteWheel],
  subdoshas: [BodyMap],
  ojas: [DhatuCascade],
  srotas: [BodyMap],
  trayopastambha: [() => <DoshaClock routine />],
  products: [ClaimMeter],
  gunas: [GunaLab],
  dosha: [DoshaBuild, ElementsFlow, BodyMap],
  vata: [DoshaBuild, BodyMap, DoshaClock],
  pitta: [DoshaBuild, BodyMap, DoshaClock],
  kapha: [DoshaBuild, BodyMap, DoshaClock],
  prakriti: [PrakritiMap],
  vikriti: [VikritiDemo],
  agni: [AgniFlames],
  ama: [AgniFlames],
  dhatu: [DhatuCascade],
  mala: [DhatuCascade],
  dinacharya: [() => <DoshaClock routine />],
  ritucharya: [SeasonWheel],
  'life-stages': [LifeStages],
  sources: [ClaimMeter],
  article: [ClaimMeter],
};

const VIZ_NAME = new Map([[DoshaBuild, 'מבנה גוף'], [BodyMap, 'מפת גוף'], [DoshaClock, 'שעון'], [ElementsFlow, 'יסודות']]);

export function ConceptViz({ id, dosha }) {
  const list = BY_CONCEPT[id] || [];
  const [k, setK] = useState(0);
  if (!list.length) return null;
  const V = list[Math.min(k, list.length - 1)];
  const el = V === BodyMap ? <BodyMap highlight={dosha} /> : V === DoshaBuild ? <DoshaBuild initial={dosha} /> : <V />;
  return (
    <>
      {list.length > 1 && (
        <div className="tabs" role="tablist" aria-label="המחשות">
          {list.map((x, n) => (
            <button key={n} role="tab" aria-selected={n === k} onClick={() => setK(n)}>{VIZ_NAME.get(x) || `המחשה ${n + 1}`}</button>
          ))}
        </div>
      )}
      <div key={k} className="concept-viz-one">{el}</div>
    </>
  );
}

// כותרת להמחשה במרכז המפות
export function VizCard({ title, kicker, children, id }) {
  return (
    <motion.section
      id={id} className="stone viz-stone" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5 }}
    >
      <div className="eyebrow">{kicker}</div>
      <h2>{title}</h2>
      {children}
    </motion.section>
  );
}
