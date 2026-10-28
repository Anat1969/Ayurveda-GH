import { WARNING_SIGNS } from '../data/vikriti.js';
import { Claim, Tabs } from '../components/Shell.jsx';
import { SafetyFlow, ClaimMeter } from '../viz/index.jsx';

const LIMITS = [
  'אין איבחון מחלות. "איבחון" כאן פירושו תיאור של החוקה ושל האיזון הנוכחי כדפוס בלבד.',
  'אין מינונים של צמחים, תוספים או תכשירים.',
  'אין המלצה להפסיק או להחליף תרופה. בכל שאלה על תרופה, פנו לרופא או לרוקח.',
  'בהריון, בהנקה, בילדים, בגיל מבוגר, במחלה אוטואימונית, בסוכרת, בלחץ דם ובנטילת מדללי דם: כל שימוש בצמחים רק אחרי התייעצות עם רופא.',
  'ההמלצות נוגעות לאורח חיים בלבד: תזונה, שגרה יומית, עונתיות, שינה ופעילות.',
];

const NCCIH = 'https://www.nccih.nih.gov/health/ayurvedic-medicine-in-depth';

// בטיחות ומקורות: מסך אחד. משמאל השערים, מימין סימני האזהרה ולשוניות.
export default function Safety() {
  return (
    <div className="screen">
      <div className="split">
        <div className="text-col">
          <div>
            <div className="eyebrow">בטיחות ומקורות</div>
            <h1 style={{ fontSize: 'clamp(32px, 3.2vw, 46px)' }}>מה האפליקציה עושה, ומה לא</h1>
          </div>
          <div className="alert">
            <p style={{ margin: '0 0 5px' }}><strong>סימנים שמחייבים רופא מיד:</strong> {WARNING_SIGNS.join(' · ')}.</p>
            <p style={{ margin: 0 }}>
              מד"א <b>101</b> · מספר החירום <b>112</b> · ער"ן, למצוקה נפשית או מחשבות אובדניות <b>1201</b>
            </p>
          </div>
          <div className="safety-tabs"><Tabs
            label="בטיחות ומקורות"
            tabs={[
              { id: 'limits', label: 'גבולות', content: <ul className="list-plain">{LIMITS.map((l) => <li key={l}>{l}</li>)}</ul> },
              {
                id: 'products', label: 'תכשירים ומתכות', content: (
                  <div className="stack" style={{ gap: 8 }}>
                    <p style={{ margin: 0 }}><Claim type="research" /> בחלק מהתכשירים האיורוודיים נמצאו <mark className="hl">עופרת, כספית וארסן</mark> ברמות מזיקות. בסקר מ-2015, ל-40 אחוז מהמשתמשים היו רמות עופרת גבוהות בדם.</p>
                    <p style={{ margin: 0 }}><Claim type="research" /> יש מעט ניסויים מבוקרים היטב. <mark className="hl">אין לדחות טיפול רפואי</mark> בשל טיפול איורוודי.</p>
                    <p className="caption">מקור: <a href={NCCIH} target="_blank" rel="noreferrer">NCCIH, Ayurvedic Medicine: In Depth</a> · Saper R.B. et al., JAMA, 2008</p>
                  </div>
                ),
              },
              {
                id: 'claims', label: 'איך לקרוא את הסימונים', content: (
                  <div className="stack" style={{ gap: 8 }}>
                    <p style={{ margin: 0 }}><Claim type="tradition" /> מה שכתוב בטקסטים הקלאסיים. <Claim type="assessment" /> פרשנות, התאמה לישראל או ספים של האפליקציה. <Claim type="research" /> נבדק במחקר, גם כשהמחקר קטן. <Claim type="none" /> לא נמצא מחקר.</p>
                    <ClaimMeter />
                  </div>
                ),
              },
              {
                id: 'sources', label: 'מקורות', content: (
                  <ul className="list-plain small">
                    <li>צ׳ראקה סמהיטה (Charaka Samhita), דרך <a href="https://www.carakasamhitaonline.com" target="_blank" rel="noreferrer">carakasamhitaonline.com</a></li>
                    <li>סושרוטה סמהיטה (Sushruta Samhita) · אשטאנגה הרידאיה (Ashtanga Hridaya), ואגבהטה</li>
                    <li>"ללכת עם הטבע: איורוודה למתחילים", שיבננדה יוגה מטע, 2021. <a href="#/library/article">הטענות שסומנו כהערכה</a></li>
                    <li><a href={NCCIH} target="_blank" rel="noreferrer">NCCIH: Ayurvedic Medicine In Depth</a></li>
                    <li>Prasher B. et al., J. Translational Medicine, 2008 · Govindaraj P. et al., Scientific Reports, 2015</li>
                  </ul>
                ),
              },
              { id: 'privacy', label: 'פרטיות', content: <p style={{ margin: 0 }}>תוצאות השאלונים נשמרות במכשיר בלבד. שאלות ליועצת נשלחות לשרת כדי לקבל תשובה, ואינן נשמרות באפליקציה.</p> },
            ]}
          /></div>
        </div>
        <div className="stage">
          <h2 style={{ fontSize: 'clamp(24px, 2.4vw, 34px)', margin: 0 }}>איך היועצת בודקת כל הודעה</h2>
          <SafetyFlow />
        </div>
      </div>
    </div>
  );
}
