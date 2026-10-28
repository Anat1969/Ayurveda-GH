import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PRAKRITI_QUESTIONS, PRAKRITI_INTRO } from '../data/prakriti.js';
import { PRAKRITI_TEXT } from '../data/recommendations.js';
import { scorePrakriti, prakritiDrift, CONFIDENCE_TEXT, DRIFT_TEXT } from '../lib/scoring.js';
import { latestResult, loadResults, saveResult } from '../lib/storage.js';
import { Ternary, PrakritiMap } from '../viz/index.jsx';
import { DoshaBars, doshaList, Claim } from '../components/Shell.jsx';

export function PrakritiMethod() {
  return (
    <div className="method">
      <h3>על מה השאלון נשען, ואיך הוא מודד את עצמו</h3>
      <p className="small">
        <Claim type="tradition" /> התכונות לקוחות מתיאורי החוקה בצ׳ראקה סמהיטה (Charaka Samhita), ויממנה סתהאנה 8: מבנה
        הגוף, העור, השיער, התיאבון, השינה, הדיבור והמזג.{' '}
        <Claim type="assessment" /> השאלון <mark className="hl">לא עבר תיקוף מחקרי</mark>. במסורת, חוקה נקבעת בבדיקה של מטפל.
        בהודו יש כלים בתיקוף ראשוני, למשל של CCRAS.
      </p>
      <ul className="list-plain small">
        <li><b>כיסוי:</b> כמה שאלות נענו. מתחת ל-60 אחוז, התוצאה חלשה.</li>
        <li><b>הבחנה:</b> הפער בין הדושה המובילה לבאה אחריה.</li>
        <li><b>יציבות:</b> מילוי חוזר שנותן תוצאה אחרת מוריד את האמינות.</li>
      </ul>
    </div>
  );
}

export function PrakritiResult({ result, previous, history = [], children }) {
  const drift = previous ? prakritiDrift(result.pct, previous.pct) : null;
  return (
    <div className="split even">
      <div className="stage">
        <Ternary
          points={[{ pct: result.pct, color: 'var(--ink)', label: 'החוקה שלי', pulse: true }]}
          trail={history.map((h) => h.pct)}
          label="החוקה שלי במשולש הדושות"
        />
        <p className="caption">
          {history.length > 1 ? 'הנקודות האפורות הן מילויים קודמים. ככל שהן קרובות, התוצאה יציבה יותר.' : 'המיקום במשולש הוא היחס בין שלוש הדושות.'}
        </p>
      </div>
      <div className="text-col">
        <div className="eyebrow">שאלון חוקה · הדפוס שעלה</div>
        <h1 style={{ fontSize: 'clamp(34px, 3.8vw, 56px)' }}>
          {result.type.length === 3 ? 'שלוש הדושות קרובות' : `חוקה של ${doshaList(result.type)}`}
        </h1>
        <p className="muted" style={{ margin: 0 }}>{result.type.map((d) => PRAKRITI_TEXT[d]).join(' ')}</p>
        <DoshaBars pct={result.pct} />
        <div className="meta inline">
          <div><small>כיסוי</small>{result.answered} מתוך {result.total} שאלות</div>
          <div><small>הבחנה</small>{CONFIDENCE_TEXT[result.confidence]}</div>
          <div><small>יציבות</small>{drift ? DRIFT_TEXT[drift.level] : 'אחרי מילוי שני'}</div>
        </div>
        <p className="small muted" style={{ margin: 0 }}>זהו <mark className="hl">תיאור של דפוס, לא אבחנה</mark>. החוקה מתארת נטיות, ואינה אומרת דבר על מחלה.</p>
        {children}
      </div>
    </div>
  );
}

export default function Prakriti() {
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(-1);
  const [saved, setSaved] = useState(null);
  const previous = useMemo(() => latestResult('prakriti'), []);
  const total = PRAKRITI_QUESTIONS.length;
  const q = PRAKRITI_QUESTIONS[step];

  const finish = (final) => {
    const r = scorePrakriti(final, PRAKRITI_QUESTIONS);
    const entry = saveResult('prakriti', {
      pct: r.pct, type: r.type, confidence: r.confidence, answered: r.answered, total: r.total,
    });
    setSaved({ result: r, ok: Boolean(entry) });
    setStep(total);
  };

  const choose = (d) => {
    const next = { ...answers, [q.id]: d };
    setAnswers(next);
    if (step + 1 >= total) finish(next);
    else setTimeout(() => setStep(step + 1), 180);
  };

  const skip = () => {
    const next = { ...answers };
    delete next[q.id];
    setAnswers(next);
    if (step + 1 >= total) finish(next);
    else setStep(step + 1);
  };

  if (step === -1) {
    return (
      <div className="screen">
        <div className="split">
          <div className="text-col">
            <div className="eyebrow">שאלון חוקה · Prakriti</div>
            <h1>החוקה שלי</h1>
            <p className="lead">{PRAKRITI_INTRO}</p>
            <div className="row">
              <button className="btn warm" onClick={() => setStep(0)}>להתחיל, {total} שאלות</button>
              <a className="btn ghost" href="#/library/prakriti">מה זו חוקה</a>
            </div>
            <PrakritiMethod />
          </div>
          <div className="stage"><PrakritiMap /></div>
        </div>
      </div>
    );
  }

  if (step >= total && saved) {
    return (
      <div className="screen">
        <PrakritiResult result={saved.result} previous={previous} history={[...loadResults('prakriti')].reverse()}>
          <p className="caption">{saved.ok ? 'התוצאה נשמרה במכשיר הזה בלבד.' : 'לא הצלחתי לשמור את התוצאה במכשיר. היא תוצג רק עכשיו.'}</p>
          <div className="row">
            <a className="btn warm" href="#/vikriti">להמשיך לאיזון הנוכחי</a>
            <button className="btn ghost" onClick={() => { setAnswers({}); setSaved(null); setStep(0); }}>למלא שוב</button>
            <a className="btn ghost" href="#/results">כל התוצאות</a>
          </div>
        </PrakritiResult>
      </div>
    );
  }

  const live = scorePrakriti(answers, PRAKRITI_QUESTIONS);
  return (
    <div className="screen">
    <div className="quiz-layout">
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="mono small">{step + 1} / {total}</span>
        <span className="eyebrow" style={{ margin: 0 }}>{q.area}</span>
      </div>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={step}>
        <i style={{ width: `${(step / total) * 100}%` }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.22 }}
        >
          <h2>{q.q}</h2>
          <div className="options">
            {q.options.map((o) => (
              <button key={o.d} className="option" aria-pressed={answers[q.id] === o.d} onClick={() => choose(o.d)}>
                {o.t}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button className="btn ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>הקודמת</button>
        <button className="btn ghost" onClick={skip}>לא מתאים לי, לדלג</button>
      </div>
    </div>
    <aside className="stage live-panel" aria-label="התוצאה מתעדכנת">
      <div className="eyebrow" style={{ margin: 0 }}>בזמן אמת</div>
      <Ternary points={[{ pct: live.pct, color: 'var(--ink)', label: live.answered ? 'הנקודה שלי' : 'עוד לא ענית', pulse: true }]} label="הנקודה שלי במשולש" />
      <p className="caption">כל תשובה מזיזה את הנקודה לעבר דושה אחת. אחרי {live.answered} תשובות.</p>
    </aside>
    </div>
    </div>
  );
}
