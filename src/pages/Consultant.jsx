import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { screen, blockingReply } from '../lib/safety.js';
import { localAnswer } from '../lib/localConsultant.js';

const SUGGESTIONS = [
  'מה ההבדל בין חוקה לאיזון נוכחי?',
  'למה בקיץ ממליצים על מזון מקרר?',
  'מה זה אגני, ואיך המסורת מתארת עיכול חלש?',
  'איך נראית שגרת בוקר לפי האיורוודה?',
];

const MODE_TEXT = {
  idle: 'מוכנה',
  model: 'מחוברת למודל שפה',
  basic: 'מצב בסיסי: תשובות מתוך הספרייה',
  busy: 'חושבת',
};

// הדגשה של **סוג הטענה** בלבד. שאר הטקסט מוצג כמו שהוא.
function Rich({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <b key={i}>{part.slice(2, -2)}</b> : <span key={i}>{part}</span>,
  );
}

export default function Consultant() {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState('idle');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [items, busy]);

  const add = (...list) => setItems((prev) => [...prev, ...list]);

  async function send(text) {
    const content = text.trim();
    if (!content || busy) return;
    setDraft('');
    const userItem = { role: 'user', content };
    const history = [...items.filter((m) => m.role === 'user' || m.role === 'assistant'), userItem];
    add(userItem);

    const safety = screen(content);
    const blocked = blockingReply(safety);
    if (blocked) {
      add({ role: 'safety', content: blocked, level: safety.level });
      return;
    }
    if (safety.hits.length) add({ role: 'safety', content: safety.hits.map((h) => h.notice).join('\n\n'), level: 'caution' });

    if (mode === 'basic') {
      const a = localAnswer(content);
      add({ role: 'assistant', content: a.text, links: a.links });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.map(({ role, content: c }) => ({ role, content: c })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.reply) {
        setMode(data.mode === 'model' ? 'model' : mode);
        add({ role: data.mode === 'safety' ? 'safety' : 'assistant', content: data.reply });
      } else if (res.status === 429) {
        add({ role: 'assistant', content: 'יש עומס כרגע. נסו שוב בעוד דקה.' });
      } else {
        throw new Error(data.error || 'unavailable');
      }
    } catch {
      setMode('basic');
      const a = localAnswer(content);
      add({ role: 'assistant', content: a.text, links: a.links, note: 'היועצת המלאה לא זמינה כרגע, ולכן התשובה מתוך הספרייה.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ maxWidth: 780 }}>
      <div>
        <div className="eyebrow">יועצת איורוודה</div>
        <h1>שאלות על המסורת</h1>
        <p className="lead">
          היועצת מסבירה את האיורוודה הקלאסית ומסמנת כל טענה: מסורת, הערכה או עובדה מחקרית. היא לא מאבחנת, לא נותנת
          מינונים ולא ממליצה לשנות תרופות.
        </p>
        <div className="status" aria-live="polite">מצב: {busy ? MODE_TEXT.busy : MODE_TEXT[mode]}</div>
      </div>

      <div className="chat">
        <div className="messages" aria-live="polite">
          {items.length === 0 && (
            <div className="stone">
              <p style={{ marginTop: 0 }}>אפשר להתחיל מאחת השאלות האלה:</p>
              <div className="chips">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {items.map((m, i) => (
            <motion.div
              key={i}
              className={m.role === 'safety' ? 'msg safety alert' : `msg ${m.role}`}
              role={m.role === 'safety' ? 'alert' : undefined}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {m.note && <div className="status" style={{ marginBottom: 8 }}>{m.note}</div>}
              {m.role === 'safety' ? <strong style={{ fontWeight: 500 }}>{m.content}</strong> : <Rich text={m.content} />}
              {m.links && (
                <div className="links">
                  {m.links.map((l) => <a key={l.href} className="chip" href={l.href}>{l.label}</a>)}
                </div>
              )}
            </motion.div>
          ))}
          {busy && <div className="msg assistant muted">רגע, מנסחת תשובה</div>}
          <div ref={endRef} />
        </div>

        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <textarea
            aria-label="שאלה ליועצת"
            placeholder="מה תרצו לשאול?"
            value={draft}
            maxLength={2000}
            rows={1}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
          />
          <button className="btn warm" type="submit" disabled={busy || !draft.trim()}>שליחה</button>
        </form>
      </div>
      <p className="small muted">
        השיחה לא נשמרת באפליקציה. השאלות נשלחות לשרת לצורך מענה בלבד, ולכן אל תכתבו שם מלא, תעודת זהות או פרטים
        מזהים. במצב חירום: מד"א 101 או 112. במצוקה נפשית: ער"ן 1201.
      </p>
    </div>
  );
}
