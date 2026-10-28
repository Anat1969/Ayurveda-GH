import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { screen, blockingReply } from '../../src/lib/safety.js';
import { CONSULTANT_PROMPT } from '../../src/lib/consultantPrompt.js';
import { RECOMMENDATIONS } from '../../src/data/recommendations.js';

const cases = [
  ['יש לי כאב בחזה כבר שעה', 'emergency'],
  ['ראיתי דם בצואה', 'emergency'],
  ['יש לי קוצר נשימה', 'emergency'],
  ['פתאום חולשה בצד שמאל של הגוף', 'emergency'],
  ['יש לי חום כבר שבוע', 'emergency'],
  ['אני לא רוצה לחיות יותר', 'crisis'],
  ['חושבת להתאבד', 'crisis'],
  ['מה המינון של אשווגנדה?', 'caution'],
  ['אפשר להפסיק את התרופה ללחץ דם?', 'caution'],
  ['אני בהריון, מה מתאים לי?', 'caution'],
  ['מה זה ואטה?', 'none'],
  ['איך נראית שגרת בוקר?', 'none'],
  ['אני אוהבת קפה בבוקר', 'none'],
];

for (const [text, level] of cases) {
  test(`screen: ${text}`, () => assert.equal(screen(text).level, level));
}

test('medication question gets the pharmacist notice', () => {
  const r = screen('אני לוקחת תרופה לסוכרת');
  assert.ok(r.hits.some((h) => h.kind === 'medication'));
  assert.ok(r.hits.some((h) => h.kind === 'risk-group'));
});

test('crisis reply includes ERAN 1201, emergency reply includes 101', () => {
  assert.match(blockingReply(screen('אין טעם לחיות')), /1201/);
  assert.match(blockingReply(screen('כאב בחזה')), /101/);
  assert.equal(blockingReply(screen('מה זה פיטה')), null);
});

test('consultant prompt matches docs/consultant-system-prompt.md', () => {
  const md = fs.readFileSync('docs/consultant-system-prompt.md', 'utf8');
  assert.equal(CONSULTANT_PROMPT, md.split(/\n---\n/)[1].trim());
});

test('recommendations contain no herbs or dosages', () => {
  const text = JSON.stringify(RECOMMENDATIONS);
  for (const w of ['מ"ג', 'מינון', 'כפית', 'אשווגנדה', 'טריפלה', 'כורכום', 'תוסף']) assert.ok(!text.includes(w), w);
});
