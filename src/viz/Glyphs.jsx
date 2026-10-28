import { useReducedMotion } from 'framer-motion';
import { ELEMENTS, BUILD, DOSHA_COLOR, DOSHA_TINT } from '../data/viz.js';

// השפה הגרפית: כל יסוד הוא צורה של עיגול או אליפסה, וכל דושה היא מבנה גוף.
// חלל: עיגול ריק, מכיל. אוויר: עיגולים קטנים שנעים. אש: אליפסה אנכית שעולה.
// מים: אליפסה אופקית שמתפשטת. אדמה: עיגול מלא ויציב.
export const EL = Object.fromEntries(ELEMENTS.map((e) => [e.id, e]));

export function ElementGlyph({ id, x = 0, y = 0, r = 14, still = false }) {
  const reduce = useReducedMotion() || still;
  const c = EL[id].color;
  if (id === 'space') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r={r} fill={c} fillOpacity=".07" stroke={c} strokeWidth="1.3" strokeDasharray="1.5 3.5" />
      </g>
    );
  }
  if (id === 'air') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r={r} fill="none" stroke={c} strokeOpacity=".35" strokeWidth="1" />
        <g>
          {[0, 120, 240].map((a) => (
            <circle key={a} cx={Math.cos((a * Math.PI) / 180) * r * 0.62} cy={Math.sin((a * Math.PI) / 180) * r * 0.62} r={r * 0.2} fill={c} />
          ))}
          {!reduce && <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="9s" repeatCount="indefinite" />}
        </g>
      </g>
    );
  }
  if (id === 'fire') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <ellipse rx={r * 0.56} ry={r} fill={c} fillOpacity=".85">
          {!reduce && <animate attributeName="ry" values={`${r};${r * 1.08};${r}`} dur="4s" repeatCount="indefinite" />}
        </ellipse>
        <ellipse cy={r * 0.28} rx={r * 0.24} ry={r * 0.46} fill="var(--bg)" fillOpacity=".55" />
      </g>
    );
  }
  if (id === 'water') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <ellipse rx={r * 1.22} ry={r * 0.66} fill="none" stroke={c} strokeOpacity=".4" strokeWidth="1">
          {!reduce && <animate attributeName="rx" values={`${r * 1.05};${r * 1.3};${r * 1.05}`} dur="6s" repeatCount="indefinite" />}
        </ellipse>
        <ellipse rx={r} ry={r * 0.52} fill={c} fillOpacity=".78" />
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r * 0.92} fill={c} />
      <circle r={r * 0.5} fill="none" stroke="var(--bg)" strokeOpacity=".35" strokeWidth="1" />
    </g>
  );
}

// דושה כצורת גוף: אליפסה שהפרופורציות שלה הן מבנה הגוף, ובתוכה שני היסודות שלה.
export function DoshaGlyph({ d, x = 0, y = 0, s = 1, active = true, still = false }) {
  const b = BUILD[d];
  const rx = 15 * b.w * s;
  const ry = 21 * b.h * s;
  return (
    <g transform={`translate(${x} ${y})`} opacity={active ? 1 : 0.35} style={{ transition: 'opacity .5s cubic-bezier(.22,1,.36,1)' }}>
      <ellipse rx={rx} ry={ry} fill={DOSHA_TINT[d]} fillOpacity=".22" stroke={DOSHA_COLOR[d]} strokeWidth="1.4" />
      <ElementGlyph id={b.el[0]} y={-ry * 0.38} r={5.6 * s} still={still} />
      <ElementGlyph id={b.el[1]} y={ry * 0.36} r={5.6 * s} still={still} />
    </g>
  );
}

// סימן דושה קטן בתוך טקסט: מבנה הגוף בלבד, בלי יסודות.
export function DoshaMark({ d, size = 22 }) {
  const b = BUILD[d];
  return (
    <svg className="dosha-mark" width={size} height={size} viewBox="-12 -12 24 24" aria-hidden="true">
      <ellipse rx={7.4 * b.w} ry={10 * b.h} fill={DOSHA_TINT[d]} fillOpacity=".35" stroke={DOSHA_COLOR[d]} strokeWidth="1.4" />
    </svg>
  );
}

// גוף מלא מאליפסות: ראש, גו, אגן, ידיים ורגליים. הפרופורציות לפי מבנה החוקה.
export function BodyFigure({ d, cx, gy, H = 300, active = true }) {
  const reduce = useReducedMotion();
  const b = BUILD[d];
  const h = H * b.h;
  const w = b.w;
  const legL = h * 0.47;
  const torsoRy = h * 0.17;
  const torsoCy = gy - legL - torsoRy * 0.82;
  const torsoRx = 30 * w;
  const headR = h * 0.068 * Math.pow(w, 0.35);
  const headCy = torsoCy - torsoRy - headR - 5;
  const hipCy = gy - legL + 2;
  const legRx = 8.5 * w;
  const armRx = 6.2 * w;
  const armRy = h * 0.19;
  const color = DOSHA_COLOR[d];
  const tint = DOSHA_TINT[d];
  const part = { fill: tint, fillOpacity: 0.2, stroke: color, strokeWidth: 1.3 };
  return (
    <g opacity={active ? 1 : 0.32} style={{ transition: 'opacity .6s cubic-bezier(.22,1,.36,1)' }}>
      <ellipse cx={cx} cy={gy + 2} rx={torsoRx * 1.3} ry={5} fill={color} fillOpacity=".12" />
      {[-1, 1].map((k) => (
        <ellipse key={`l${k}`} cx={cx + k * (legRx + 3)} cy={gy - legL / 2} rx={legRx} ry={legL / 2} {...part} />
      ))}
      <ellipse cx={cx} cy={hipCy} rx={torsoRx * 0.9} ry={h * 0.07} {...part} />
      {[-1, 1].map((k) => (
        <ellipse key={`a${k}`} cx={cx + k * (torsoRx + armRx + 2)} cy={torsoCy + armRy * 0.32} rx={armRx} ry={armRy} {...part}
          transform={`rotate(${k * -6} ${cx + k * (torsoRx + armRx + 2)} ${torsoCy})`} />
      ))}
      <ellipse cx={cx} cy={torsoCy} rx={torsoRx} ry={torsoRy} {...part} fillOpacity={0.26} />
      <circle cx={cx} cy={headCy} r={headR} {...part} />
      <ElementGlyph id={b.el[0]} x={cx} y={torsoCy - torsoRy * 0.4} r={Math.min(torsoRx * 0.42, 15)} still={!active || reduce} />
      <ElementGlyph id={b.el[1]} x={cx} y={torsoCy + torsoRy * 0.42} r={Math.min(torsoRx * 0.42, 15)} still={!active || reduce} />
    </g>
  );
}
