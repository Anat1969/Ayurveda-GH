import { motion } from 'framer-motion';
import { GROUPS, CONCEPTS } from '../data/concepts.js';
import { DOSHA, PRAKRITI_TEXT } from '../data/recommendations.js';
import { latestResult } from '../lib/storage.js';
import { Claim, DoshaBars, doshaList, formatDate } from '../components/Shell.jsx';

const TOWER = [
  { href: '#/prakriti', cls: 'ts-1', title: 'החוקה שלי', sub: '16 שאלות על דפוסים לאורך החיים' },
  { href: '#/vikriti', cls: 'ts-2', title: 'האיזון הנוכחי', sub: '15 שאלות על השבועיים האחרונים, והמלצות לשגרה' },
  { href: '#/library', cls: 'ts-3', title: 'ספריית המושגים', sub: `${CONCEPTS.length} מושגים, כל טענה מסומנת לפי סוגה` },
  { href: '#/consultant', cls: 'ts-4', title: 'שיחה עם היועצת', sub: 'שאלות על המסורת, עם גבולות בטיחות ברורים' },
];

export default function Home() {
  const prakriti = latestResult('prakriti');
  const vikriti = latestResult('vikriti');

  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow">איורוודה קלאסית</div>
          <h1>להבין את הדושות. בלי לאבחן מחלות.</h1>
          <p className="lead">
            הסבר של המסורת מתוך צ׳ראקה סמהיטה וסושרוטה סמהיטה, שאלונים שמתארים את החוקה ואת האיזון הנוכחי, והמלצות
            לאורח חיים בלבד. כל טענה מסומנת: <Claim type="tradition" /> <Claim type="assessment" />{' '}
            <Claim type="research" />
          </p>
          <div className="row" style={{ marginTop: 20 }}>
            <a className="btn warm" href="#/prakriti">להתחיל בשאלון החוקה</a>
            <a className="btn ghost" href="#/library/dosha">מה זו דושה</a>
          </div>
        </div>
        <nav className="tower" aria-label="מפת האפליקציה">
          {TOWER.map((t, i) => (
            <motion.a
              key={t.href}
              href={t.href}
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, type: 'spring', stiffness: 140, damping: 18 }}
              whileHover={{ y: -3 }}
            >
              <div className={`tower-stone ${t.cls}`} style={{ marginInline: 'auto' }}>
                <b>{t.title}</b>
                <span>{t.sub}</span>
              </div>
            </motion.a>
          ))}
        </nav>
      </section>

      {(prakriti || vikriti) && (
        <section className="section">
          <h2>הדפוס שלי</h2>
          <div className="grid two">
            {prakriti && (
              <a className="stone" href="#/results">
                <div className="eyebrow">חוקה, {formatDate(prakriti.date)}</div>
                <h3>{doshaList(prakriti.type)}</h3>
                <p className="muted small">{PRAKRITI_TEXT[prakriti.type[0]]}</p>
                <DoshaBars pct={prakriti.pct} />
              </a>
            )}
            {vikriti && (
              <a className="stone" href="#/results">
                <div className="eyebrow">איזון נוכחי, {formatDate(vikriti.date)}</div>
                <h3>{vikriti.calm ? 'לא עלה דפוס בולט של עודף' : `עלייה של ${doshaList(vikriti.elevated.length ? vikriti.elevated : [vikriti.top])}`}</h3>
                <DoshaBars pct={vikriti.pct} />
              </a>
            )}
          </div>
        </section>
      )}

      <section className="section">
        <h2>שלוש הדושות</h2>
        <div className="grid three">
          {Object.entries(DOSHA).map(([id, d]) => (
            <a key={id} className={`stone d-${id}`} href={`#/library/${id}`}>
              <h3><span className="dot" /> <span className="dosha-name">{d.name}</span></h3>
              <p className="muted small" style={{ margin: 0 }}>{d.elements}. {d.qualities}.</p>
            </a>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>מה יש בספרייה</h2>
        <div className="grid two">
          {GROUPS.map((g) => (
            <a key={g.id} className="stone" href={`#/library?g=${g.id}`}>
              <h3>{g.title}</h3>
              <p className="muted small" style={{ margin: '0 0 8px' }}>{g.note}</p>
              <p className="small" style={{ margin: 0 }}>
                {CONCEPTS.filter((c) => c.group === g.id).map((c) => c.term).join(' · ')}
              </p>
            </a>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="note">
          האפליקציה מסבירה את המסורת ומתארת דפוסים. היא לא מאבחנת מחלות, לא נותנת מינונים ולא ממליצה על צמחים.
          בכל תסמין שנמשך, פנו לרופא. <a href="#/safety">גבולות הבטיחות המלאים</a>
        </div>
      </section>
    </>
  );
}
