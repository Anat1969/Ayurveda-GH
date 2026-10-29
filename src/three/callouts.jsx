import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// תוויות של איור מדעי: הטקסט יושב בשוליים, אף פעם לא על הגרפיקה.
// מכל תווית יוצא קו הובלה דק אל הנקודה בגוף, כמו בלוח של אטלס אנטומי.

// צבע מודפס לכל צבע הולוגרמה: קריא על הנייר הבהיר של השוליים
const PRINT = {
  '#7FD3FF': '#2E6672', '#5BB8F0': '#2E6672', '#FF9A4D': '#9C4720', '#FF8040': '#9C4720', '#7DE3A2': '#41693A', '#5ED68E': '#41693A',
  '#EBC47E': '#7A5E2A', '#FF6B5E': '#A8322A', '#EAF4FF': '#1F3326', '#FFB25A': '#B4581A', '#9DB4C4': '#5C5446', '#6B93AC': '#3F5A6B',
  '#FF5E4D': '#A8322A', '#3FA9F5': '#1F5F8B', '#3FC3E8': '#1F6F86', '#FFB03A': '#9A6110', '#FF7A2E': '#A4481A', '#D9673A': '#8E3F22',
};
export const printTone = (t) => PRINT[(t || '').toUpperCase()] || PRINT[t] || '#1F3326';

export function createCalloutStore() {
  const items = new Map();
  const subs = new Set();
  let version = 0;
  return {
    items,
    set(id, data) {
      const prev = items.get(id);
      const changed = !prev || ['title', 'sub', 'tone', 'active', 'size', 'side'].some((k) => prev[k] !== data[k]) || Boolean(prev.onClick) !== Boolean(data.onClick);
      items.set(id, { ...prev, ...data });
      if (changed) { version += 1; subs.forEach((f) => f()); }
    },
    remove(id) { if (items.delete(id)) { version += 1; subs.forEach((f) => f()); } },
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
    getVersion() { return version; },
  };
}
export const CalloutCtx = createContext(null);

let uid = 0;
// בתוך הסצנה: נקודת עיגון שמוקרנת למסך בכל פריים
export function CalloutAnchor({ position = [0, 0, 0], title, sub, tone, active, size = 'm', side, onClick }) {
  const store = useContext(CalloutCtx);
  const id = useMemo(() => `c${(uid += 1)}`, []);
  const ref = useRef();
  const v = useMemo(() => new THREE.Vector3(), []);
  const { camera, size: px } = useThree();
  useLayoutEffect(() => {
    store?.set(id, { title, sub, tone, active, size, side, onClick });
  }, [title, sub, tone, active, size, side, onClick]);
  useEffect(() => () => store?.remove(id), []);
  useFrame(() => {
    if (!store || !ref.current) return;
    ref.current.getWorldPosition(v);
    v.project(camera);
    const it = store.items.get(id);
    if (!it) return;
    it.sx = ((v.x + 1) / 2) * px.width;
    it.sy = ((1 - v.y) / 2) * px.height;
    it.behind = v.z > 1;
  });
  return <group ref={ref} position={position} />;
}

// מחוץ לסצנה: העמודות בשוליים, וקווי ההובלה
export function Callouts({ store, stageRef }) {
  useSyncExternalStore(store.subscribe, store.getVersion);
  const svgRef = useRef();
  const els = useRef(new Map());
  const list = [...store.items.entries()];

  useEffect(() => {
    let raf = 0;
    let lastLayout = 0;
    const sides = new Map();
    const placed = new Map();
    const tick = (t) => {
      raf = requestAnimationFrame(tick);
      const stage = stageRef.current;
      const canvas = stage?.querySelector('canvas');
      const svg = svgRef.current;
      if (!stage || !canvas || !svg) return;
      const sr = stage.getBoundingClientRect();
      const cr = canvas.getBoundingClientRect();
      const cl = cr.left - sr.left;
      const ct = cr.top - sr.top;
      const narrow = stage.classList.contains('callouts-numbered');
      const W = sr.width;
      const H = sr.height;
      const colL = cl;
      const colR = cl + cr.width;
      // פריסה: כל 200 מילישניות, צד לכל תווית, ואין תוויות שעולות זו על זו
      if (t - lastLayout > 200) {
        lastLayout = t;
        const groups = { left: [], right: [] };
        for (const [id, it] of store.items) {
          if (it.sx === undefined) continue;
          let s = it.side || sides.get(id);
          if (!it.side) {
            const x = it.sx / cr.width;
            if (!s) s = x < 0.5 ? 'left' : 'right';
            else if (s === 'left' && x > 0.6) s = 'right';
            else if (s === 'right' && x < 0.4) s = 'left';
          }
          sides.set(id, s);
          const el = els.current.get(id);
          if (el) groups[s].push({ id, y: ct + it.sy, h: el.offsetHeight || 36 });
        }
        for (const s of ['left', 'right']) {
          const g = groups[s].sort((a, b) => a.y - b.y);
          let y = 6;
          for (const it of g) { it.top = Math.max(it.y - it.h / 2, y); y = it.top + it.h + 10; }
          let over = y - 10 - (H - 6);
          for (let i = g.length - 1; i >= 0 && over > 0; i--) {
            const room = i ? g[i].top - (g[i - 1].top + g[i - 1].h + 10) : g[i].top - 6;
            const mv = Math.min(over, Math.max(room, 0));
            for (let k = i; k < g.length; k++) g[k].top -= mv;
            over -= mv;
          }
          for (const it of g) {
            placed.set(it.id, { side: s, top: Math.max(4, it.top), h: it.h });
            const el = els.current.get(it.id);
            if (el && !narrow) {
              el.dataset.side = s;
              el.style.transform = `translateY(${Math.round(Math.max(4, it.top))}px)`;
              el.style.width = `${Math.max(colL - 18, 90)}px`;
              if (s === 'left') { el.style.left = '6px'; el.style.right = ''; el.style.textAlign = 'right'; } else { el.style.left = `${colR + 12}px`; el.style.right = ''; el.style.textAlign = 'left'; }
            }
          }
        }
      }
      // קווים: בכל פריים, מהנקודה בגוף אל קצה התווית
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      for (const [id, it] of store.items) {
        const g = svg.querySelector(`[data-id="${id}"]`);
        if (!g) continue;
        const p = placed.get(id);
        const ax = cl + (it.sx ?? 0);
        const ay = ct + (it.sy ?? 0);
        const show = it.sx !== undefined && !it.behind && (narrow || p);
        g.style.display = show ? '' : 'none';
        if (!show) continue;
        const dot = g.querySelector('circle');
        dot.setAttribute('cx', ax);
        dot.setAttribute('cy', ay);
        const num = g.querySelector('text');
        if (num) { num.setAttribute('x', ax); num.setAttribute('y', ay + 4); }
        const lines = g.querySelectorAll('path');
        if (narrow) { lines.forEach((l) => l.setAttribute('d', '')); continue; }
        const ex = p.side === 'left' ? colL - 6 : colR + 6;
        const ey = p.top + Math.min(p.h / 2, 14);
        const elbow = p.side === 'left' ? ex + 16 : ex - 16;
        const d = `M ${ax} ${ay} L ${elbow} ${ey} L ${ex} ${ey}`;
        lines.forEach((l) => l.setAttribute('d', d));
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [store]);

  return (
    <>
      <svg ref={svgRef} className="callout-lines" aria-hidden="true">
        {list.map(([id, it], i) => (
          <g key={id} data-id={id} className={it.active ? 'on' : ''}>
            <path className="halo" stroke={printTone(it.tone)} />
            <path className="core" stroke={it.tone || '#EAF4FF'} />
            <circle r={it.active ? 4.5 : 3.2} fill={it.tone || '#EAF4FF'} stroke={printTone(it.tone)} strokeWidth="1" />
            <text className="callout-num" textAnchor="middle">{i + 1}</text>
          </g>
        ))}
      </svg>
      <ol className="callouts">
        {list.map(([id, it], i) => (
          <li key={id} ref={(el) => (el ? els.current.set(id, el) : els.current.delete(id))}
            className={`callout callout-${it.size || 'm'} ${it.active ? 'on' : ''} ${it.onClick ? 'clickable' : ''}`}
            style={{ '--tone': printTone(it.tone) }} onClick={it.onClick} role={it.onClick ? 'button' : undefined}>
            <span className="callout-n mono">{i + 1}</span>
            <b>{it.title}</b>
            {it.sub && <span className="callout-sub">{it.sub}</span>}
          </li>
        ))}
      </ol>
    </>
  );
}
