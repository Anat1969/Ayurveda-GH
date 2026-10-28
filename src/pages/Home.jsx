import { motion } from 'framer-motion';
import { CONCEPTS } from '../data/concepts.js';
import { PRAKRITI_TEXT } from '../data/recommendations.js';
import { CLOCK_TEXT, SEASON_TEXT, MONTH_DOSHA, MONTHS, DOSHA_COLOR, dosha24 } from '../data/viz.js';
import { latestResult } from '../lib/storage.js';
import { Claim, doshaList, formatDate } from '../components/Shell.jsx';
import { HeroScene, DoshaClock, ConceptGraph, Ternary } from '../viz/index.jsx';

const DNAME = { vata: 'ואטה', pitta: 'פיטה', kapha: 'קאפה' };

const TOWER = [
  { href: '#/journey', cls: 'ts-1', title: 'המסע', sub: 'עשרה פרקים, מהיסודות ועד הגבולות' },
  { href: '#/prakriti', cls: 'ts-2', title: 'החוקה שלי', sub: '16 שאלות, ונקודה שזזה במשולש בזמן אמת' },
  { href: '#/vikriti', cls: 'ts-3', title: 'האיזון הנוכחי', sub: '15 שאלות, והמלצות לשגרה' },
  { href: '#/consultant', cls: 'ts-4', title: 'שיחה עם היועצת', sub: 'שאלות על המסורת, עם גבולות ברורים' },
];

const CHAPTER_PEEK = ['חמשת היסודות', 'הדומה מגביר', 'מפת הגוף', 'שעון הדושות', 'עונות וחיים', 'אש העיכול', 'שבע הרקמות', 'חוקה ואיזון', 'מסורת ומחקר', 'הגבולות'];

export default function Home() {
  const prakriti = latestResult('prakriti');
  const vikriti = latestResult('vikriti');
  const now = new Date();
  const hourDosha = dosha24(now.getHours() + now.getMinutes() / 60);
  const seasonDosha = MONTH_DOSHA[now.getMonth()];

  return (
    <>
      <section className="hero">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="eyebrow">איורוודה קלאסית</div>
          <h1>להבין את הדושות. בלי לאבחן מחלות.</h1>
          <p className="lead">
            המסורת של צ׳ראקה סמהיטה וסושרוטה סמהיטה, כחוויה: מפות, שעונים, מעבדות ומשולש חוקה שזז בזמן אמת. כל טענה
            מסומנת: <Claim type="tradition" /> <Claim type="assessment" /> <Claim type="research" />
          </p>
          <div className="row" style={{ marginTop: 20 }}>
            <a className="btn warm" href="#/journey">להתחיל את המסע</a>
            <a className="btn ghost" href="#/prakriti">ישר לשאלון החוקה</a>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }}>
          <HeroScene />
        </motion.div>
      </section>

      <section className="section now">
        <div className="now-grid">
          <div className="stone viz-stone"><DoshaClock compact /></div>
          <motion.div className="stone now-card" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="eyebrow">עכשיו, לפי המסורת</div>
            <h2>
              שעת <span style={{ color: DOSHA_COLOR[hourDosha] }}>{DNAME[hourDosha]}</span>, בעונת{' '}
              <span style={{ color: DOSHA_COLOR[seasonDosha] }}>{DNAME[seasonDosha]}</span>
            </h2>
            <p>{CLOCK_TEXT[hourDosha]}</p>
            <p className="muted small">{MONTHS[now.getMonth()]}: {SEASON_TEXT[seasonDosha]}</p>
            <p className="small"><Claim type="tradition" /> השעון <Claim type="assessment" /> ההתאמה לעונות בישראל</p>
            <div className="row">
              <a className="btn ghost" href="#/library/dinacharya">שגרה יומית</a>
              <a className="btn ghost" href="#/library/ritucharya">שגרה עונתית</a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <a className="journey-teaser" href="#/journey">
          <div>
            <div className="eyebrow">המסע</div>
            <h2>עשרה פרקים. רעיון אחד בכל פרק, והמחשה שאפשר לגעת בה.</h2>
          </div>
          <ol className="peek">
            {CHAPTER_PEEK.map((t, i) => (
              <motion.li key={t} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 * i }}>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span> {t}
              </motion.li>
            ))}
          </ol>
        </a>
      </section>

      <section className="section">
        <h2>מה אפשר לעשות כאן</h2>
        <nav className="tower" aria-label="מפת האפליקציה">
          {TOWER.map((t, i) => (
            <motion.a
              key={t.href} href={t.href}
              initial={{ opacity: 0, y: -24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.08 * i, type: 'spring', stiffness: 140, damping: 18 }} whileHover={{ y: -3 }}
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
            <div className="stone viz-stone">
              <Ternary
                points={[
                  ...(prakriti ? [{ pct: prakriti.pct, color: '#1E2430', label: 'חוקה' }] : []),
                  ...(vikriti ? [{ pct: vikriti.pct, color: '#E8A33D', label: 'איזון נוכחי', pulse: true, below: true }] : []),
                ]}
                arrow={prakriti && vikriti ? [prakriti.pct, vikriti.pct] : null}
                label="החוקה והאיזון הנוכחי שלי במשולש"
              />
            </div>
            <a className="stone" href="#/results">
              {prakriti && (
                <>
                  <div className="eyebrow">חוקה, {formatDate(prakriti.date)}</div>
                  <h3>{prakriti.type.length === 3 ? 'שלוש הדושות קרובות' : doshaList(prakriti.type)}</h3>
                  <p className="muted small">{PRAKRITI_TEXT[prakriti.type[0]]}</p>
                </>
              )}
              {vikriti && (
                <>
                  <div className="eyebrow">איזון נוכחי, {formatDate(vikriti.date)}</div>
                  <h3>{vikriti.calm ? 'לא עלה דפוס בולט של עודף' : `עלייה ב${doshaList(vikriti.elevated.length ? vikriti.elevated : [vikriti.top])}`}</h3>
                </>
              )}
              <p className="small">החץ במשולש מראה לאן האיזון זז ביחס לחוקה. לכל התוצאות</p>
            </a>
          </div>
        </section>
      )}

      <section className="section">
        <h2>מפת הידע</h2>
        <p className="muted">{CONCEPTS.length} מושגים והקשרים ביניהם. לחצו על מושג כדי לפתוח אותו.</p>
        <div className="stone viz-stone"><ConceptGraph /></div>
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
