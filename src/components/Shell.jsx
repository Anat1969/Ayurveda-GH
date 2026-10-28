import { useEffect, useRef } from 'react';
import { CLAIM } from '../data/concepts.js';
import { DOSHA } from '../data/recommendations.js';
import { DOSHAS } from '../lib/scoring.js';
import { clearResults } from '../lib/storage.js';

export const DEV_CHAT = 'https://claude.ai/code/session_018qeN17QgigYE2JRu1PLrNE';
export const RESEARCH = 'https://claude.ai/chat/4f50087b-5093-4ead-aca6-167d52e82657';

const NAV = [
  { page: 'journey', label: 'המסע' },
  { page: 'maps', label: 'מפות' },
  { page: 'library', label: 'ספרייה' },
  { page: 'prakriti', label: 'חוקה' },
  { page: 'vikriti', label: 'איזון נוכחי' },
  { page: 'consultant', label: 'יועץ' },
  { page: 'results', label: 'התוצאות שלי' },
];

export function StonesMark({ className = 'brand-stones' }) {
  // קערת פליז במבט מלמעלה, עם נקודת אור אחת
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="none" stroke="var(--brass)" strokeWidth="2" />
      <circle cx="32" cy="32" r="21" fill="none" stroke="var(--brass)" strokeWidth="1" opacity=".6" />
      <circle cx="32" cy="32" r="13" fill="none" stroke="var(--brass)" strokeWidth="1" opacity=".35" />
      <circle cx="44" cy="20" r="4" fill="var(--ember)" />
    </svg>
  );
}

export function TopBar({ route }) {
  const menuRef = useRef(null);
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    el.items = [
      {
        label: 'מחיקת כל התוצאות השמורות',
        onSelect: () => {
          if (confirm('למחוק את כל תוצאות השאלונים מהמכשיר הזה?')) clearResults();
        },
      },
    ];
  }, []);

  return (
    <header className="topbar">
      <div className="wrap topbar-inner">
        <a className="brand" href="#/" aria-label="יועץ איורוודה, לדף הבית">
          <StonesMark />
          יועץ איורוודה
        </a>
        <nav className="nav" aria-label="ניווט ראשי">
          {NAV.map((n) => (
            <a key={n.page} href={`#/${n.page}`} aria-current={route.page === n.page ? 'page' : undefined}>
              {n.label}
            </a>
          ))}
        </nav>
        <ai-menu ref={menuRef} chat={DEV_CHAT} research={RESEARCH}></ai-menu>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap stack" style={{ gap: 10 }}>
        <div className="row">
          <span>האפליקציה מסבירה מסורת. היא לא מאבחנת מחלות ולא מחליפה רופא.</span>
          <a href="#/safety">בטיחות ומקורות</a>
        </div>
        <div className="emergency" aria-label="מספרי חירום">
          <span>מד"א <b>101</b></span>
          <span>מספר החירום <b>112</b></span>
          <span>ער"ן, מצוקה נפשית <b>1201</b></span>
        </div>
      </div>
    </footer>
  );
}

export const Claim = ({ type }) => <span className={`claim ${type}`}>{CLAIM[type]}</span>;

export function DoshaBars({ pct }) {
  return (
    <div className="bars">
      {DOSHAS.map((d) => (
        <div key={d} className={`bar-row d-${d}`}>
          <span className="dosha-name">{DOSHA[d].name}</span>
          <div className="bar" role="img" aria-label={`${DOSHA[d].name} ${pct[d]} אחוז`}>
            <i style={{ width: `${Math.max(pct[d], 2)}%` }} />
          </div>
          <span className="mono">{pct[d]}%</span>
        </div>
      ))}
    </div>
  );
}

export const doshaList = (ds) => ds.map((d) => DOSHA[d].name).join(' ו');

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

// אור אחד וכתמי פריזמה: האור שעובר דרך הפריזמה התלויה בתמונת ההשראה.
const FLECKS = [
  { top: '14%', left: '62%', c: '#E8A33D', d: 0 },
  { top: '22%', left: '58%', c: '#E0874E', d: 2.2 },
  { top: '31%', left: '66%', c: '#8FAF7A', d: 4.1 },
  { top: '18%', left: '71%', c: '#A9C4C9', d: 6.3 },
  { top: '64%', left: '12%', c: '#C9A45C', d: 3.4 },
  { top: '72%', left: '18%', c: '#B48CC8', d: 8.2 },
  { top: '48%', left: '84%', c: '#E0874E', d: 10.5 },
];

export function Ambient() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="sun" />
      {FLECKS.map((f, i) => (
        <span key={i} className="fleck" style={{ top: f.top, left: f.left, background: f.c, animationDelay: `${f.d}s` }} />
      ))}
    </div>
  );
}

// אדים עולים מעל נקודה, כמו מהכוס בתמונה
export function Steam({ style, color = 'rgba(239,230,210,.8)' }) {
  return (
    <svg viewBox="0 0 60 120" style={{ position: 'absolute', width: 60, height: 120, color, pointerEvents: 'none', ...style }} aria-hidden="true">
      <path className="steam-line" d="M30 118 C 22 96 40 82 30 60 C 22 44 36 30 30 8" />
      <path className="steam-line" style={{ animationDelay: '2.4s' }} d="M36 118 C 46 98 26 84 38 64 C 46 50 32 36 38 16" />
      <path className="steam-line" style={{ animationDelay: '4.6s' }} d="M24 118 C 16 100 30 88 22 70" />
    </svg>
  );
}
