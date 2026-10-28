// יועץ בסיסי, בלי מודל שפה: מוצא מושג מתאים בספרייה ומחזיר את ההסבר שלו.
import { CONCEPTS, CLAIM } from '../data/concepts.js';

const ALIASES = {
  vata: ['ואטה', 'וטה', 'vata'],
  pitta: ['פיטה', 'פיטא', 'pitta'],
  kapha: ['קאפה', 'kapha'],
  prakriti: ['חוקה', 'פרקרוטי', 'פרקריטי', 'prakriti'],
  vikriti: ['ויקרוטי', 'ויקריטי', 'איזון נוכחי', 'vikriti'],
  agni: ['אגני', 'עיכול', 'agni'],
  ama: ['אמה', 'ama', 'שאריות'],
  dinacharya: ['שגרה יומית', 'דינצריה', 'דינצ׳ריה', 'בוקר', 'שינה'],
  ritucharya: ['עונה', 'עונתי', 'ריטוצריה', 'קיץ', 'חורף'],
  mahabhuta: ['יסודות', 'יסוד', 'מהבהוטה'],
  gunas: ['איכויות', 'גונה', 'גונות'],
  dhatu: ['רקמות', 'דהאטו', 'דאטו'],
  dosha: ['דושה', 'דושות', 'dosha'],
  sources: ['צראקה', 'צ׳ראקה', 'סושרוטה', 'טקסט', 'מקור'],
};

export function localAnswer(text) {
  const t = String(text || '').toLowerCase();
  const hits = Object.entries(ALIASES)
    .filter(([, words]) => words.some((w) => t.includes(w)))
    .map(([id]) => CONCEPTS.find((c) => c.id === id))
    .filter(Boolean);
  if (!hits.length) {
    return {
      text: 'במצב הבסיסי אני עונה מתוך ספריית המושגים. נסו לשאול על דושה (ואטה, פיטה או קאפה), על חוקה, על אגני או על שגרה יומית.',
      links: [{ label: 'לספרייה', href: '#/library' }],
    };
  }
  const c = hits[0];
  const tradition = c.sections.find((s) => s.claim === 'tradition');
  const other = c.sections.find((s) => s.claim !== 'tradition');
  const parts = [`${c.term} (${c.sanskrit}): ${c.short}`];
  if (tradition) parts.push(`**${CLAIM.tradition}**: ${tradition.text}`);
  if (other) parts.push(`**${CLAIM[other.claim]}**: ${other.text}`);
  return { text: parts.join('\n\n'), links: hits.slice(0, 3).map((h) => ({ label: h.term, href: `#/library/${h.id}` })) };
}
