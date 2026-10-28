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
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="sm1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F3C06A" /><stop offset="1" stopColor="#E8A33D" /></linearGradient>
        <linearGradient id="sm2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F6A877" /><stop offset="1" stopColor="#F08A4B" /></linearGradient>
        <linearGradient id="sm3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4FB0C0" /><stop offset="1" stopColor="#1F8A9E" /></linearGradient>
      </defs>
      <ellipse cx="32" cy="15" rx="11" ry="8" fill="url(#sm1)" />
      <ellipse cx="32" cy="31" rx="16" ry="9" fill="url(#sm2)" />
      <ellipse cx="32" cy="50" rx="22" ry="11" fill="url(#sm3)" />
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
