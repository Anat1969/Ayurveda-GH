import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { VIKRITI_ITEMS, VIKRITI_INTRO, SCALE, WARNING_SIGNS } from '../data/vikriti.js';
import { RECOMMENDATIONS, DOSHA } from '../data/recommendations.js';
import { scoreVikriti } from '../lib/scoring.js';
import { latestResult, saveResult } from '../lib/storage.js';
import { DoshaBars, doshaList, Claim, Rich, Tabs } from '../components/Shell.jsx';
import { DoshaMark } from '../viz/Glyphs.jsx';
import { Ternary, VikritiDemo } from '../viz/index.jsx';

export function DoctorAlert() {
  return (
    <div className="alert" role="alert">
      <p style={{ marginTop: 0 }}>
        <strong>סימן שמחייב רופא מיד.</strong> מה שסימנת אינו נושא לשאלון איורוודה. פנו היום לרופא או למוקד רפואי.
      </p>
      <p style={{ marginBottom: 0 }}>
        במצב חירום: מד"א <b>101</b> או <b>112</b>. במצוקה נפשית: ער"ן <b>1201</b>.
      </p>
    </div>
  );
}

export function Recommendations({ dosha }) {
  return (
    <div className={`recs d-${dosha}`}>
      <div className="eyebrow" style={{ margin: 0 }}>המלצות לאורח חיים</div>
      <h2 style={{ fontSize: 'clamp(26px, 2.6vw, 38px)', margin: '3px 0 8px' }}>
        <DoshaMark d={dosha} size={30} /> לאיזון <span className="dosha-name">{DOSHA[dosha].name}</span>
      </h2>
      <Tabs
        label="תחומי ההמלצות"
        tabs={RECOMMENDATIONS[dosha].map((r) => ({
          id: r.area,
          label: r.area,
          content: (
            <div className="rec">
              <Claim type={r.claim} />
              <p><Rich text={r.text} /></p>
              <p className="muted small">הרציונל המסורתי: {r.why}{r.note ? ` ${r.note}` : ''}</p>
            </div>
          ),
        }))}
      />
      <p className="caption" style={{ marginTop: 8 }}>
        תזונה, שגרה, שינה ופעילות בלבד. <mark className="hl">אין כאן צמחים, תוספים או מינונים</mark>. בהריון, בהנקה, במחלה כרונית או עם תרופות, התייעצו עם הרופא לפני שינוי משמעותי.
      </p>
    </div>
  );
}

export function VikritiMethod() {
  return (
    <div className="method">
      <h3>על מה השאלון נשען, ואיך הוא מודד את עצמו</h3>
      <p className="small">
        <Claim type="tradition" /> הפריטים לקוחים מתיאורי הסימנים של עלייה בכל דושה, למשל באשטאנגה הרידאיה (Ashtanga Hridaya),
        סוטרה סתהאנה 11. חמישה פריטים לכל דושה, בדירוג של 0 עד 3. <Claim type="assessment" /> השאלון לא עבר תיקוף מחקרי.
      </p>
      <ul className="list-plain small">
        <li><b>כיסוי מלא:</b> אין תוצאה בלי כל 15 הפריטים.</li>
        <li><b>סף מוצהר:</b> עלייה מעל 40 אחוז מהעוצמה האפשרית. סף של האפליקציה, לא של המסורת.</li>
        <li><b>מגמה:</b> מדידה אחת היא תמונת מצב. מילוי חוזר מראה אם הדפוס עקבי.</li>
      </ul>
    </div>
  );
}

export function VikritiResult({ result, prakriti, children }) {
  const focus = result.calm ? prakriti?.type?.[0] || null : result.elevated[0] || result.top;
  const matchesPrakriti = prakriti && !result.calm && prakriti.type.includes(result.elevated[0] || result.top);
  return (
    <div className="split even">
      <div className="text-col">
        <div className="eyebrow" style={{ margin: 0 }}>האיזון שלי עכשיו · השבועיים האחרונים</div>
        <h2 style={{ fontSize: 'clamp(30px, 3.2vw, 46px)' }}>
          {result.calm
            ? 'לא עלה דפוס בולט של עודף'
            : `סימנים של עלייה ב${doshaList(result.elevated.length ? result.elevated : [result.top])}`}
        </h2>
        <DoshaBars pct={result.pct} />
        <p className="caption">האחוז הוא עוצמת הסימנים מתוך המקסימום האפשרי. מעל 40 אחוז נחשב כאן לעלייה, סף של האפליקציה ולא של המסורת.</p>
        <div className="stage mini">
          <Ternary
            points={[
              ...(prakriti ? [{ pct: prakriti.pct, color: 'var(--ink)', label: 'חוקה', r: 9 }] : []),
              { pct: result.pct, color: 'var(--ember)', label: 'עכשיו', pulse: true, below: true },
            ]}
            arrow={prakriti && !result.calm ? [prakriti.pct, result.pct] : null}
            label="האיזון הנוכחי ביחס לחוקה"
          />
        </div>
        <p className="caption">
          {prakriti
            ? matchesPrakriti
              ? 'החץ יוצא מהחוקה. הדושה שעלתה בולטת גם בחוקה שלך: לפי המסורת, מה שחזק אצלנו יוצא ראשון מאיזון.'
              : 'החץ יוצא מהחוקה. הדושה שעלתה אינה הבולטת בחוקה שלך: לפי המסורת זה קורה בעונה, בלחץ או בשינוי שגרה.'
            : 'מלאו את שאלון החוקה כדי לראות חץ מהחוקה אל המצב הנוכחי.'}
        </p>
      </div>
      <div className="text-col">
        {focus ? <Recommendations dosha={focus} /> : (
          <p>כדי לקבל המלצות כשהאיזון שקט, מלאו קודם את <a href="#/prakriti">שאלון החוקה</a>.</p>
        )}
        <p className="small muted" style={{ margin: 0 }}>זהו תיאור של דפוס לפי המסורת, לא אבחנה. אם תסמין נמשך או מחמיר, <mark className="hl">פנו לרופא</mark>.</p>
        {children}
      </div>
    </div>
  );
}

// סדר מעורב, כך שכל עמוד מכיל פריטים משלוש הדושות ולא חושף את המיון
const MIXED = [0, 5, 10, 1, 6, 11, 2, 7, 12, 3, 8, 13, 4, 9, 14].map((k) => VIKRITI_ITEMS[k]);
const PER = 5;

export default function Vikriti() {
  const [stage, setStage] = useState('screen');
  const [warnings, setWarnings] = useState([]);
  const [ratings, setRatings] = useState({});
  const [saved, setSaved] = useState(null);
  const [page, setPage] = useState(0);
  const prakriti = useMemo(() => latestResult('prakriti'), []);
  const answered = Object.keys(ratings).length;

  const toggleWarning = (w) =>
    setWarnings((list) => (list.includes(w) ? list.filter((x) => x !== w) : [...list, w]));

  const submit = () => {
    const r = scoreVikriti(ratings, VIKRITI_ITEMS);
    const entry = saveResult('vikriti', { pct: r.pct, elevated: r.elevated, calm: r.calm, top: r.top });
    setSaved({ result: r, ok: Boolean(entry) });
    setStage('result');
  };

  if (stage === 'screen') {
    return (
      <div className="screen">
      <div className="split">
      <div className="text-col">
        <div>
          <div className="eyebrow">שאלון איזון נוכחי · Vikriti</div>
          <h1>האיזון הנוכחי</h1>
          <p className="lead">{VIKRITI_INTRO}</p>
        </div>
        <div>
          <h3 style={{ margin: '0 0 3px' }}>לפני שמתחילים: האם יש לך עכשיו אחד מאלה?</h3>
          <div className="checks">
            {WARNING_SIGNS.map((w) => (
              <label key={w} className="check">
                <input type="checkbox" checked={warnings.includes(w)} onChange={() => toggleWarning(w)} />
                <span>{w}</span>
              </label>
            ))}
          </div>
        </div>
        {warnings.length > 0 && <DoctorAlert />}
        <div className="row">
          {warnings.length === 0 ? (
            <button className="btn warm" onClick={() => setStage('items')}>אין לי אף אחד מאלה, להמשיך</button>
          ) : (
            <button className="btn ghost" onClick={() => setStage('items')}>הבנתי, ואפנה לרופא. להמשיך לשאלון</button>
          )}
        </div>
      </div>
      <div className="stage">
        <Tabs label="על השאלון" tabs={[
          { id: 'demo', label: 'איך האיזון זז', content: <VikritiDemo /> },
          { id: 'method', label: 'על מה השאלון נשען', content: <VikritiMethod /> },
        ]} />
      </div>
      </div>
      </div>
    );
  }

  if (stage === 'result' && saved) {
    return (
      <div className="screen">
        <h1 className="sr-only">האיזון שלי עכשיו</h1>
        {warnings.length > 0 && <DoctorAlert />}
        <VikritiResult result={saved.result} prakriti={prakriti}>
          <p className="caption">{saved.ok ? 'התוצאה נשמרה במכשיר הזה בלבד.' : 'לא הצלחתי לשמור את התוצאה במכשיר.'}</p>
          <div className="row">
            <a className="btn" href="#/consultant">לשאול את היועצת</a>
            <a className="btn ghost" href="#/results">כל התוצאות</a>
          </div>
        </VikritiResult>
      </div>
    );
  }

  const pages = Math.ceil(MIXED.length / PER);
  const slice = MIXED.slice(page * PER, page * PER + PER);
  const pageDone = slice.every((it) => ratings[it.id] !== undefined);
  return (
    <div className="screen">
    <div className="stack" style={{ maxWidth: 980, width: '100%', margin: '0 auto' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <div className="eyebrow">שאלון איזון נוכחי · השבועיים האחרונים · עמוד {page + 1} מתוך {pages}</div>
          <h1 style={{ fontSize: 'clamp(32px, 3.6vw, 52px)', margin: 0 }}>כמה זה נכון לגביך עכשיו?</h1>
        </div>
        <span className="mono small">{answered} / {VIKRITI_ITEMS.length}</span>
      </div>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={VIKRITI_ITEMS.length} aria-valuenow={answered}>
        <i style={{ width: `${(answered / VIKRITI_ITEMS.length) * 100}%` }} />
      </div>
      <motion.div key={page} className="items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        {slice.map((it) => (
          <div key={it.id} className="item" data-d={it.d}>
            <div id={`l-${it.id}`}>{it.t}</div>
            <div className="scale" role="group" aria-labelledby={`l-${it.id}`}>
              {SCALE.map((sc, v) => (
                <button key={sc} aria-pressed={ratings[it.id] === v} onClick={() => setRatings({ ...ratings, [it.id]: v })}>
                  {sc}
                </button>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button className="btn ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>העמוד הקודם</button>
        {page < pages - 1 ? (
          <button className="btn warm" disabled={!pageDone} onClick={() => setPage(page + 1)}>
            {pageDone ? 'לעמוד הבא' : 'עוד לענות בעמוד הזה'}
          </button>
        ) : (
          <button className="btn warm" disabled={answered < VIKRITI_ITEMS.length} onClick={submit}>
            {answered < VIKRITI_ITEMS.length ? `נותרו ${VIKRITI_ITEMS.length - answered} שאלות` : 'לראות את התוצאה'}
          </button>
        )}
      </div>
    </div>
    </div>
  );
}
