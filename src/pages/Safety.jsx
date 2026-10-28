import { WARNING_SIGNS } from '../data/vikriti.js';
import { Claim } from '../components/Shell.jsx';

const LIMITS = [
  'אין איבחון מחלות. "איבחון" כאן פירושו תיאור של החוקה ושל האיזון הנוכחי כדפוס בלבד.',
  'אין מינונים של צמחים, תוספים או תכשירים.',
  'אין המלצה להפסיק או להחליף תרופה. בכל שאלה על תרופה, פנו לרופא או לרוקח.',
  'בהריון, בהנקה, בילדים, בגיל מבוגר, במחלה אוטואימונית, בסוכרת, בלחץ דם ובנטילת מדללי דם: כל שימוש בצמחים רק אחרי התייעצות עם רופא.',
  'ההמלצות באפליקציה נוגעות לאורח חיים בלבד: תזונה, שגרה יומית, עונתיות, שינה ופעילות.',
];

export default function Safety() {
  return (
    <div className="stack" style={{ maxWidth: 780 }}>
      <div>
        <div className="eyebrow">בטיחות ומקורות</div>
        <h1>מה האפליקציה עושה, ומה לא</h1>
      </div>

      <div className="alert">
        <p style={{ marginTop: 0 }}><strong>סימנים שמחייבים רופא מיד:</strong></p>
        <ul className="list-plain">
          {WARNING_SIGNS.map((w) => <li key={w}>{w}</li>)}
        </ul>
        <p style={{ marginBottom: 0 }}>
          מד"א <b>101</b> · מספר החירום <b>112</b> · ער"ן, למצוקה נפשית או מחשבות אובדניות <b>1201</b>
        </p>
      </div>

      <div className="stone">
        <h2>גבולות</h2>
        <ul className="list-plain">
          {LIMITS.map((l) => <li key={l}>{l}</li>)}
        </ul>
      </div>

      <div className="stone">
        <h2>איך לקרוא את הסימונים</h2>
        <p><Claim type="tradition" /> מה שכתוב בטקסטים הקלאסיים. זה תיאור של שיטה, לא הוכחה.</p>
        <p><Claim type="assessment" /> פרשנות: התאמה לישראל, ספים שנקבעו לאפליקציה, או ביקורת על טענה.</p>
        <p><Claim type="research" /> נבדק במחקר. מצוין גם כשהמחקר מוקדם או קטן.</p>
        <p style={{ marginBottom: 0 }}><Claim type="none" /> לא נמצא מחקר שבדק את הטענה.</p>
      </div>

      <div className="stone">
        <h2>מקורות</h2>
        <ul className="list-plain">
          <li>צ׳ראקה סמהיטה (Charaka Samhita)</li>
          <li>סושרוטה סמהיטה (Sushruta Samhita)</li>
          <li>אשטאנגה הרידאיה (Ashtanga Hridaya), ואגבהטה</li>
          <li>"ללכת עם הטבע: איורוודה למתחילים", שיבננדה יוגה מטע (Sivananda Yoga Vedanta Centres), 2021. <a href="#/library/article">הטענות שסומנו כהערכה</a></li>
          <li>Prasher B. et al., Journal of Translational Medicine, 2008: ביטוי גנים בחוקות קיצוניות</li>
          <li>Govindaraj P. et al., Scientific Reports, 2015: ניתוח גנומי של סוגי חוקה</li>
        </ul>
      </div>

      <div className="note">
        פרטיות: תוצאות השאלונים נשמרות במכשיר בלבד. שאלות ליועצת נשלחות לשרת כדי לקבל תשובה, ואינן נשמרות באפליקציה.
      </div>
    </div>
  );
}
