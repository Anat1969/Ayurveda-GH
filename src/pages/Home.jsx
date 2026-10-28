import { motion } from 'framer-motion';
import { CLOCK_TEXT, MONTH_DOSHA, MONTHS, dosha24 } from '../data/viz.js';
import { latestResult } from '../lib/storage.js';
import { Claim, Photo, Steam, doshaList } from '../components/Shell.jsx';
import { DoshaMark } from '../viz/Glyphs.jsx';

const DNAME = { vata: 'ואטה', pitta: 'פיטה', kapha: 'קאפה' };
const EASE = [0.22, 1, 0.36, 1];

const TOWER = [
  { href: '#/journey', title: 'המסע', sub: 'שנים עשר פרקים, מהיסודות ועד הגבולות' },
  { href: '#/prakriti', title: 'החוקה שלי', sub: '16 שאלות, ונקודה שזזה בפריזמה בזמן אמת' },
  { href: '#/vikriti', title: 'האיזון הנוכחי', sub: '15 שאלות, והמלצות לשגרה' },
  { href: '#/consultant', title: 'שיחה עם היועצת', sub: 'שאלות על המסורת, עם גבולות ברורים' },
];

// דף הבית: מסך אחד. מימין הכניסה, משמאל האור והחומר מתמונת ההשראה.
export default function Home() {
  const prakriti = latestResult('prakriti');
  const now = new Date();
  const hourDosha = dosha24(now.getHours() + now.getMinutes() / 60);
  const seasonDosha = MONTH_DOSHA[now.getMonth()];

  return (
    <div className="screen home">
      <div className="split">
        <motion.div className="text-col spine-col" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
          <div className="eyebrow">איורוודה קלאסית · צ׳ראקה וסושרוטה</div>
          <h1>הגוף מדבר בשקט</h1>
          <p className="lead">
            המסורת מונחת <mark className="hl">על גבי האנטומיה, ולא במקומה</mark>. חוקה, איזון ושגרה, וכל טענה מסומנת לפי סוגה:{' '}
            <Claim type="tradition" /> <Claim type="assessment" /> <Claim type="research" />
          </p>
          <nav className="tower" aria-label="מפת האפליקציה">
            {TOWER.map((t, i) => (
              <a key={t.href} href={t.href}>
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <span aria-hidden="true">
                  {i === 1 && prakriti ? <DoshaMark d={prakriti.type[0]} /> : null}
                </span>
                <span>
                  <b>{t.title}</b>
                  <span className="sub">{i === 1 && prakriti ? `נשמר: ${prakriti.type.length === 3 ? 'שלוש הדושות קרובות' : doshaList(prakriti.type)}` : t.sub}</span>
                </span>
              </a>
            ))}
          </nav>
          <p className="now-line" aria-label="עכשיו, לפי המסורת">
            <span>עכשיו, לפי המסורת:</span>
            <span className="glyph-inline"><DoshaMark d={hourDosha} /> שעת {DNAME[hourDosha]}</span>
            <span className="glyph-inline"><DoshaMark d={seasonDosha} /> {MONTHS[now.getMonth()]}, עונת {DNAME[seasonDosha]}</span>
            <a href="#/maps/clock" title={CLOCK_TEXT[hourDosha]}>לשעון</a>
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, ease: EASE }}>
          <Photo className="home-photo" src="/photos/bowl.png" alt="קערת פליז עם מים ועלי בזיליקום קדוש, מוארת מאחור באור בוקר">
            <Steam style={{ left: '46%', top: '14%' }} color="rgba(255,255,255,.85)" />
          </Photo>
        </motion.div>
      </div>
    </div>
  );
}
