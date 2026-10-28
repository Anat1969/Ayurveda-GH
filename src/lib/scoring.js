export const DOSHAS = ['vata', 'pitta', 'kapha'];

const round = (n) => Math.round(n);

// חוקה: אחוז התשובות לכל דושה מתוך התשובות שנענו.
export function scorePrakriti(answers, questions) {
  const counts = { vata: 0, pitta: 0, kapha: 0 };
  let answered = 0;
  for (const q of questions) {
    const d = answers[q.id];
    if (d && counts[d] !== undefined) {
      counts[d] += 1;
      answered += 1;
    }
  }
  const pct = {};
  for (const d of DOSHAS) pct[d] = answered ? round((counts[d] / answered) * 100) : 0;
  const sorted = [...DOSHAS].sort((a, b) => pct[b] - pct[a]);
  const [first, second, third] = sorted;

  let type;
  let margin;
  if (pct[first] - pct[third] < 12) {
    type = [first, second, third];
    margin = 0;
  } else if (pct[first] - pct[second] < 10) {
    type = [first, second];
    margin = pct[second] - pct[third];
  } else {
    type = [first];
    margin = pct[first] - pct[second];
  }

  const coverage = questions.length ? answered / questions.length : 0;
  let confidence = 'low';
  if (type.length === 3) confidence = coverage >= 0.85 ? 'medium' : 'low';
  else if (coverage >= 0.85 && margin >= 15) confidence = 'high';
  else if (coverage >= 0.6 && margin >= 8) confidence = 'medium';

  return { pct, counts, answered, total: questions.length, coverage, type, margin, confidence };
}

// יציבות בין שתי מדידות חוקה: חצי סכום ההפרשים, 0 עד 100.
export function prakritiDrift(a, b) {
  if (!a || !b) return null;
  const diff = DOSHAS.reduce((s, d) => s + Math.abs((a[d] || 0) - (b[d] || 0)), 0) / 2;
  const level = diff <= 15 ? 'stable' : diff <= 30 ? 'shifted' : 'unstable';
  return { diff: round(diff), level };
}

// איזון נוכחי: אחוז העוצמה מתוך המקסימום האפשרי לכל דושה.
export function scoreVikriti(ratings, items) {
  const sum = { vata: 0, pitta: 0, kapha: 0 };
  const max = { vata: 0, pitta: 0, kapha: 0 };
  let answered = 0;
  for (const it of items) {
    max[it.d] += 3;
    const r = ratings[it.id];
    if (typeof r === 'number') {
      sum[it.d] += r;
      answered += 1;
    }
  }
  const pct = {};
  for (const d of DOSHAS) pct[d] = max[d] ? round((sum[d] / max[d]) * 100) : 0;
  const sorted = [...DOSHAS].sort((a, b) => pct[b] - pct[a]);
  const elevated = sorted.filter((d) => pct[d] >= 40);
  const calm = pct[sorted[0]] < 20;
  return { pct, answered, total: items.length, elevated, calm, top: sorted[0] };
}

export const CONFIDENCE_TEXT = {
  high: 'ברורה',
  medium: 'בינונית',
  low: 'נמוכה',
};

export const DRIFT_TEXT = {
  stable: 'יציבה: דומה למדידה הקודמת',
  shifted: 'השתנתה במידה: כדאי לבדוק אם עניתם לפי ההווה ולא לפי רוב החיים',
  unstable: 'שונה מאוד מהמדידה הקודמת: התוצאה פחות אמינה',
};
