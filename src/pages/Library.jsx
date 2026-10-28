import { useState } from 'react';
import { motion } from 'framer-motion';
import { GROUPS, CONCEPTS, conceptById, CLAIM } from '../data/concepts.js';
import { Claim, Rich } from '../components/Shell.jsx';
import { ConceptViz } from '../viz/index.jsx';
import { DoshaMark } from '../viz/Glyphs.jsx';

// הספרייה: כל המושגים במסך אחד, בחמש עמודות לפי קבוצה.
export function Library() {
  const g = new URLSearchParams(location.hash.split('?')[1] || '').get('g');
  return (
    <div className="screen">
      <div className="text-col">
        <div className="eyebrow">ספרייה · {CONCEPTS.length} מושגים</div>
        <h1 style={{ fontSize: 'clamp(36px, 4vw, 58px)' }}>מושגי היסוד</h1>
        <p className="lead" style={{ maxWidth: 820 }}>
          כל פסקה מסומנת: <Claim type="tradition" /> מה שכתוב בטקסטים, <Claim type="assessment" /> פרשנות,{' '}
          <Claim type="research" /> מה שנבדק במחקר, ו<Claim type="none" /> כשלא נבדק. את הקשרים בין המושגים אפשר לראות ב<a href="#/maps/graph">מפת הידע</a>.
        </p>
      </div>
      <div className="lib-grid">
        {GROUPS.map((grp) => (
          <section key={grp.id} id={`g-${grp.id}`} className="lib-group" aria-current={g === grp.id ? 'true' : undefined}>
            <h2>{grp.title}</h2>
            <p className="note-line">{grp.note}</p>
            <ul>
              {CONCEPTS.filter((c) => c.group === grp.id).map((c) => (
                <li key={c.id}>
                  <a className="concept-link" href={`#/library/${c.id}`} title={c.short}>
                    <span>
                      <b className={c.dosha ? `dosha-name d-${c.dosha}` : undefined}>{c.term}</b>
                      <small>{c.sanskrit}</small>
                    </span>
                    {c.dosha && <DoshaMark d={c.dosha} size={24} />}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

const LONG = 420;

export function Concept({ id }) {
  const c = conceptById(id);
  const [sec, setSec] = useState(0);
  if (!c) {
    return (
      <div className="screen">
        <h1>המושג לא נמצא</h1>
        <a className="btn" href="#/library">לספרייה</a>
      </div>
    );
  }
  const index = CONCEPTS.indexOf(c);
  const prev = CONCEPTS[index - 1];
  const next = CONCEPTS[index + 1];
  const group = GROUPS.find((g) => g.id === c.group);
  const paged = c.sections.length > 3 || c.sections.reduce((n, s) => n + s.text.length, 0) > LONG;

  return (
    <article className={`screen concept ${c.dosha ? `d-${c.dosha}` : ''}`}>
      <div className="split wide-viz">
        <div className="text-col">
          <div className="concept-head">
            <div className="eyebrow">
              <a href={`#/library?g=${group.id}`} style={{ color: 'inherit' }}>{group.title}</a> · {c.sanskrit}
            </div>
            <h1>{c.term}</h1>
          </div>
          <p className="lead"><Rich text={c.short} /></p>
          {paged ? (
            <div>
              <div className="tabs" role="tablist" aria-label="פסקאות">
                {c.sections.map((s, k) => (
                  <button key={k} role="tab" aria-selected={k === sec} onClick={() => setSec(k)}>
                    <span className="mono">{k + 1}</span> <span className={`claim ${s.claim}`}>{CLAIM[s.claim]}</span>
                  </button>
                ))}
              </div>
              <motion.div key={sec} className="tab-panel" role="tabpanel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <p style={{ margin: 0 }}><Rich text={c.sections[sec].text} /></p>
              </motion.div>
            </div>
          ) : (
            <div className="sections">
              {c.sections.map((s, k) => (
                <motion.div key={k} className="section-item" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * k }}>
                  <Claim type={s.claim} />
                  <p><Rich text={s.text} /></p>
                </motion.div>
              ))}
            </div>
          )}
          {(c.id === 'prakriti' || c.dosha) && (
            <div className="row">
              <a className="btn warm" href="#/prakriti">לשאלון החוקה</a>
              <a className="btn ghost" href="#/vikriti">לשאלון האיזון</a>
            </div>
          )}
          <nav className="concept-nav" aria-label="מושגים סמוכים">
            {prev ? <a href={`#/library/${prev.id}`}>הקודם: {prev.term}</a> : <span />}
            {next ? <a href={`#/library/${next.id}`}>הבא: {next.term}</a> : <span />}
          </nav>
        </div>
        <div className="stage concept-viz">
          <ConceptViz id={c.id} dosha={c.dosha} />
        </div>
      </div>
    </article>
  );
}
