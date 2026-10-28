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

  const Rows = ({ list, kind }) => (
    <div className="result-rows">
      {list.map((r) => (
        <div key={r.id} className="result-row" data-kind={kind}>
          <span>
            <span className="mono small muted">{formatDate(r.date)}</span>{' '}
            {kind === 'prakriti'
              ? <b>{r.type.length === 3 ? 'שלוש הדושות קרובות' : doshaList(r.type)}</b>
              : <b>{r.calm ? 'לא עלה דפוס בולט' : `עלייה ב${doshaList(r.elevated.length ? r.elevated : [r.top])}`}</b>}
            {kind === 'prakriti' && <span className="small muted"> · הבחנה {CONFIDENCE_TEXT[r.confidence]} · {r.answered}/{r.total}</span>}
          </span>
          <button className="btn danger" onClick={() => deleteResult(kind, r.id)}>מחיקה</button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="screen">
      <div className={empty ? 'text-col' : 'split even'}>
        <div className="text-col">
          <div className="eyebrow">התוצאות שלי</div>
          <h1 style={{ fontSize: 'clamp(34px, 3.8vw, 56px)' }}>מה נשמר במכשיר</h1>
          <p className="lead">התוצאות נשמרות <mark className="hl">בדפדפן הזה בלבד</mark>. הן לא נשלחות לשום שרת, ומחיקה כאן מוחקת אותן לגמרי.</p>
          {empty && (
            <>
              <p style={{ margin: 0 }}>עדיין אין תוצאות שמורות.</p>
              <div className="row">
                <a className="btn warm" href="#/prakriti">לשאלון החוקה</a>
                <a className="btn ghost" href="#/vikriti">לשאלון האיזון הנוכחי</a>
              </div>
            </>
          )}
          {prakriti.length > 0 && (
            <section>
              <h3 style={{ margin: '0 0 5px' }}>חוקה</h3>
              {prakriti[0] && <DoshaBars pct={prakriti[0].pct} />}
              {drift && <p className="caption" style={{ marginTop: 5 }}>יציבות בין שתי המדידות האחרונות: {DRIFT_TEXT[drift.level]}.</p>}
              <Rows list={prakriti.slice(0, 4)} kind="prakriti" />
            </section>
          )}
          {vikriti.length > 0 && (
            <section>
              <h3 style={{ margin: '0 0 5px' }}>איזון נוכחי</h3>
              <Rows list={vikriti.slice(0, 4)} kind="vikriti" />
            </section>
          )}
          {!empty && (
            <div className="row">
              <button className="btn danger" onClick={() => confirm('למחוק את כל התוצאות?') && clearResults()}>מחיקת כל התוצאות</button>
              <span className="caption">ייצוא סיכום לרופא מתוכנן לשלב הבא.</span>
            </div>
          )}
        </div>
        {!empty && (
          <div className="stage">
            <div className="eyebrow" style={{ margin: 0 }}>כל המדידות במשולש אחד</div>
            <Ternary
              points={[
                ...(prakriti[0] ? [{ pct: prakriti[0].pct, color: 'var(--ink)', label: 'חוקה' }] : []),
                ...(vikriti[0] ? [{ pct: vikriti[0].pct, color: 'var(--ember)', label: 'איזון אחרון', pulse: true, below: true }] : []),
              ]}
              trail={[...vikriti].reverse().map((v) => v.pct)}
              arrow={prakriti[0] && vikriti[0] && !vikriti[0].calm ? [prakriti[0].pct, vikriti[0].pct] : null}
              label="החוקה ומסלול האיזון לאורך זמן"
            />
            <p className="caption">הנקודות האפורות הן מדידות איזון קודמות, לפי הסדר. כך רואים מגמה ולא רק תמונת מצב.</p>
          </div>
        )}
      </div>
    </div>
  );
}
