// נתונים להמחשות. כל שיוך כאן מסומן במקורו: מסורת או הערכה.

// צבעי הדושות כמשתני CSS, כך שהם מתחלפים בין מצב בהיר לכהה.
export const DOSHA_COLOR = { vata: 'var(--vata)', pitta: 'var(--pitta)', kapha: 'var(--kapha)' };
export const DOSHA_TINT = { vata: 'var(--vata-tint, var(--vata))', pitta: 'var(--pitta-tint, var(--pitta))', kapha: 'var(--kapha-tint, var(--kapha))' };

export const ELEMENTS = [
  { id: 'space', name: 'חלל', sk: 'Akasha', color: '#5E6E86', doshas: ['vata'] },
  { id: 'air', name: 'אוויר', sk: 'Vayu', color: '#7FA8B0', doshas: ['vata'] },
  { id: 'fire', name: 'אש', sk: 'Tejas', color: '#C2622E', doshas: ['pitta'] },
  { id: 'water', name: 'מים', sk: 'Ap', color: '#3C7389', doshas: ['pitta', 'kapha'] },
  { id: 'earth', name: 'אדמה', sk: 'Prithvi', color: '#7A5B3A', doshas: ['kapha'] },
];

// עשרה זוגות איכויות (Gurvadi Guna)
export const GUNA_PAIRS = [
  { id: 'weight', a: { k: 'heavy', t: 'כבד' }, b: { k: 'light', t: 'קל' } },
  { id: 'temp', a: { k: 'cold', t: 'קר' }, b: { k: 'hot', t: 'חם' } },
  { id: 'moist', a: { k: 'oily', t: 'שמנוני' }, b: { k: 'dry', t: 'יבש' } },
  { id: 'pace', a: { k: 'slow', t: 'איטי' }, b: { k: 'sharp', t: 'חד' } },
  { id: 'motion', a: { k: 'stable', t: 'יציב' }, b: { k: 'mobile', t: 'נייד' } },
  { id: 'firm', a: { k: 'soft', t: 'רך' }, b: { k: 'hard', t: 'קשה' } },
  { id: 'clarity', a: { k: 'sticky', t: 'דביק' }, b: { k: 'clear', t: 'צלול' } },
  { id: 'texture', a: { k: 'smooth', t: 'חלק' }, b: { k: 'rough', t: 'מחוספס' } },
  { id: 'size', a: { k: 'gross', t: 'גס' }, b: { k: 'subtle', t: 'עדין' } },
  { id: 'density', a: { k: 'dense', t: 'דחוס' }, b: { k: 'liquid', t: 'נוזלי' } },
];

// איכויות הדושות לפי צ'ראקה, סוטרה סתהאנה 1, ואשטאנגה הרידאיה, סוטרה סתהאנה 1 (מסורת)
export const DOSHA_GUNAS = {
  vata: ['light', 'cold', 'dry', 'rough', 'subtle', 'mobile', 'clear'],
  pitta: ['hot', 'sharp', 'light', 'oily', 'liquid', 'mobile'],
  kapha: ['heavy', 'cold', 'oily', 'slow', 'smooth', 'sticky', 'stable', 'soft'],
};

const OPPOSITE = Object.fromEntries(GUNA_PAIRS.flatMap((p) => [[p.a.k, p.b.k], [p.b.k, p.a.k]]));
export const GUNA_NAME = Object.fromEntries(GUNA_PAIRS.flatMap((p) => [[p.a.k, p.a.t], [p.b.k, p.b.t]]));

// השפעה של קבוצת איכויות על כל דושה: הדומה מגביר (+1), ההפך מאזן (-1)
export function gunaEffect(qualities) {
  const out = {};
  for (const [d, list] of Object.entries(DOSHA_GUNAS)) {
    const same = qualities.filter((q) => list.includes(q));
    const opposite = qualities.filter((q) => list.includes(OPPOSITE[q]));
    out[d] = { score: same.length - opposite.length, same, opposite };
  }
  return out;
}

// השיוך של איכויות לחוויות מודרניות הוא הערכה, לפי עיקרון המסורת
export const GUNA_PRESETS = [
  { id: 'icecream', t: 'גלידה', q: ['cold', 'heavy', 'oily', 'smooth', 'sticky'] },
  { id: 'soup', t: 'מרק ירקות חם', q: ['hot', 'liquid', 'soft', 'light'] },
  { id: 'crackers', t: 'פריכיות', q: ['dry', 'light', 'rough', 'hard'] },
  { id: 'wind', t: 'רוח קרה בחורף', q: ['cold', 'dry', 'mobile', 'rough'] },
  { id: 'sharav', t: 'יום שרב', q: ['hot', 'sharp', 'dry'] },
  { id: 'spicy', t: 'אוכל חריף', q: ['hot', 'sharp', 'light'] },
  { id: 'nap', t: 'שינה בצהריים', q: ['heavy', 'slow', 'stable'] },
  { id: 'run', t: 'ריצה', q: ['light', 'mobile', 'hot'] },
  { id: 'massage', t: 'עיסוי בשמן חם', q: ['oily', 'hot', 'heavy', 'smooth', 'stable'] },
  { id: 'travel', t: 'טיסה ארוכה', q: ['dry', 'mobile', 'light', 'cold'] },
];

// שעון הדושות (מסורת). שעות בקירוב.
export const CLOCK = [
  { from: 2, to: 6, d: 'vata' },
  { from: 6, to: 10, d: 'kapha' },
  { from: 10, to: 14, d: 'pitta' },
  { from: 14, to: 18, d: 'vata' },
  { from: 18, to: 22, d: 'kapha' },
  { from: 22, to: 26, d: 'pitta' },
];

export const CLOCK_TEXT = {
  vata: 'תנועה, קלילות ויצירה. בלילה: שינה קלה.',
  pitta: 'אש העיכול בשיאה. בלילה: הגוף מעבד ומעכל.',
  kapha: 'כבדות ויציבות. טוב לפעילות, פחות לשינה.',
};

export const ROUTINE_MARKS = [
  { h: 5.5, t: 'קימה' },
  { h: 12.5, t: 'ארוחה עיקרית' },
  { h: 21.75, t: 'שינה' },
];

export const dosha24 = (h) => CLOCK.find((c) => (h >= c.from && h < c.to) || (h + 24 >= c.from && h + 24 < c.to)).d;

// עונות בישראל: התאמה פרשנית (הערכה), לא שש העונות ההודיות
export const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
export const MONTH_DOSHA = ['vata', 'kapha', 'kapha', 'kapha', 'kapha', 'pitta', 'pitta', 'pitta', 'pitta', 'vata', 'vata', 'vata'];
export const SEASON_TEXT = {
  vata: 'סוף הסתיו והחורף: קר, יבש ורוחני. ואטה נוטה לעלות.',
  pitta: 'הקיץ: חם ובהיר. פיטה נוטה לעלות.',
  kapha: 'סוף החורף והאביב: לח וכבד. קאפה נוטה לעלות.',
};

export const DHATUS = [
  { sk: 'Rasa', t: 'ראסה', he: 'נוזל התזונה' },
  { sk: 'Rakta', t: 'רקטה', he: 'דם' },
  { sk: 'Mamsa', t: 'מאמסה', he: 'שריר' },
  { sk: 'Meda', t: 'מדה', he: 'שומן' },
  { sk: 'Asthi', t: 'אסתי', he: 'עצם' },
  { sk: 'Majja', t: 'מאג׳ה', he: 'מח ועצבים' },
  { sk: 'Shukra', t: 'שוקרה', he: 'רקמת הרבייה' },
];

export const AGNI_STATES = [
  { id: 'sama', t: 'סמה', sk: 'Sama', he: 'מאוזן', d: null, text: 'להבה יציבה. תיאבון סדיר ועיכול טוב.' },
  { id: 'vishama', t: 'וישמה', sk: 'Vishama', he: 'לא סדיר', d: 'vata', text: 'להבה מהבהבת. תיאבון משתנה, גזים.' },
  { id: 'tikshna', t: 'טיקשנה', sk: 'Tikshna', he: 'חד מדי', d: 'pitta', text: 'להבה גבוהה וחדה. רעב חזק, צרבת.' },
  { id: 'manda', t: 'מנדה', sk: 'Manda', he: 'איטי', d: 'kapha', text: 'להבה קטנה ועמומה. כבדות אחרי אוכל.' },
];

// קשרים במפת הידע
export const CONCEPT_LINKS = [
  ['mahabhuta', 'dosha'], ['mahabhuta', 'gunas'], ['gunas', 'dosha'],
  ['dosha', 'vata'], ['dosha', 'pitta'], ['dosha', 'kapha'],
  ['vata', 'prakriti'], ['pitta', 'prakriti'], ['kapha', 'prakriti'],
  ['prakriti', 'vikriti'], ['vikriti', 'dinacharya'], ['vikriti', 'ritucharya'],
  ['pitta', 'agni'], ['agni', 'ama'], ['agni', 'dhatu'], ['dhatu', 'mala'], ['ama', 'mala'],
  ['dinacharya', 'ritucharya'], ['life-stages', 'vikriti'], ['life-stages', 'dosha'],
  ['ritucharya', 'dosha'], ['sources', 'article'], ['sources', 'prakriti'], ['article', 'dosha'], ['gunas', 'dinacharya'],
];

export const GROUP_COLOR = {
  foundations: 'var(--brass)',
  doshas: 'var(--pitta)',
  person: 'var(--vata)',
  routine: 'var(--kapha)',
  sources: 'var(--muted)',
};
