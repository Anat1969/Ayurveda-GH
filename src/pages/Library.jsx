import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GROUPS, CONCEPTS, conceptById } from '../data/concepts.js';
import { Claim } from '../components/Shell.jsx';

export function Library() {
  useEffect(() => {
    const g = new URLSearchParams(location.hash.split('?')[1] || '').get('g');
    if (g) document.getElementById(`g-${g}`)?.scrollIntoView({ block: 'start' });
  }, []);

  return (
    <>
      <div className="eyebrow">ספרייה</div>
      <h1>מושגי היסוד</h1>
      <p className="lead">
        כל פסקה מסומנת: <Claim type="tradition" /> מה שכתוב בטקסטים, <Claim type="assessment" /> פרשנות,{' '}
        <Claim type="research" /> מה שנבדק במחקר, ו<Claim type="none" /> כשלא נבדק.
      </p>
      {GROUPS.map((g) => (
        <section key={g.id} id={`g-${g.id}`} className="section" style={{ scrollMarginTop: 130 }}>
          <h2>{g.title}</h2>
          <p className="muted" style={{ marginTop: -6 }}>{g.note}</p>
          <div className="grid two">
            {CONCEPTS.filter((c) => c.group === g.id).map((c) => (
              <a key={c.id} className={`stone ${c.dosha ? `d-${c.dosha}` : ''}`} href={`#/library/${c.id}`}>
                <div className="eyebrow">{c.sanskrit}</div>
                <h3>
                  {c.dosha && <span className="dot" />}
                  <span className={c.dosha ? 'dosha-name' : undefined}>{c.term}</span>
                </h3>
                <p className="muted small" style={{ margin: 0 }}>{c.short}</p>
              </a>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

export function Concept({ id }) {
  const c = conceptById(id);
  if (!c) {
    return (
      <div className="stone">
        <h2>המושג לא נמצא</h2>
        <a className="btn" href="#/library">לספרייה</a>
      </div>
    );
  }
  const index = CONCEPTS.indexOf(c);
  const prev = CONCEPTS[index - 1];
  const next = CONCEPTS[index + 1];
  const group = GROUPS.find((g) => g.id === c.group);

  return (
    <article className={c.dosha ? `d-${c.dosha}` : undefined}>
      <div className="eyebrow">
        <a href={`#/library?g=${group.id}`} style={{ color: 'inherit' }}>{group.title}</a> · {c.sanskrit}
      </div>
      <h1>
        {c.dosha && <span className="dot" style={{ width: 22, height: 22 }} />}
        {c.term}
      </h1>
      <p className="lead">{c.short}</p>
      <div className="stack" style={{ marginTop: 28 }}>
        {c.sections.map((s, i) => (
          <motion.div
            key={i}
            className="stone"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <p className="claim-line"><Claim type={s.claim} /></p>
            <p style={{ margin: 0 }}>{s.text}</p>
          </motion.div>
        ))}
      </div>
      {(c.id === 'prakriti' || c.dosha) && (
        <div className="row" style={{ marginTop: 24 }}>
          <a className="btn warm" href="#/prakriti">לשאלון החוקה</a>
          <a className="btn ghost" href="#/vikriti">לשאלון האיזון הנוכחי</a>
        </div>
      )}
      <hr className="soft" />
      <div className="row" style={{ justifyContent: 'space-between' }}>
        {prev ? <a href={`#/library/${prev.id}`}>הקודם: {prev.term}</a> : <span />}
        {next ? <a href={`#/library/${next.id}`}>הבא: {next.term}</a> : <span />}
      </div>
    </article>
  );
}
