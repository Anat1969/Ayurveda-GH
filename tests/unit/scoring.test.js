import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scorePrakriti, scoreVikriti, prakritiDrift } from '../../src/lib/scoring.js';
import { PRAKRITI_QUESTIONS } from '../../src/data/prakriti.js';
import { VIKRITI_ITEMS } from '../../src/data/vikriti.js';

const all = (d) => Object.fromEntries(PRAKRITI_QUESTIONS.map((q) => [q.id, d]));

test('every prakriti question offers each dosha exactly once', () => {
  for (const q of PRAKRITI_QUESTIONS) {
    assert.deepEqual(q.options.map((o) => o.d).sort(), ['kapha', 'pitta', 'vata'], q.id);
  }
});

test('single-dosha answers give a clear single type', () => {
  const r = scorePrakriti(all('pitta'), PRAKRITI_QUESTIONS);
  assert.deepEqual(r.type, ['pitta']);
  assert.equal(r.pct.pitta, 100);
  assert.equal(r.confidence, 'high');
});

test('close split gives a dual type', () => {
  const ids = PRAKRITI_QUESTIONS.map((q) => q.id);
  const answers = Object.fromEntries(ids.map((id, i) => [id, i % 2 ? 'vata' : 'kapha']));
  const r = scorePrakriti(answers, PRAKRITI_QUESTIONS);
  assert.equal(r.type.length, 2);
  assert.ok(r.type.includes('vata') && r.type.includes('kapha'));
});

test('few answers mean low confidence', () => {
  const r = scorePrakriti({ frame: 'vata', weight: 'vata' }, PRAKRITI_QUESTIONS);
  assert.equal(r.confidence, 'low');
  assert.equal(r.answered, 2);
});

test('drift measures stability between runs', () => {
  assert.equal(prakritiDrift({ vata: 50, pitta: 30, kapha: 20 }, { vata: 45, pitta: 35, kapha: 20 }).level, 'stable');
  assert.equal(prakritiDrift({ vata: 80, pitta: 10, kapha: 10 }, { vata: 10, pitta: 10, kapha: 80 }).level, 'unstable');
});

test('vikriti finds the elevated dosha and calm state', () => {
  const pitta = Object.fromEntries(VIKRITI_ITEMS.map((i) => [i.id, i.d === 'pitta' ? 3 : 0]));
  const r = scoreVikriti(pitta, VIKRITI_ITEMS);
  assert.deepEqual(r.elevated, ['pitta']);
  assert.equal(r.calm, false);
  const calm = scoreVikriti(Object.fromEntries(VIKRITI_ITEMS.map((i) => [i.id, 0])), VIKRITI_ITEMS);
  assert.equal(calm.calm, true);
});
