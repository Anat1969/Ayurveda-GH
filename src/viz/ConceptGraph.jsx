import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CONCEPTS, GROUPS } from '../data/concepts.js';
import { CONCEPT_LINKS, GROUP_COLOR } from '../data/viz.js';
import { go } from '../lib/router.js';

const W = 640;
const H = 480;
const ANCHOR = {
  foundations: [W * 0.78, H * 0.22],
  doshas: [W * 0.5, H * 0.3],
  person: [W * 0.3, H * 0.55],
  routine: [W * 0.62, H * 0.75],
  sources: [W * 0.16, H * 0.2],
};

// פריסה בכוח: חישוב דטרמיניסטי אחד, כך שהמפה זהה בכל טעינה.
function layout() {
  const nodes = CONCEPTS.map((c, i) => {
    const a = (i / CONCEPTS.length) * Math.PI * 2;
    return { id: c.id, group: c.group, x: W / 2 + Math.cos(a) * 160, y: H / 2 + Math.sin(a) * 140, vx: 0, vy: 0 };
  });
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const links = CONCEPT_LINKS.filter(([a, b]) => byId[a] && byId[b]);
  for (let it = 0; it < 420; it++) {
    for (const a of nodes) {
      for (const b of nodes) {
        if (a === b) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = Math.max(dx * dx + dy * dy, 30);
        const f = 5200 / d2;
        a.vx += (dx / Math.sqrt(d2)) * f;
        a.vy += (dy / Math.sqrt(d2)) * f;
      }
      const [gx, gy] = ANCHOR[a.group];
      a.vx += (gx - a.x) * 0.012;
      a.vy += (gy - a.y) * 0.012;
    }
    for (const [ia, ib] of links) {
      const a = byId[ia];
      const b = byId[ib];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - 92) * 0.02;
      a.vx += (dx / d) * f;
      a.vy += (dy / d) * f;
      b.vx -= (dx / d) * f;
      b.vy -= (dy / d) * f;
    }
    for (const n of nodes) {
      n.x = Math.min(W - 50, Math.max(50, n.x + n.vx * 0.5));
      n.y = Math.min(H - 36, Math.max(36, n.y + n.vy * 0.5));
      n.vx *= 0.6;
      n.vy *= 0.6;
    }
  }
  return { nodes, links, byId };
}

export default function ConceptGraph() {
  const reduce = useReducedMotion();
  const { nodes, links, byId } = useMemo(layout, []);
  const [hover, setHover] = useState(null);
  const degree = useMemo(() => {
    const d = {};
    for (const [a, b] of links) {
      d[a] = (d[a] || 0) + 1;
      d[b] = (d[b] || 0) + 1;
    }
    return d;
  }, [links]);
  const near = (id) => !hover || id === hover || links.some(([a, b]) => (a === hover && b === id) || (b === hover && a === id));
  const term = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]));

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="מפת הידע: כל המושגים והקשרים ביניהם">
        {links.map(([a, b], i) => {
          const A = byId[a];
          const B = byId[b];
          const on = !hover || a === hover || b === hover;
          return (
            <motion.line
              key={`${a}-${b}`} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              stroke={on && hover ? 'var(--brass)' : 'var(--line)'} strokeWidth={on && hover ? 1.5 : 0.8}
              initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: on ? 0.7 : 0.1 }}
              animate={{ opacity: on ? 0.7 : 0.1 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: reduce ? 0 : 0.03 * i, ease: [0.22, 1, 0.36, 1] }}
            />
          );
        })}
        {nodes.map((n, i) => {
          const r = 4 + (degree[n.id] || 0) * 1.4;
          const on = near(n.id);
          return (
            <motion.g
              key={n.id} role="link" tabIndex={0} aria-label={term[n.id].term}
              onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(n.id)} onBlur={() => setHover(null)}
              onClick={() => go(`/library/${n.id}`)} onKeyDown={(e) => e.key === 'Enter' && go(`/library/${n.id}`)}
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ duration: 0.9, delay: reduce ? 0 : 0.3 + 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
              style={{ cursor: 'pointer', originX: `${n.x}px`, originY: `${n.y}px` }}
            >
              <motion.g animate={reduce ? {} : { y: [0, -2, 0] }} transition={{ duration: 8 + (i % 4), repeat: Infinity, ease: 'easeInOut' }}>
                <circle cx={n.x} cy={n.y} r={r * 3} fill="var(--ember)" opacity={hover === n.id ? 0.18 : 0} style={{ transition: 'opacity .5s' }} />
                <circle cx={n.x} cy={n.y} r={r + 5} fill="none" stroke={GROUP_COLOR[n.group]} strokeWidth="1" opacity={on ? 0.7 : 0.2} />
                <circle cx={n.x} cy={n.y} r={r} fill={GROUP_COLOR[n.group]} opacity={on ? 1 : 0.25} />
                <text x={n.x} y={n.y + r + 20} textAnchor="middle" fontSize="13" className="svg-ink graph-label" opacity={on ? 1 : 0.3}
                  style={{ paintOrder: 'stroke', stroke: 'var(--bg)', strokeWidth: 4 }}>
                  {term[n.id].term}
                </text>
              </motion.g>
            </motion.g>
          );
        })}
      </svg>
      <figcaption>
        <div className="legend">
          {GROUPS.map((g) => (
            <span key={g.id}><i style={{ background: GROUP_COLOR[g.id] }} />{g.title}</span>
          ))}
        </div>
        עמדו על מושג כדי לראות את הקשרים שלו, ולחצו כדי לפתוח אותו. גודל הנקודה מבטא את מספר הקשרים.
      </figcaption>
    </figure>
  );
}
