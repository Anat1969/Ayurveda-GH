import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { VIKRITI_ITEMS, VIKRITI_INTRO, SCALE, WARNING_SIGNS } from '../data/vikriti.js';
import { RECOMMENDATIONS, DOSHA } from '../data/recommendations.js';
import { scoreVikriti } from '../lib/scoring.js';
import { latestResult, saveResult } from '../lib/storage.js';
import { DoshaBars, doshaList, Claim } from '../components/Shell.jsx';

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
    <div className={`stone d-${dosha}`}>
      <div className="eyebrow">המלצות לאורח חיים</div>
      <h2>
        <span className="dot" />
        לאיזון <span className="dosha-name">{DOSHA[dosha].name}</span>
      </h2>
      <p className="muted small">
        ההמלצות נוגעות לתזונה, לשגרה, לשינה ולפעילות בלבד. אין כאן צמחים, תוספים או מינונים. מי שנמצאים בהריון, בהנקה,
        עם מחלה כרונית או נוטלים תרופות, כדאי שיתייעצו עם הרופא לפני שינוי משמעותי בתזונה.
      </p>
      <div className="stack" style={{ gap: 12 }}>
        {RECOMMENDATIONS[dosha].map((r) => (
          <div key={r.area} style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b>{r.area}</b>
              <Claim type={r.claim} />
            </div>
            <p style={{ margin: '6px 0' }}>{r.text}</p>
            <p className="muted small" style={{ margin: 0 }}>
              הרציונל המסורתי: {r.why}
              {r.note ? ` ${r.note}` : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VikritiMethod() {
  return (
    <div className="stone">
      <h3>על מה השאלון נשען, ואיך הוא מודד את עצמו</h3>
      <p className="claim-line"><Claim type="tradition" /></p>
      <p>
        הפריטים לקוחים מתיאורי הסימנים של עלייה בכל דושה בטקסטים הקלאסיים, למשל אשטאנגה הרידאיה (Ashtanga Hridaya),
        סוטרה סתהאנה פרק 11. חמישה פריטים לכל דושה, בדירוג של 0 עד 3.
      </p>
      <p className="claim-line"><Claim type="assessment" /></p>
      <p style={{ marginBottom: 6 }}>השאלון לא עבר תיקוף מחקרי. שלושה דברים מגבילים את האמינות שלו, והאפליקציה מציגה אותם:</p>
      <ul className="list-plain">
        <li><b>כיסוי מלא:</b> אי אפשר לקבל תוצאה בלי לענות על כל 15 הפריטים.</li>
        <li><b>סף מוצהר:</b> עלייה מוגדרת מעל 40 אחוז מהעוצמה האפשרית. זה סף של האפליקציה, לא של המסורת.</li>
        <li><b>מגמה:</b> מדידה אחת היא תמונת מצב. מילוי חוזר אחרי כמה שבועות מראה אם הדפוס עקבי.</li>
      </ul>
    </div>
  );
}

export function VikritiResult({ result, prakriti }) {
  const focus = result.calm ? prakriti?.type?.[0] || null : result.elevated[0] || result.top;
  const matchesPrakriti = prakriti && !result.calm && prakriti.type.includes(result.elevated[0] || result.top);
  return (
    <div className="stack">
      <div className="stone">
        <div className="eyebrow">הדפוס בשבועיים האחרונים</div>
        <h2>
          {result.calm
            ? 'לא עלה דפוס בולט של עודף'
            : `סימנים של עלייה ב${doshaList(result.elevated.length ? result.elevated : [result.top])}`}
        </h2>
        <DoshaBars pct={result.pct} />
        <p className="muted small" style={{ marginBottom: 0, marginTop: 14 }}>
          האחוז הוא עוצמת הסימנים מתוך המקסימום האפשרי לכל דושה. מעל 40 אחוז נחשב כאן לעלייה. זה סף שנקבע לאפליקציה,
          לא נתון מהמסורת.
        </p>
      </div>
      {prakriti && !result.calm && (
        <div className="note">
          {matchesPrakriti
            ? 'הדושה שעלתה היא גם דושה בולטת בחוקה שלך. לפי המסורת זה הדפוס הנפוץ: מה שחזק אצלנו הוא גם מה שיוצא ראשון מאיזון.'
            : 'הדושה שעלתה אינה הבולטת בחוקה שלך. לפי המסורת זה קורה בעונה, בלחץ או בשינוי שגרה. כדאי לבדוק שוב בעוד כמה שבועות.'}
        </div>
      )}
      {focus ? <Recommendations dosha={focus} /> : (
        <div className="note">כדי לקבל המלצות מותאמות כשהאיזון שקט, מלאו קודם את <a href="#/prakriti">שאלון החוקה</a>.</div>
      )}
      <div className="note">
        זהו תיאור של דפוס לפי המסורת, לא אבחנה. אם תסמין נמשך או מחמיר, פנו לרופא.
      </div>
    </div>
  );
}

export default function Vikriti() {
  const [stage, setStage] = useState('screen');
  const [warnings, setWarnings] = useState([]);
  const [ratings, setRatings] = useState({});
  const [saved, setSaved] = useState(null);
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
      <div className="stack" style={{ maxWidth: 720 }}>
        <div>
          <div className="eyebrow">שאלון איזון נוכחי · Vikriti</div>
          <h1>האיזון הנוכחי</h1>
          <p className="lead">{VIKRITI_INTRO}</p>
        </div>
        <div className="stone">
          <h3>לפני שמתחילים: האם יש לך עכשיו אחד מאלה?</h3>
          <div>
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
        <VikritiMethod />
      </div>
    );
  }

  if (stage === 'result' && saved) {
    return (
      <div className="stack">
        <div className="eyebrow">שאלון איזון נוכחי · תוצאה</div>
        <h1>האיזון שלי עכשיו</h1>
        {warnings.length > 0 && <DoctorAlert />}
        <VikritiResult result={saved.result} prakriti={prakriti} />
        <p className="small muted">{saved.ok ? 'התוצאה נשמרה במכשיר הזה בלבד.' : 'לא הצלחתי לשמור את התוצאה במכשיר.'}</p>
        <div className="row">
          <a className="btn" href="#/consultant">לשאול את היועצת</a>
          <a className="btn ghost" href="#/results">כל התוצאות</a>
        </div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <div>
        <div className="eyebrow">שאלון איזון נוכחי · השבועיים האחרונים</div>
        <h1>כמה זה נכון לגביך עכשיו?</h1>
      </div>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={VIKRITI_ITEMS.length} aria-valuenow={answered}>
        <i style={{ width: `${(answered / VIKRITI_ITEMS.length) * 100}%` }} />
      </div>
      {VIKRITI_ITEMS.map((it, i) => (
        <motion.div
          key={it.id}
          className="stone"
          style={{ padding: 18 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.03, 0.3) }}
        >
          <div id={`l-${it.id}`}>{it.t}</div>
          <div className="scale" role="group" aria-labelledby={`l-${it.id}`}>
            {SCALE.map((s, v) => (
              <button key={s} aria-pressed={ratings[it.id] === v} onClick={() => setRatings({ ...ratings, [it.id]: v })}>
                {s}
              </button>
            ))}
          </div>
        </motion.div>
      ))}
      <div className="row">
        <button className="btn warm" disabled={answered < VIKRITI_ITEMS.length} onClick={submit}>
          {answered < VIKRITI_ITEMS.length ? `נותרו ${VIKRITI_ITEMS.length - answered} שאלות` : 'לראות את התוצאה'}
        </button>
      </div>
    </div>
  );
}
