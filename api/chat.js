// יועץ השיחה. פונקציית שרת ב-Vercel.
// סדר הטיפול: מסנן בטיחות דטרמיניסטי, ורק אחריו המודל.
import Anthropic from '@anthropic-ai/sdk';
import { CONSULTANT_PROMPT } from '../src/lib/consultantPrompt.js';
import { screen, blockingReply, safetyAddendum } from '../src/lib/safety.js';

const MODEL = 'claude-opus-5-5';
const MAX_TURNS = 12;
const MAX_CHARS = 2000;

const APP_CONTEXT = `

## הקשר האפליקציה
- האפליקציה כוללת ספריית מושגים, שאלון חוקה (פרקרוטי) ושאלון איזון נוכחי (ויקרוטי). כשמתאים, הפני אליהם.
- התשובה מוצגת כטקסט רגיל. בלי טבלאות ובלי כותרות. מותר להדגיש סוג טענה בכוכביות כפולות, למשל **מסורת**.
- תשובה קצרה: עד 150 מילים, אלא אם התבקש פירוט.`;

function cleanMessages(raw) {
  if (!Array.isArray(raw)) return [];
  const msgs = raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
    .slice(-MAX_TURNS);
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  return msgs;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const messages = cleanMessages(body.messages);
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user') {
    res.status(400).json({ error: 'no_user_message' });
    return;
  }

  const safety = screen(last.content);
  const blocked = blockingReply(safety);
  if (blocked) {
    res.status(200).json({ reply: blocked, mode: 'safety', safety });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: 'no_key', safety });
    return;
  }

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: [
        { type: 'text', text: CONSULTANT_PROMPT + APP_CONTEXT, cache_control: { type: 'ephemeral' } },
        ...(safety.hits.length ? [{ type: 'text', text: safetyAddendum(safety) }] : []),
      ],
      messages,
    });

    if (response.stop_reason === 'refusal') {
      res.status(200).json({
        reply: 'על השאלה הזו אני לא יכולה לענות. אפשר לשאול על מושגים, על החוקה או על שגרה יומית.',
        mode: 'refusal',
        safety,
      });
      return;
    }
    const reply = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    res.status(200).json({ reply, mode: 'model', safety });
  } catch (err) {
    const status = err instanceof Anthropic.RateLimitError ? 429 : err instanceof Anthropic.APIError ? 502 : 500;
    console.error('chat error', status, err?.message);
    res.status(status).json({ error: status === 429 ? 'busy' : 'upstream', safety });
  }
}
