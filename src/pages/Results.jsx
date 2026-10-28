import { useEffect, useState } from 'react';
import { loadResults, deleteResult, clearResults } from '../lib/storage.js';
import { prakritiDrift, CONFIDENCE_TEXT, DRIFT_TEXT } from '../lib/scoring.js';
import { DoshaBars, doshaList, formatDate } from '../components/Shell.jsx';
import { Ternary } from '../viz/index.jsx';

function useResults() {
  const read = () => ({ prakriti: loadResults('prakriti'), vikriti: loadResults('vikriti') });
  const [data, setData] = useState(read);
  useEffect(() => {
    const on = () => setData(read());
    addEventListener('ayur-storage', on);
    addEventListener('storage', on);
    return () => {
      removeEventListener('ayur-storage', on);
      removeEventListener('storage', on);
    };
  }, []);
  return data;
}

export default function Results() {
  const { prakriti, vikriti } = useResults();
  const empty = !prakriti.length && !vikriti.length;
  const drift = prakriti.length > 1 ? prakritiDrift(prakriti[0].pct, prakriti[1].pct) : null;

  return (
    <div className="stack">
      <div>
        <div className="eyebrow">התוצאות שלי</div>
        <h1>מה נשמר במכשיר</h1>
        <p className="lead">התוצאות נשמרות בדפדפן הזה בלבד. הן לא נשלחות לשום שרת, ומחיקה כאן מוחקת אותן לגמרי.</p>
      </div>

      {empty && (
        <div className="stone">
          <p style={{ marginTop: 0 }}>עדיין אין תוצאות שמורות.</p>
          <div className="row">
            <a className="btn warm" href="#/prakriti">לשאלון החוקה</a>
            <a className="btn ghost" href="#/vikriti">לשאלון האיזון הנוכחי</a>
          </div>
        </div>
      )}

      {!empty && (
        <div className="stone viz-stone">
          <div className="eyebrow">כל המדידות במשולש אחד</div>
          <Ternary
            points={[
              ...(prakriti[0] ? [{ pct: prakriti[0].pct, color: '#1E2430', label: 'חוקה' }] : []),
              ...(vikriti[0] ? [{ pct: vikriti[0].pct, color: '#E8A33D', label: 'איזון אחרון', pulse: true, below: true }] : []),
            ]}
            trail={[...vikriti].reverse().map((v) => v.pct)}
            arrow={prakriti[0] && vikriti[0] && !vikriti[0].calm ? [prakriti[0].pct, vikriti[0].pct] : null}
            label="החוקה ומסלול האיזון לאורך זמן"
          />
          <p className="small muted" style={{ margin: 0 }}>הנקודות האפורות הן מדידות איזון קודמות, לפי הסדר. כך רואים מגמה ולא רק תמונת מצב.</p>
        </div>
      )}

      {prakriti.length > 0 && (
        <section>
          <h2>חוקה</h2>
          {drift && <p className="muted">יציבות בין שתי המדידות האחרונות: {DRIFT_TEXT[drift.level]}.</p>}
          <div className="grid two">
            {prakriti.map((r) => (
              <div key={r.id} className="stone">
                <div className="eyebrow">{formatDate(r.date)}</div>
                <h3>{r.type.length === 3 ? 'שלוש הדושות קרובות' : doshaList(r.type)}</h3>
                <DoshaBars pct={r.pct} />
                <p className="small muted">הבחנה {CONFIDENCE_TEXT[r.confidence]} · {r.answered} מתוך {r.total} שאלות</p>
                <button className="btn danger" onClick={() => deleteResult('prakriti', r.id)}>מחיקה</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {vikriti.length > 0 && (
        <section className="section">
          <h2>איזון נוכחי</h2>
          <div className="grid two">
            {vikriti.map((r) => (
              <div key={r.id} className="stone">
                <div className="eyebrow">{formatDate(r.date)}</div>
                <h3>{r.calm ? 'לא עלה דפוס בולט' : `עלייה ב${doshaList(r.elevated.length ? r.elevated : [r.top])}`}</h3>
                <DoshaBars pct={r.pct} />
                <div className="row" style={{ marginTop: 14 }}>
                  <button className="btn danger" onClick={() => deleteResult('vikriti', r.id)}>מחיקה</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!empty && (
        <div className="row">
          <button className="btn danger" onClick={() => confirm('למחוק את כל התוצאות?') && clearResults()}>מחיקת כל התוצאות</button>
        </div>
      )}
      <div className="note">ייצוא סיכום לרופא ומעקב לאורך זמן מתוכננים לשלב הבא של האפליקציה.</div>
    </div>
  );
}
