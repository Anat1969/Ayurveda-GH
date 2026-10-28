import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../api/chat.js';

function call(body, method = 'POST') {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      json(data) { resolve({ status: this.statusCode, data }); },
    };
    handler({ method, body }, res);
  });
}

test('rejects GET', async () => {
  assert.equal((await call({}, 'GET')).status, 405);
});

test('emergency is answered without the model', async () => {
  const r = await call({ messages: [{ role: 'user', content: 'יש לי כאב בחזה' }] });
  assert.equal(r.status, 200);
  assert.equal(r.data.mode, 'safety');
  assert.match(r.data.reply, /101/);
});

test('without an API key the client is told to use basic mode', async () => {
  const saved = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  const r = await call({ messages: [{ role: 'user', content: 'מה זה ואטה?' }] });
  assert.equal(r.status, 503);
  assert.equal(r.data.error, 'no_key');
  if (saved) process.env.ANTHROPIC_API_KEY = saved;
});
