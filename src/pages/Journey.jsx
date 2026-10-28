import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ElementsFlow, GunaLab, BodyMap, DoshaClock, SeasonWheel, LifeStages, AgniFlames, DhatuCascade, VikritiDemo, PrakritiMap, ClaimMeter, SafetyFlow,
} from '../viz/index.jsx';

// המסע: עשרה פרקים, מהיסודות ועד הגבולות. כל פרק הוא מסר אחד והמחשה אחת.
const CHAPTERS = [
  { id: 'elements', k: 'פרק 1', t: 'הכול עשוי מחמישה יסודות', p: 'חלל, אוויר, אש, מים ואדמה. לא כחומרים פיזיקליים, אלא כשפה לתיאור איכויות. מצירופי היסודות נוצרות שלוש הדושות.', V: ElementsFlow },
  { id: 'gunas', k: 'פרק 2', t: 'הדומה מגביר את הדומה', p: 'זה הכלל שמאחורי כמעט כל המלצה. גלידה קרה וכבדה מגבירה את קאפה, שגם היא קרה וכבדה. מרק חם מאזן את ואטה הקרה. נסו בעצמכם.', V: GunaLab },
  { id: 'body', k: 'פרק 3', t: 'שלוש דושות, שלושה מושבים', p: 'קאפה בחזה, פיטה במעי הדק, ואטה במעי הגס. מכל מושב הדושה פועלת בכל הגוף: מבנה, המרה ותנועה.', V: BodyMap },
  { id: 'day', k: 'פרק 4', t: 'גם היום מתחלק לדושות', p: 'הבוקר כבד כמו קאפה, הצהריים חמים כמו פיטה, ואחר הצהריים קל ונייד כמו ואטה. המחזור חוזר בלילה. מכאן ההמלצה לאכול את הארוחה העיקרית בצהריים.', V: DoshaClock },
  { id: 'year', k: 'פרק 5', t: 'וגם השנה והחיים', p: 'כל עונה מעוררת דושה אחרת, וכל שלב בחיים נשלט בידי דושה אחרת. כאן החלוקה מותאמת לאקלים בישראל.', V: () => (<><SeasonWheel /><LifeStages /></>) },
  { id: 'agni', k: 'פרק 6', t: 'האש שבפנים', p: 'אגני הוא הכוח שמעכל. כשהוא מאוזן הלהבה יציבה. כל דושה מעוותת אותו בדרך משלה: ואטה מבהבת, פיטה מחדדת, קאפה מעמעמת.', V: AgniFlames },
  { id: 'dhatu', k: 'פרק 7', t: 'מהמזון לרקמה', p: 'המזון הופך לנוזל תזונה, וממנו נבנות שבע רקמות, אחת אחרי השנייה. מה שקורה בראש השרשרת משפיע על כולה.', V: DhatuCascade },
  { id: 'prakriti', k: 'פרק 8', t: 'חוקה קבועה, איזון שזז', p: 'החוקה היא נקודה קבועה במשולש, שנקבעה בלידה. האיזון הנוכחי זז סביבה לפי עונה, לחץ ושגרה. המטרה אינה לשנות את החוקה, אלא לחזור אליה.', V: () => (<><PrakritiMap /><VikritiDemo /></>) },
  { id: 'evidence', k: 'פרק 9', t: 'מה מסורת ומה מחקר', p: 'האפליקציה מסמנת כל טענה. רוב מה שתקראו כאן הוא תיאור של מסורת, ורק מעט נבדק במחקר. זו לא חולשה שצריך להסתיר, אלא מידע שמגיע לכם.', V: ClaimMeter },
  { id: 'limits', k: 'פרק 10', t: 'איפה המסורת נעצרת', p: 'יש מצבים שבהם לא מדברים על דושות, אלא פונים לרופא. כך היועצת בודקת כל הודעה, עוד לפני שהיא עונה.', V: SafetyFlow },
];

export default function Journey() {
  const [active, setActive] = useState(CHAPTERS[0].id);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id.replace('ch-', ''))),
      { rootMargin: '-45% 0px -45% 0px' },
    );
    CHAPTERS.forEach((c) => {
      const el = document.getElementById(`ch-${c.id}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="journey">
      <header className="journey-head">
        <div className="eyebrow">המסע · עשרה פרקים</div>
        <h1>איורוודה, מהיסודות ועד הגבולות</h1>
        <p className="lead">גללו. כל פרק הוא רעיון אחד, עם המחשה שאפשר לגעת בה.</p>
      </header>

      <nav className="chapter-dots" aria-label="פרקי המסע">
        {CHAPTERS.map((c, i) => (
          <a key={c.id} href={`#/journey`} onClick={(e) => { e.preventDefault(); document.getElementById(`ch-${c.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
            aria-current={active === c.id ? 'step' : undefined} title={c.t}>
            <span className="dot-num mono">{i + 1}</span>
            <span className="dot-label">{c.t}</span>
          </a>
        ))}
      </nav>

      {CHAPTERS.map((c, i) => (
        <section key={c.id} id={`ch-${c.id}`} className="chapter">
          <motion.div className="chapter-text" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}>
            <div className="eyebrow">{c.k}</div>
            <h2>{c.t}</h2>
            <p>{c.p}</p>
            {i === CHAPTERS.length - 1 && (
              <div className="row" style={{ marginTop: 18 }}>
                <a className="btn warm" href="#/prakriti">לגלות את החוקה שלי</a>
                <a className="btn ghost" href="#/maps">לכל המפות</a>
              </div>
            )}
          </motion.div>
          <motion.div className="chapter-viz stone viz-stone" initial={{ opacity: 0, y: 40, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7 }}>
            <c.V />
          </motion.div>
        </section>
      ))}
    </div>
  );
}
