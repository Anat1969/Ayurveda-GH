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
    <div className="stone">
      <h3>על מה השאלון נשען, ואיך הוא מודד את עצמו</h3>
      <p className="claim-line"><Claim type="tradition" /></p>
      <p>
        התכונות לקוחות מתיאורי סוגי החוקה בצ׳ראקה סמהיטה (Charaka Samhita), ויממנה סתהאנה פרק 8: מבנה הגוף, העור,
        השיער, התיאבון, השינה, הדיבור והמזג.
      </p>
      <p className="claim-line"><Claim type="assessment" /></p>
      <p>
        השאלון לא עבר תיקוף מחקרי. בהודו קיימים כלים שעברו תיקוף ראשוני, למשל מטעם המועצה המרכזית למחקר במדעי האיורוודה
        (Central Council for Research in Ayurvedic Sciences, CCRAS). במסורת, קביעת חוקה נעשית בבדיקה של מטפל ולא בשאלון
        עצמי.
      </p>
      <p style={{ marginBottom: 6 }}>שלושה מדדים מראים עד כמה אפשר לסמוך על התוצאה:</p>
      <ul className="list-plain">
        <li><b>כיסוי:</b> כמה שאלות נענו. פחות מ-60 אחוז, והתוצאה חלשה.</li>
        <li><b>הבחנה:</b> הפער בין הדושה המובילה לבאה אחריה. פער קטן פירושו דפוס מעורב.</li>
        <li><b>יציבות:</b> החוקה לא אמורה להשתנות. אם מילוי חוזר נותן תוצאה אחרת, התוצאה פחות אמינה.</li>
      </ul>
    </div>
  );
}

export function PrakritiResult({ result, previous, history = [] }) {
  const drift = previous ? prakritiDrift(result.pct, previous.pct) : null;
  return (
    <div className="stack">
      <div className="grid two">
        <div className="stone viz-stone">
          <Ternary
            points={[{ pct: result.pct, color: 'var(--ink)', label: 'החוקה שלי', pulse: true }]}
            trail={history.map((h) => h.pct)}
            label="החוקה שלי במשולש הדושות"
          />
          <p className="small muted" style={{ margin: 0 }}>
            {history.length > 1 ? 'הנקודות האפורות הן מילויים קודמים. ככל שהן קרובות, התוצאה יציבה יותר.' : 'המיקום במשולש הוא היחס בין שלוש הדושות.'}
          </p>
        </div>
      <div className="stone">
        <div className="eyebrow">הדפוס שעלה</div>
        <h2>
          {result.type.length === 3 ? 'שלוש הדושות קרובות זו לזו' : `חוקה של ${doshaList(result.type)}`}
        </h2>
        <p className="muted">{result.type.map((d) => PRAKRITI_TEXT[d]).join(' ')}</p>
        <DoshaBars pct={result.pct} />
      </div>
      </div>
      <div className="meta">
        <div>
          <small>כיסוי</small>
          {result.answered} מתוך {result.total} שאלות
        </div>
        <div>
          <small>הבחנה</small>
          {CONFIDENCE_TEXT[result.confidence]}
        </div>
        <div>
          <small>יציבות</small>
          {drift ? DRIFT_TEXT[drift.level] : 'תופיע אחרי מילוי שני'}
        </div>
      </div>
      <div className="note">
        זהו תיאור של דפוס לפי המסורת, לא אבחנה. החוקה מתארת נטיות, ואינה אומרת דבר על מחלה.
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
      <div className="stack">
        <div>
          <div className="eyebrow">שאלון חוקה · Prakriti</div>
          <h1>החוקה שלי</h1>
          <p className="lead">{PRAKRITI_INTRO}</p>
          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn warm" onClick={() => setStep(0)}>להתחיל, {total} שאלות</button>
            <a className="btn ghost" href="#/library/prakriti">מה זו חוקה</a>
          </div>
        </div>
        <div className="grid two">
          <div className="stone viz-stone"><PrakritiMap /></div>
          <PrakritiMethod />
        </div>
      </div>
    );
  }

  if (step >= total && saved) {
    return (
      <div className="stack">
        <div className="eyebrow">שאלון חוקה · תוצאה</div>
        <h1>הדפוס שלי</h1>
        <PrakritiResult result={saved.result} previous={previous} history={[...loadResults('prakriti')].reverse()} />
        <p className="small muted">{saved.ok ? 'התוצאה נשמרה במכשיר הזה בלבד.' : 'לא הצלחתי לשמור את התוצאה במכשיר. היא תוצג רק עכשיו.'}</p>
        <div className="row">
          <a className="btn warm" href="#/vikriti">להמשיך לאיזון הנוכחי</a>
          <button className="btn ghost" onClick={() => { setAnswers({}); setSaved(null); setStep(0); }}>למלא שוב</button>
          <a className="btn ghost" href="#/results">כל התוצאות</a>
        </div>
      </div>
    );
  }

  const live = scorePrakriti(answers, PRAKRITI_QUESTIONS);
  return (
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
    <aside className="stone viz-stone live-panel" aria-label="התוצאה מתעדכנת">
      <div className="eyebrow">בזמן אמת</div>
      <Ternary points={[{ pct: live.pct, color: 'var(--ink)', label: live.answered ? 'הנקודה שלי' : 'עוד לא ענית', pulse: true }]} label="הנקודה שלי במשולש" />
      <p className="small muted" style={{ margin: 0 }}>כל תשובה מזיזה את הנקודה לעבר דושה אחת. אחרי {live.answered} תשובות.</p>
    </aside>
    </div>
  );
}
