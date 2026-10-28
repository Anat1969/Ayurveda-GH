import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

// מגדל של שלוש אבנים בשקיעה. ואטה הקלה למעלה, קאפה הכבדה בבסיס.
// תנועת העכבר מטה את המגדל, והאבנים מתאזנות מחדש: איזון הוא תנועה, לא מצב קפוא.
const STONES = [
  { id: 'kapha', name: 'קאפה', sub: 'מים ואדמה', cx: 300, cy: 392, rx: 150, ry: 58, c1: '#7AD1B2', c2: '#1E7A5C', k: 0.35 },
  { id: 'pitta', name: 'פיטה', sub: 'אש ומים', cx: 300, cy: 290, rx: 112, ry: 46, c1: '#F7B26E', c2: '#B23A2E', k: 0.7 },
  { id: 'vata', name: 'ואטה', sub: 'חלל ואוויר', cx: 300, cy: 206, rx: 74, ry: 36, c1: '#8FD6E0', c2: '#16707F', k: 1.15 },
];

const DUST = Array.from({ length: 22 }, (_, i) => ({
  x: 40 + ((i * 97) % 520),
  y: 60 + ((i * 53) % 300),
  r: 1 + (i % 3) * 0.7,
  d: 6 + (i % 5) * 1.7,
}));

function Stone({ s, tilt, hover, setHover }) {
  const x = useTransform(tilt, (v) => v * 22 * s.k);
  const rotate = useTransform(tilt, (v) => v * 4 * s.k);
  const on = hover === s.id;
  return (
    <motion.g
      style={{ x, rotate, originX: '300px', originY: `${s.cy}px`, cursor: 'pointer' }}
      onMouseEnter={() => setHover(s.id)}
      onMouseLeave={() => setHover(null)}
      onFocus={() => setHover(s.id)}
      onBlur={() => setHover(null)}
    >
      <a href={`#/library/${s.id}`} aria-label={`${s.name}: ${s.sub}`}>
        <ellipse cx={s.cx + 6} cy={s.cy + s.ry * 0.75} rx={s.rx * 0.92} ry={s.ry * 0.28} fill="#5A2A0A" opacity=".18" />
        <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={`url(#st-${s.id})`} />
        <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill="url(#rim)" opacity=".9" />
        <ellipse cx={s.cx - s.rx * 0.18} cy={s.cy - s.ry * 0.42} rx={s.rx * 0.55} ry={s.ry * 0.28} fill="url(#gloss)" />
        <motion.ellipse
          cx={s.cx} cy={s.cy} rx={s.rx + 6} ry={s.ry + 5} fill="none" stroke="#FFE6B8" strokeWidth="2"
          initial={false} animate={{ opacity: on ? 0.9 : 0 }}
        />
        <text x={s.cx} y={s.cy + 6} textAnchor="middle" fontSize={s.rx > 100 ? 24 : 19} fontWeight="600" fill="#fff" style={{ pointerEvents: 'none' }}>
          {s.name}
        </text>
      </a>
    </motion.g>
  );
}

export default function HeroScene() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const raw = useMotionValue(0);
  const tilt = useSpring(raw, { stiffness: 60, damping: 9, mass: 0.8 });
  const sunY = useTransform(tilt, (v) => 205 + v * 6);
  const [hover, setHover] = useState(null);
  const active = STONES.find((s) => s.id === hover);

  const onMove = (e) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    raw.set(((e.clientX - r.left) / r.width - 0.5) * 2);
  };

  return (
    <div className="hero-scene" ref={ref} onPointerMove={onMove} onPointerLeave={() => raw.set(0)}>
      <svg viewBox="0 0 600 520" role="img" aria-label="מגדל של שלוש אבנים: ואטה למעלה, פיטה באמצע וקאפה בבסיס">
        <defs>
          <radialGradient id="sky" cx=".5" cy=".46" r=".7">
            <stop offset="0" stopColor="#FFD9A0" />
            <stop offset=".35" stopColor="#F4A966" stopOpacity=".75" />
            <stop offset=".75" stopColor="#E98A5B" stopOpacity=".18" />
            <stop offset="1" stopColor="#E98A5B" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sun" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#FFF4D6" />
            <stop offset=".6" stopColor="#FFC877" />
            <stop offset="1" stopColor="#F49A4D" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1F8A9E" stopOpacity=".55" />
            <stop offset="1" stopColor="#1B4F8A" stopOpacity=".15" />
          </linearGradient>
          <radialGradient id="rim" cx=".5" cy=".5" r=".5">
            <stop offset=".78" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#FFE2B0" stopOpacity=".7" />
          </radialGradient>
          <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".75" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          {STONES.map((s) => (
            <radialGradient key={s.id} id={`st-${s.id}`} cx=".38" cy=".3" r=".85">
              <stop offset="0" stopColor={s.c1} />
              <stop offset="1" stopColor={s.c2} />
            </radialGradient>
          ))}
        </defs>

        <rect width="600" height="520" fill="url(#sky)" />
        <motion.circle cx="300" cy={sunY} r="120" fill="url(#sun)" />
        <rect y="430" width="600" height="90" fill="url(#sea)" />
        {!reduce &&
          [0, 1, 2, 3, 4].map((i) => (
            <motion.line
              key={i} x1={160 + i * 22} x2={440 - i * 22} y1={446 + i * 13} y2={446 + i * 13}
              stroke="#FFE3B5" strokeWidth={3 - i * 0.45} strokeLinecap="round"
              animate={{ opacity: [0.15, 0.6, 0.15], x: [0, i % 2 ? 8 : -8, 0] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        <ellipse cx="300" cy="440" rx="190" ry="14" fill="#3A1E0A" opacity=".18" />

        {!reduce &&
          DUST.map((p, i) => (
            <motion.circle
              key={i} cx={p.x} cy={p.y} r={p.r} fill="#FFF1D2"
              animate={{ y: [0, -28, 0], opacity: [0, 0.8, 0] }}
              transition={{ duration: p.d, repeat: Infinity, delay: i * 0.37, ease: 'easeInOut' }}
            />
          ))}

        {STONES.map((s) => (
          <Stone key={s.id} s={s} tilt={tilt} hover={hover} setHover={setHover} />
        ))}
      </svg>
      <div className="hero-caption" aria-live="polite">
        {active ? (
          <>
            <b>{active.name}</b> · {active.sub}
          </>
        ) : (
          <span>הזיזו את העכבר: המגדל מתאזן מחדש</span>
        )}
      </div>
    </div>
  );
}
