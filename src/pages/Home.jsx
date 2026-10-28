import { motion } from 'framer-motion';
import { CONCEPTS } from '../data/concepts.js';
import { PRAKRITI_TEXT } from '../data/recommendations.js';
import { CLOCK_TEXT, SEASON_TEXT, MONTH_DOSHA, MONTHS, DOSHA_COLOR, dosha24 } from '../data/viz.js';
import { latestResult } from '../lib/storage.js';
import { Claim, doshaList, formatDate } from '../components/Shell.jsx';
import { BodyMap, DoshaClock, ConceptGraph, Ternary } from '../viz/index.jsx';

const DNAME = { vata: 'ואטה', pitta: 'פיטה', kapha: 'קאפה' };
const EASE = [0.22, 1, 0.36, 1];
const rise = (delay = 0) => ({ initial: { opacity: 0, y: 8 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.8, delay, ease: EASE } });

const TOWER = [
  { href: '#/journey', title: 'המסע', sub: 'עשרה פרקים, מהיסודות ועד הגבולות' },
  { href: '#/prakriti', title: 'החוקה שלי', sub: '16 שאלות, ונקודה שזזה בפריזמה בזמן אמת' },
  { href: '#/vikriti', title: 'האיזון הנוכחי', sub: '15 שאלות, והמלצות לשגרה' },
  { href: '#/consultant', title: 'שיחה עם היועצת', sub: 'שאלות על המסורת, עם גבולות ברורים' },
];

const CHAPTER_PEEK = ['חמשת היסודות', 'הדומה מגביר', 'הגוף', 'שעון היממה', 'עונות וחיים', 'אש העיכול', 'שבע הרקמות', 'חוקה ואיזון', 'מסורת ומחקר', 'הגבולות'];

export default function Home() {
  const prakriti = latestResult('prakriti');
  const vikriti = latestResult('vikriti');
  const now = new Date();
  const hourDosha = dosha24(now.getHours() + now.getMinutes() / 60);
  const seasonDosha = MONTH_DOSHA[now.getMonth()];

  return (
    <>
      <section className="hero">
        <motion.div className="spine" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
          <div>
            <div className="eyebrow">איורוודה קלאסית · צ׳ראקה וסושרוטה</div>
            <h1>הגוף מדבר בשקט</h1>
            <p className="lead">
              המסורת מונחת על גבי האנטומיה, ולא במקומה. חוקה, איזון ושגרה, וכל טענה מסומנת לפי סוגה:{' '}
              <Claim type="tradition" /> <Claim type="assessment" /> <Claim type="research" />
            </p>
            <div className="row" style={{ marginTop: 34 }}>
              <a className="btn warm" href="#/journey">להתחיל את המסע</a>
              <a className="btn ghost" href="#/prakriti">שאלון החוקה</a>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.2, ease: EASE }}>
          <BodyMap hero />
        </motion.div>
      </section>

      <section className="section now">
        <div className="now-grid">
          <motion.div className="stone viz-stone" {...rise()}><DoshaClock compact /></motion.div>
          <motion.div className="now-card" {...rise(0.1)}>
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
          <motion.div {...rise()}>
            <div className="eyebrow">המסע</div>
            <h2>עשרה פרקים. רעיון אחד בכל פרק, והמחשה שאפשר לגעת בה.</h2>
          </motion.div>
          <ol className="peek">
            {CHAPTER_PEEK.map((t, i) => (
              <motion.li key={t} {...rise(0.04 * i)}>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>{t}
              </motion.li>
            ))}
          </ol>
        </a>
      </section>

      <section className="section">
        <h2>מה אפשר לעשות כאן</h2>
        <nav className="tower" aria-label="מפת האפליקציה">
          {TOWER.map((t, i) => (
            <motion.a key={t.href} href={t.href} {...rise(0.06 * i)}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <span>
                <b>{t.title}</b>
                <span>{t.sub}</span>
              </span>
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
                  ...(prakriti ? [{ pct: prakriti.pct, label: 'חוקה' }] : []),
                  ...(vikriti ? [{ pct: vikriti.pct, color: 'var(--ember)', label: 'איזון נוכחי', pulse: true, below: true }] : []),
                ]}
                arrow={prakriti && vikriti ? [prakriti.pct, vikriti.pct] : null}
                label="החוקה והאיזון הנוכחי שלי בפריזמה"
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
              <p className="small">הקו בפריזמה מראה לאן האיזון זז ביחס לחוקה. לכל התוצאות</p>
            </a>
          </div>
        </section>
      )}

      <section className="section">
        <h2>מפת הידע</h2>
        <p className="muted">{CONCEPTS.length} מושגים והקשרים ביניהם, כקבוצת כוכבים. לחצו על מושג כדי לפתוח אותו.</p>
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
