import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ElementsFlow, GunaLab, BodyMap, DoshaClock, SeasonWheel, LifeStages, AgniFlames, DhatuCascade, VikritiDemo, PrakritiMap, ClaimMeter, SafetyFlow,
  TasteWheel, DoshaBuild,
} from '../viz/index.jsx';
import { Photo, Rich, Tabs } from '../components/Shell.jsx';
import { go } from '../lib/router.js';

// המסע: שנים עשר פרקים, כל פרק מסך אחד, מהיסודות ועד הגבולות. כל פרק הוא מסר אחד והמחשה אחת.
const CHAPTERS = [
  { id: 'elements', t: 'הכול עשוי מחמישה יסודות', p: 'חלל, אוויר, אש, מים ואדמה. לא כחומרים פיזיקליים, אלא **כשפה לתיאור איכויות**. מצירופי היסודות נוצרות שלוש הדושות, ולכל דושה מבנה גוף משלה.', V: ElementsFlow },
  { id: 'gunas', photo: { src: '/photos/spices.png', alt: 'שורשי ג׳ינג׳ר וכורכום, קינמון והל על לוח עץ באור בוקר' }, t: 'הדומה מגביר את הדומה', p: 'זה הכלל שמאחורי כמעט כל המלצה. **גלידה קרה וכבדה מגבירה את קאפה**, שגם היא קרה וכבדה. מרק חם מאזן את ואטה הקרה. נסו בעצמכם.', V: GunaLab },
  { id: 'tastes', t: 'שישה טעמים, שני יסודות בכל טעם', p: 'כל טעם בנוי משני יסודות, ולכן הוא מגביר או מאזן דושה. **מתוק, חמוץ ומלוח מרגיעים את ואטה**. מתוק, מר ועפיץ מרגיעים את פיטה. חריף, מר ועפיץ מרגיעים את קאפה.', V: TasteWheel },
  { id: 'build', t: 'שלושה מבני גוף', p: 'אותו גוף, בשלוש פרופורציות: **ואטה צרה וקלה, פיטה בינונית, קאפה רחבה ויציבה**. בתוך הגו של כל דמות יושבים שני היסודות שלה. בחרו דושה.', V: DoshaBuild },
  { id: 'seats', t: 'שלושה מושבים בגוף', p: 'קאפה בחזה, פיטה במעי הדק, ואטה במעי הגס. **מכל מושב הדושה פועלת בכל הגוף**: מבנה, המרה ותנועה. האיור אנטומי, והמושבים מסורת.', V: BodyMap },
  { id: 'day', t: 'גם היום מתחלק לדושות', p: 'הבוקר כבד כמו קאפה, הצהריים חמים כמו פיטה, ואחר הצהריים קל ונייד כמו ואטה. המחזור חוזר בלילה. מכאן ההמלצה לאכול את הארוחה העיקרית בצהריים.', V: DoshaClock },
  { id: 'year', t: 'וגם השנה והחיים', p: 'כל עונה מעוררת דושה אחרת, וכל שלב בחיים נשלט בידי דושה אחרת. כאן החלוקה מותאמת לאקלים בישראל.', V: () => <Tabs label="עונות ושלבי חיים" tabs={[{ id: 's', label: 'עונות השנה', content: <SeasonWheel /> }, { id: 'l', label: 'שלבי החיים', content: <LifeStages /> }]} /> },
  { id: 'agni', photo: { src: '/photos/steam.png', alt: 'כוס קרמיקה מעלה אדים ליד חלון בזריחה' }, t: 'האש שבפנים', p: 'אגני הוא הכוח שמעכל. כשהוא מאוזן הלהבה יציבה. כל דושה מעוותת אותו בדרך משלה: ואטה מבהבת, פיטה מחדדת, קאפה מעמעמת.', V: AgniFlames },
  { id: 'dhatu', t: 'מהמזון לרקמה', p: 'המזון הופך לנוזל תזונה, וממנו נבנות שבע רקמות, אחת אחרי השנייה. מה שקורה בראש השרשרת משפיע על כולה.', V: DhatuCascade },
  { id: 'prakriti', t: 'חוקה קבועה, איזון שזז', p: 'החוקה היא נקודה קבועה במשולש, שנקבעה בלידה. האיזון הנוכחי זז סביבה לפי עונה, לחץ ושגרה. המטרה אינה לשנות את החוקה, אלא לחזור אליה.', V: () => <Tabs label="חוקה ואיזון" tabs={[{ id: 'p', label: 'שבעת סוגי החוקה', content: <PrakritiMap /> }, { id: 'v', label: 'האיזון זז סביב החוקה', content: <VikritiDemo /> }]} /> },
  { id: 'evidence', t: 'מה מסורת ומה מחקר', p: 'האפליקציה מסמנת כל טענה. רוב מה שתקראו כאן הוא תיאור של מסורת, ורק מעט נבדק במחקר. זו לא חולשה שצריך להסתיר, אלא מידע שמגיע לכם.', V: ClaimMeter },
  { id: 'limits', t: 'איפה המסורת נעצרת', p: 'יש מצבים שבהם לא מדברים על דושות, אלא פונים לרופא. כך היועצת בודקת כל הודעה, עוד לפני שהיא עונה.', V: SafetyFlow },
];

export default function Journey({ param }) {
  const found = CHAPTERS.findIndex((c) => c.id === param || String(CHAPTERS.indexOf(c) + 1) === param);
  const i = found < 0 ? 0 : found;
  const c = CHAPTERS[i];
  const to = (k) => go(`/journey/${CHAPTERS[k].id}`);

  useEffect(() => {
    const on = (e) => {
      if (e.target?.closest?.('input, textarea, [contenteditable]')) return;
      // ב-RTL "קדימה" הוא שמאלה
      if (e.key === 'ArrowLeft' && i < CHAPTERS.length - 1) to(i + 1);
      if (e.key === 'ArrowRight' && i > 0) to(i - 1);
    };
    addEventListener('keydown', on);
    return () => removeEventListener('keydown', on);
  }, [i]);

  return (
    <div className="screen journey">
      <section className={`split chapter wide-viz`} id={`ch-${c.id}`} aria-labelledby="chapter-title">
        <motion.div key={`t-${c.id}`} className="text-col chapter-text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <div className="eyebrow">המסע · פרק {i + 1} מתוך {CHAPTERS.length}</div>
          <h1 id="chapter-title">{c.t}</h1>
          <p><Rich text={c.p} /></p>
          {c.photo && <Photo className="chapter-photo" src={c.photo.src} alt={c.photo.alt} />}
          <div className="pager">
            <button className="btn ghost" disabled={i === 0} onClick={() => to(i - 1)}>הקודם</button>
            {i < CHAPTERS.length - 1
              ? <button className="btn warm" onClick={() => to(i + 1)}>הפרק הבא</button>
              : <a className="btn warm" href="#/prakriti">לגלות את החוקה שלי</a>}
          </div>
          <nav className="rail" aria-label="פרקי המסע">
            {CHAPTERS.map((x, k) => (
              <button key={x.id} aria-current={k === i ? 'step' : undefined} title={x.t} aria-label={`פרק ${k + 1}: ${x.t}`} onClick={() => to(k)}>{k + 1}</button>
            ))}
          </nav>
        </motion.div>
        <motion.div key={`v-${c.id}`} className="stage chapter-viz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }}>
          <c.V />
        </motion.div>
      </section>
    </div>
  );
}
