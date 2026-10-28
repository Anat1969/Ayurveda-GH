import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, ContactShadows, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';

// ערכת התלת מימד. שפת הסגנון (docs/design-language.md, "נושא מואר ושכבת סכמה"):
// נושא אמיתי בחומר אמיתי, אור חם אחד מאחור, ומעליו שכבת סכמה דקה שמציירת את עצמה,
// ותוויות שמרחפות ליד הנושא: כותרת, ומתחתיה הסבר בסוגריים.

// ---------- צבעים מתוך משתני ה-CSS, כך שמצב בהיר וכהה מתחלפים לבד ----------
const VARS = ['--ink', '--muted', '--brass', '--brass-soft', '--ember', '--alert', '--bg', '--raised', '--vata', '--pitta', '--kapha', '--vata-tint', '--pitta-tint', '--kapha-tint', '--line', '--hair'];
function readColors() {
  const cs = getComputedStyle(document.documentElement);
  const out = {};
  for (const v of VARS) out[v.slice(2)] = cs.getPropertyValue(v).trim() || '#888888';
  out.dark = matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.dataset.theme !== 'light';
  return out;
}
export function useColors() {
  const [c, setC] = useState(readColors);
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => setC(readColors());
    mq.addEventListener('change', on);
    const obs = new MutationObserver(on);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { mq.removeEventListener('change', on); obs.disconnect(); };
  }, []);
  return c;
}

export const ELEMENT_COLOR = { space: '#8A97AE', air: '#9CC0C6', fire: '#E0874E', water: '#3C7389', earth: '#7A5B3A' };
export const BUILD3D = {
  vata: { w: 0.7, h: 1.1, el: ['space', 'air'] },
  pitta: { w: 1, h: 1, el: ['fire', 'water'] },
  kapha: { w: 1.42, h: 0.94, el: ['water', 'earth'] },
};

export { hasWebGL } from './webgl.js';

// מצלמה שמתאימה את עצמה לרוחב ולגובה של הבמה, כך ששום נושא לא נחתך
function CameraFit({ dir, target, size, fov, margin = 1.1 }) {
  const { camera, size: px, gl, invalidate } = useThree();
  const last = useRef(-1);
  const place = () => {
    const aspect = px.width / Math.max(px.height, 1);
    const t = Math.tan(((fov / 2) * Math.PI) / 180);
    const dist = Math.max(size[1] / 2 / t, size[0] / 2 / (t * aspect)) * margin;
    const d = new THREE.Vector3(...dir).normalize().multiplyScalar(dist);
    camera.position.set(target[0] + d.x, target[1] + d.y, target[2] + d.z);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
    invalidate();
  };
  useEffect(() => {
    place();
  }, [px.width, px.height, size.join(), target.join(), dir.join()]);
  // שומר על המילים: תווית שיוצאת מהבמה זזה פנימה, בלי לשנות את גודל הנושא
  useFrame((st) => {
    const now = st.clock.elapsedTime;
    if (now - last.current < 0.05) return;
    last.current = now;
    const box = gl.domElement.closest('.stage3d');
    if (!box) return;
    const b = box.getBoundingClientRect();
    const pad = 6;
    for (const l of box.querySelectorAll('.flabel, .star-label')) {
      const r = l.getBoundingClientRect();
      if (!r.width) continue;
      const ox = parseFloat(l.dataset.nx || 0);
      const oy = parseFloat(l.dataset.ny || 0);
      const left = r.left - ox;
      const right = r.right - ox;
      const top = r.top - oy;
      const bottom = r.bottom - oy;
      const nx = left < b.left + pad ? b.left + pad - left : right > b.right - pad ? b.right - pad - right : 0;
      const ny = top < b.top + pad ? b.top + pad - top : bottom > b.bottom - pad ? b.bottom - pad - bottom : 0;
      if (nx !== ox || ny !== oy) {
        l.dataset.nx = nx;
        l.dataset.ny = ny;
        l.style.transform = nx || ny ? `translate(${nx}px, ${ny}px)` : '';
      }
    }
  });
  return null;
}

// ---------- הבמה: קנבס שקוף, אור חם אחד, השתקפויות רכות, צל מגע ----------
export function Stage3D({ children, camera = [0, 2.2, 7.4], fov = 32, target = [0, 0.6, 0], size = [7, 4], height, label, className = '', shadowY = 0, shadowScale = 12 }) {
  const reduce = useReducedMotion();
  const c = useColors();
  return (
    <div className={`stage3d ${className}`} style={height ? { height } : undefined} role="img" aria-label={label}>
      <Canvas
        dpr={[1, 2]} frameloop={reduce ? 'demand' : 'always'}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
        camera={{ position: camera, fov, near: 0.1, far: 60 }}
        onCreated={({ camera: cam, gl }) => { cam.lookAt(...target); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = c.dark ? 1.05 : 1.12; }}
      >
        <CameraFit dir={camera} target={target} size={size} fov={fov} />
        <ambientLight intensity={c.dark ? 0.35 : 0.55} />
        {/* האור האחד: חם, מאחור ומלמעלה */}
        <directionalLight position={[3.5, 5.5, -3]} intensity={2.4} color="#FFD7A0" />
        <directionalLight position={[-4, 3, 5]} intensity={c.dark ? 0.5 : 0.9} color="#F4EEE3" />
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={3} color="#FFD9A6" position={[3, 4, -4]} scale={[6, 3, 1]} />
          <Lightformer form="rect" intensity={1.2} color="#F4EEE3" position={[-5, 2, 3]} scale={[4, 4, 1]} />
          <Lightformer form="ring" intensity={0.8} color="#C9A45C" position={[0, 6, 0]} scale={3} />
          <Lightformer form="rect" intensity={0.4} color="#9CC0C6" position={[0, -3, 4]} scale={[10, 2, 1]} />
        </Environment>
        <Suspense fallback={null}>{children}</Suspense>
        <ContactShadows position={[0, shadowY, 0]} opacity={c.dark ? 0.6 : 0.38} scale={shadowScale} blur={2.6} far={4} color={c.dark ? '#000000' : '#4A3A22'} />
      </Canvas>
    </div>
  );
}

// ---------- חומרים ----------
export function Brass({ color = '#B8893E', rough = 0.28 }) {
  return <meshStandardMaterial color={color} metalness={1} roughness={rough} envMapIntensity={1.3} />;
}
export function Glass({ color = '#ffffff', thickness = 0.6, rough = 0.04, opacity = 1, tint = 0 }) {
  return (
    <meshPhysicalMaterial color={color} transmission={1} thickness={thickness} roughness={rough} ior={1.45}
      transparent opacity={opacity} attenuationColor={color} attenuationDistance={tint ? 1.2 : 6} envMapIntensity={1.1} clearcoat={1} clearcoatRoughness={0.05} />
  );
}
export function Ceramic({ color = '#EFE6D2', rough = 0.55 }) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={0} envMapIntensity={0.7} />;
}

// ---------- שכבת הסכמה: קו שמצייר את עצמו ----------
const lengthOf = (pts) => {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += pts[i].distanceTo(pts[i - 1]);
  return l || 1;
};
export function DrawLine({ points, color, width = 1.3, delay = 0, duration = 1.6, flow = false, dashed = false, opacity = 0.9, depthTest = true }) {
  const reduce = useReducedMotion();
  const ref = useRef();
  const pts = useMemo(() => points.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p))), [points]);
  const len = useMemo(() => lengthOf(pts), [pts]);
  const t0 = useRef(null);
  useFrame((state) => {
    const m = ref.current?.material;
    if (!m) return;
    if (t0.current === null) t0.current = state.clock.elapsedTime;
    const p = reduce ? 1 : Math.min(1, Math.max(0, (state.clock.elapsedTime - t0.current - delay) / duration));
    const e = 1 - Math.pow(1 - p, 3);
    if (p >= 1 && (flow || dashed)) {
      m.dashSize = len * (flow ? 0.035 : 0.02);
      m.gapSize = len * (flow ? 0.03 : 0.025);
      if (flow && !reduce) m.dashOffset -= 0.006;
    } else {
      m.dashSize = len;
      m.gapSize = len;
      m.dashOffset = len * (1 - e);
    }
  });
  return (
    <Line ref={ref} points={pts} color={color} lineWidth={width} dashed dashSize={len} gapSize={len} dashOffset={len}
      transparent opacity={opacity} depthTest={depthTest} />
  );
}

// אליפסה שמקיפה נושא, כמו בתמונת ההשראה
export function Ring({ center = [0, 0, 0], rx = 1, rz = 0.5, y = 0, color, delay = 0, width = 1.2, dashed = false, tilt = 0, segments = 96, arc = 1 }) {
  const pts = useMemo(() => {
    const a = [];
    const n = Math.round(segments * arc);
    for (let i = 0; i <= n; i++) {
      const t = (i / segments) * Math.PI * 2 + Math.PI / 2;
      const x = Math.cos(t) * rx;
      const z = Math.sin(t) * rz;
      a.push(new THREE.Vector3(center[0] + x, center[1] + y + Math.sin(t) * tilt, center[2] + z));
    }
    return a;
  }, [center.join(), rx, rz, y, tilt, segments, arc]);
  return <DrawLine points={pts} color={color} width={width} delay={delay} dashed={dashed} />;
}

// חץ מעוקל שמוביל את העין: קשת בזייה וראש חץ קטן
export function Arrow({ from, to, lift = 1.2, color, delay = 0, width = 1.3, flow = false, head = true, opacity = 0.9 }) {
  const reduce = useReducedMotion();
  const { pts, end, dir } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const m = a.clone().lerp(b, 0.5);
    m.y += lift;
    const curve = new THREE.QuadraticBezierCurve3(a, m, b);
    const p = curve.getPoints(48);
    const d = p[p.length - 1].clone().sub(p[p.length - 3]).normalize();
    return { pts: p, end: p[p.length - 1], dir: d };
  }, [from.join(), to.join(), lift]);
  const headRef = useRef();
  const t0 = useRef(null);
  useFrame((s) => {
    if (!headRef.current) return;
    if (t0.current === null) t0.current = s.clock.elapsedTime;
    const p = reduce ? 1 : Math.min(1, Math.max(0, (s.clock.elapsedTime - t0.current - delay - 1.2) / 0.4));
    headRef.current.scale.setScalar(p);
  });
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir), [dir]);
  return (
    <group>
      <DrawLine points={pts} color={color} width={width} delay={delay} flow={flow} opacity={opacity} />
      {head && (
        <mesh ref={headRef} position={end} quaternion={q} scale={0}>
          <coneGeometry args={[0.045, 0.14, 16]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
      )}
    </group>
  );
}

// ---------- טקסט מרחף ----------
export function FloatLabel({ position, title, sub, tone, delay = 0, size = 'm', align = 'center', onClick, active, className = '' }) {
  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: onClick ? 'auto' : 'none' }}>
      <div className={`flabel flabel-${size} ${active ? 'on' : ''} ${className}`} style={{ '--tone': tone, '--delay': `${delay}s`, textAlign: align }}
        onClick={onClick} role={onClick ? 'button' : undefined}>
        <b>{title}</b>
        {sub && <span>({sub})</span>}
      </div>
    </Html>
  );
}

// ריחוף עדין של נושא, בקצב נשימה
export function Hover({ children, amp = 0.05, speed = 0.8, phase = 0, rotate = 0 }) {
  const reduce = useReducedMotion();
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current || reduce) return;
    const t = s.clock.elapsedTime * speed + phase;
    ref.current.position.y = Math.sin(t) * amp;
    if (rotate) ref.current.rotation.y += rotate;
  });
  return <group ref={ref}>{children}</group>;
}

// ---------- חמשת היסודות כחומר ----------
// חלל: כדור זכוכית ריק. אוויר: פנינים שמסתובבות. אש: להבה. מים: עדשת מים. אדמה: אבן.
export function ElementObject({ id, r = 0.34, still = false }) {
  const reduce = useReducedMotion() || still;
  const g = useRef();
  const flame = useRef();
  const ripple = useRef();
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (reduce) return;
    if (id === 'air' && g.current) g.current.rotation.y = t * 0.9;
    if (id === 'fire' && flame.current) {
      flame.current.scale.y = 1 + Math.sin(t * 6.3) * 0.06 + Math.sin(t * 13.1) * 0.03;
      flame.current.scale.x = 1 - Math.sin(t * 6.3) * 0.03;
    }
    if (id === 'water' && ripple.current) {
      const k = (t * 0.45) % 1;
      ripple.current.scale.setScalar(1 + k * 0.9);
      ripple.current.material.opacity = 0.5 * (1 - k);
    }
  });
  const flameGeo = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const v = i / 24;
      const w = Math.sin(Math.PI * Math.pow(v, 0.62)) * (1 - v * 0.35);
      pts.push(new THREE.Vector2(w * r * 0.5, v * r * 2.8 - r * 0.9));
    }
    return new THREE.LatheGeometry(pts, 48);
  }, [r]);
  const stoneGeo = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(r * 0.92, 5);
    const p = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = Math.sin(v.x * 9.1) * Math.cos(v.y * 7.3) * Math.sin(v.z * 8.2);
      v.multiplyScalar(1 + n * 0.06);
      v.y *= 0.86;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, [r]);

  if (id === 'space') {
    return (
      <group>
        <mesh><sphereGeometry args={[r, 64, 64]} /><Glass thickness={0.25} /></mesh>
        <mesh><sphereGeometry args={[r * 0.08, 16, 16]} /><meshBasicMaterial color="#8A97AE" transparent opacity={0.5} /></mesh>
      </group>
    );
  }
  if (id === 'air') {
    return (
      <group>
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[r * 0.85, 0.006, 8, 96]} /><meshBasicMaterial color={ELEMENT_COLOR.air} transparent opacity={0.55} /></mesh>
        <group ref={g} rotation={[0.35, 0, 0.2]}>
          {[0, 1, 2].map((k) => {
            const a = (k / 3) * Math.PI * 2;
            return (
              <mesh key={k} position={[Math.cos(a) * r * 0.85, Math.sin(k * 2.1) * r * 0.25, Math.sin(a) * r * 0.85]}>
                <sphereGeometry args={[r * 0.2, 32, 32]} />
                <meshPhysicalMaterial color="#EEF3F2" roughness={0.18} metalness={0} clearcoat={1} sheen={1} sheenColor="#9CC0C6" />
              </mesh>
            );
          })}
        </group>
      </group>
    );
  }
  if (id === 'fire') {
    return (
      <group>
        <mesh ref={flame} geometry={flameGeo}>
          <meshBasicMaterial color="#E8742C" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[0, -r * 0.18, 0]} scale={[0.62, 0.72, 0.62]} geometry={flameGeo}>
          <meshBasicMaterial color="#FFB35C" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[0, -r * 0.42, 0]} scale={[0.32, 0.42, 0.32]} geometry={flameGeo}>
          <meshBasicMaterial color="#FFF4D8" />
        </mesh>
        <mesh position={[0, -r * 0.85, 0]}><cylinderGeometry args={[r * 0.03, r * 0.03, r * 0.25, 8]} /><meshBasicMaterial color="#3A2A1A" /></mesh>
        <pointLight position={[0, r * 0.3, 0]} intensity={1.6} distance={2.2} color="#FF9F50" />
      </group>
    );
  }
  if (id === 'water') {
    return (
      <group>
        <mesh scale={[1, 0.42, 1]}><sphereGeometry args={[r, 64, 64]} /><Glass color="#7FB3C4" thickness={1.2} tint={1} /></mesh>
        <mesh ref={ripple} rotation={[-Math.PI / 2, 0, 0]} position={[0, -r * 0.3, 0]}>
          <ringGeometry args={[r * 1.05, r * 1.09, 96]} />
          <meshBasicMaterial color={ELEMENT_COLOR.water} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }
  return (
    <mesh geometry={stoneGeo}>
      <meshStandardMaterial color="#6E5236" roughness={0.95} metalness={0} />
    </mesh>
  );
}

// ---------- פסל הגוף: בובת אמן מפורצלן עם מפרקי פליז ----------
// אותו גוף, בפרופורציות של כל חוקה. בית החזה מזכוכית, ובתוכו שני היסודות של הדושה.
function Capsule({ a, b, r, children }) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const mid = A.clone().add(B).multiplyScalar(0.5);
  const len = Math.max(A.distanceTo(B) - r * 2, 0.001);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return (
    <mesh position={mid} quaternion={q}>
      <capsuleGeometry args={[r, len, 8, 24]} />
      {children}
    </mesh>
  );
}
function Joint({ p, r }) {
  return (
    <mesh position={p}>
      <sphereGeometry args={[r, 24, 24]} />
      <meshStandardMaterial color="#B8893E" metalness={1} roughness={0.3} />
    </mesh>
  );
}

export function BodySculpture({ d, tint, active = true, scale = 1, showElements = true }) {
  const b = BUILD3D[d];
  const k = scale;
  const h = b.h * k;
  const w = b.w;
  const wl = Math.pow(w, 0.75);
  const Y = (y) => y * h;
  const X = (x) => x * w * k;
  const op = active ? 1 : 0.3;
  const mat = () => <meshPhysicalMaterial color={tint} roughness={0.38} clearcoat={0.6} clearcoatRoughness={0.25} sheen={0.4} sheenColor="#ffffff" transparent opacity={op} />;
  const lr = (r) => r * wl * k;
  const legs = [-1, 1].map((s) => ({
    hip: [X(0.1 * s), Y(1.3), 0], knee: [X(0.105 * s), Y(0.74), Y(0.01)], ankle: [X(0.1 * s), Y(0.14), 0],
  }));
  const arms = [-1, 1].map((s) => ({
    sh: [X(0.29 * s), Y(2.05), 0], el: [X(0.33 * s), Y(1.66), -Y(0.02)], wr: [X(0.35 * s), Y(1.3), Y(0.03)],
  }));
  return (
    <group>
      {legs.map((l, i) => (
        <group key={`l${i}`}>
          <Capsule a={l.hip} b={l.knee} r={lr(0.075)}>{mat()}</Capsule>
          <Capsule a={l.knee} b={l.ankle} r={lr(0.056)}>{mat()}</Capsule>
          <Joint p={l.knee} r={lr(0.052)} />
          <mesh position={[l.ankle[0], Y(0.05), Y(0.05)]} scale={[lr(0.06), Y(0.04), lr(0.11)]}><sphereGeometry args={[1, 20, 16]} />{mat()}</mesh>
        </group>
      ))}
      <mesh position={[0, Y(1.36), 0]} scale={[X(0.2), Y(0.11), lr(0.13)]}><sphereGeometry args={[1, 32, 24]} />{mat()}</mesh>
      {legs.map((l, i) => <Joint key={`h${i}`} p={l.hip} r={lr(0.055)} />)}
      <mesh position={[0, Y(1.58), 0]} scale={[X(0.15), Y(0.13), lr(0.11)]}><sphereGeometry args={[1, 32, 24]} />{mat()}</mesh>
      <mesh position={[0, Y(1.86), 0]} scale={[X(0.25), Y(0.24), lr(0.15)]}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshPhysicalMaterial color={tint} transmission={active ? 0.94 : 0.5} thickness={0.35} roughness={0.08} ior={1.42} transparent opacity={active ? 1 : 0.3}
          attenuationColor={tint} attenuationDistance={1.6} clearcoat={1} clearcoatRoughness={0.06} />
      </mesh>
      {arms.map((a, i) => (
        <group key={`a${i}`}>
          <Joint p={a.sh} r={lr(0.05)} />
          <Capsule a={a.sh} b={a.el} r={lr(0.048)}>{mat()}</Capsule>
          <Joint p={a.el} r={lr(0.04)} />
          <Capsule a={a.el} b={a.wr} r={lr(0.04)}>{mat()}</Capsule>
          <mesh position={[a.wr[0], a.wr[1] - Y(0.06), a.wr[2]]} scale={[lr(0.035), Y(0.06), lr(0.025)]}><sphereGeometry args={[1, 16, 16]} />{mat()}</mesh>
        </group>
      ))}
      <Capsule a={[0, Y(2.08), 0]} b={[0, Y(2.24), 0]} r={lr(0.045)}>{mat()}</Capsule>
      <mesh position={[0, Y(2.38), Y(0.01)]} scale={[Y(0.105) * Math.pow(w, 0.25), Y(0.135), Y(0.115)]}><sphereGeometry args={[1, 48, 48]} />{mat()}</mesh>
      {showElements && (
        <>
          <group position={[0, Y(1.96), 0]}><ElementObject id={b.el[0]} r={Math.min(X(0.1), 0.12 * k + 0.02)} still={!active} /></group>
          <group position={[0, Y(1.74), 0]}><ElementObject id={b.el[1]} r={Math.min(X(0.1), 0.12 * k + 0.02)} still={!active} /></group>
        </>
      )}
    </group>
  );
}
export const bodyHeight = (d, scale = 1) => 2.55 * BUILD3D[d].h * scale;

// בסיס פליז דק מתחת לנושא
export function Plinth({ r = 0.5, y = 0 }) {
  return (
    <mesh position={[0, y + 0.02, 0]}>
      <cylinderGeometry args={[r, r * 1.04, 0.04, 64]} />
      <Brass rough={0.35} />
    </mesh>
  );
}
