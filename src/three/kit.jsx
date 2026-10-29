import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';
import { CalloutCtx, CalloutAnchor, Callouts, createCalloutStore } from './callouts.jsx';
import { useBody } from './anatomyData.js';

// ערכת התלת מימד. שפת הסגנון (docs/design-language.md, "נושא מואר ושכבת סכמה"):
// נושא אמיתי בחומר אמיתי, אור חם אחד מאחור, ומעליו שכבת סכמה דקה שמציירת את עצמה,
// ותוויות שמרחפות ליד הנושא: כותרת, ומתחתיה הסבר בסוגריים.

// ---------- פלטת ההולוגרמה ----------
// הבמה היא תמיד "חלון לילה" כחול עמוק שנמוג אל הדף, ולכן הצבעים לא תלויים במצב בהיר או כהה.
export const HOLO = {
  ink: '#EAF4FF', muted: '#9DB4C4', line: '#6B93AC', hair: '#2E4A5C', brass: '#EBC47E', 'brass-soft': '#EBC47E',
  ember: '#FFB25A', alert: '#FF6B5E', bg: '#06111B', raised: '#0C1C29',
  vata: '#7FD3FF', pitta: '#FF9A4D', kapha: '#7DE3A2',
  'vata-tint': '#5BB8F0', 'pitta-tint': '#FF8040', 'kapha-tint': '#5ED68E',
  body: '#3FA9F5', organ: '#FF8A3D', lung: '#FF5E4D', dark: true,
};
export function useColors() {
  return HOLO;
}

// ---------- חומר ההולוגרמה: זוהר בשוליים (פרנל), שקוף במרכז, כמו צילום רנטגן מואר ----------
const holoVert = `
  varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vWY;
  void main() {
    vUv = uv;
    vWY = (modelMatrix * vec4(position, 1.0)).y;
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;
const holoFrag = `
  uniform vec3 uColor; uniform float uPower; uniform float uBase; uniform float uGlow; uniform float uOpacity;
  uniform float uTime; uniform float uFlow; uniform float uScanY;
  varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vWY;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPower);
    float band = uFlow > 0.0 ? smoothstep(0.0, 0.08, 0.08 - abs(fract(vUv.x * 3.0 - uTime * 0.12) - 0.5) * 0.16) * uFlow : 0.0;
    band += exp(-pow((vWY - uScanY) / 0.012, 2.0)) * 0.45;
    float a = (uBase + f * uGlow + band) * uOpacity;
    gl_FragColor = vec4(uColor * (0.6 + f * 1.4 + band * 2.0), a);
  }`;
// קו סריקה משותף, כמו בסורק CT. מחוץ למפת הגוף הוא רחוק ולא נראה.
export const SCAN = { value: -100 };
export function Holo({ color = '#3FA9F5', power = 2.2, base = 0.05, glow = 1.3, opacity = 1, flow = 0 }) {
  const reduce = useReducedMotion();
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) }, uPower: { value: power }, uBase: { value: base }, uGlow: { value: glow },
      uOpacity: { value: opacity }, uTime: { value: 0 }, uFlow: { value: flow }, uScanY: SCAN,
    },
    vertexShader: holoVert, fragmentShader: holoFrag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
  }), []);
  useEffect(() => {
    mat.uniforms.uColor.value.set(color);
    mat.uniforms.uPower.value = power;
    mat.uniforms.uBase.value = base;
    mat.uniforms.uGlow.value = glow;
    mat.uniforms.uOpacity.value = opacity;
    mat.uniforms.uFlow.value = flow;
  }, [color, power, base, glow, opacity, flow]);
  useFrame((s) => { if (flow && !reduce) mat.uniforms.uTime.value = s.clock.elapsedTime; });
  return <primitive object={mat} attach="material" />;
}

// ---------- ניצוצות אור ברקע (בוקה), כמו בתמונת ההשראה ----------
let dotTex = null;
function softDot() {
  if (dotTex) return dotTex;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.35, 'rgba(255,255,255,.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  dotTex = new THREE.CanvasTexture(cv);
  return dotTex;
}
export function Bokeh({ count = 90, spread = [14, 8, 6], center = [0, 1.5, -4], seed = 7 }) {
  const reduce = useReducedMotion();
  const ref = useRef();
  const { pos, col } = useMemo(() => {
    let x = seed;
    const rnd = () => ((x = (x * 16807) % 2147483647) / 2147483647);
    const p = new Float32Array(count * 3);
    const c = new Float32Array(count * 3);
    const warm = new THREE.Color('#FF9A3C');
    const cool = new THREE.Color('#3FA9F5');
    for (let i = 0; i < count; i++) {
      p[i * 3] = center[0] + (rnd() - 0.5) * spread[0];
      p[i * 3 + 1] = center[1] + (rnd() - 0.5) * spread[1];
      p[i * 3 + 2] = center[2] + (rnd() - 0.5) * spread[2];
      const k = rnd() < 0.62 ? warm : cool;
      const b = 0.35 + rnd() * 0.65;
      c[i * 3] = k.r * b; c[i * 3 + 1] = k.g * b; c[i * 3 + 2] = k.b * b;
    }
    return { pos: p, col: c };
  }, [count, seed]);
  useFrame((s) => {
    if (!ref.current || reduce) return;
    ref.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.05) * 0.12;
    ref.current.position.y = Math.sin(s.clock.elapsedTime * 0.2) * 0.12;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[col, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.32} map={softDot()} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation toneMapped={false} />
    </points>
  );
}

// עשן עולה: חלקיקים שמתרחבים ונמוגים
export function Smoke({ at = [0, 3.2, 0], color = '#5FB8FF', count = 26, height = 1.6 }) {
  const reduce = useReducedMotion();
  const ref = useRef();
  const seeds = useMemo(() => Array.from({ length: count }, (_, i) => ({ o: i / count, x: Math.sin(i * 12.9) * 0.08, s: 0.6 + ((i * 7) % 5) * 0.12 })), [count]);
  const pos = useMemo(() => new Float32Array(count * 3), [count]);
  useFrame((st) => {
    const g = ref.current?.geometry;
    if (!g) return;
    const t = reduce ? 0.5 : st.clock.elapsedTime * 0.12;
    seeds.forEach((sd, i) => {
      const k = (sd.o + t) % 1;
      pos[i * 3] = at[0] + sd.x + Math.sin(k * 6 + i) * 0.12 * k;
      pos[i * 3 + 1] = at[1] + k * height;
      pos[i * 3 + 2] = at[2] + Math.cos(k * 5 + i) * 0.05;
    });
    g.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial size={0.55} map={softDot()} color={color} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}

// זוהר רך על הרצפה, במקום צל
function GroundGlow({ y = 0, r = 4 }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y - 0.01, 0]}>
      <circleGeometry args={[r, 64]} />
      <meshBasicMaterial map={softDot()} color="#1E5B8A" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

export const ELEMENT_COLOR = { space: '#9FB7FF', air: '#9FE3F0', fire: '#FF9A4D', water: '#3FC3E8', earth: '#D08A4B' };
export const BUILD3D = {
  vata: { w: 0.7, h: 1.1, el: ['space', 'air'] },
  pitta: { w: 1, h: 1, el: ['fire', 'water'] },
  kapha: { w: 1.42, h: 0.94, el: ['water', 'earth'] },
};

export { hasWebGL } from './webgl.js';

// מצלמה שמתאימה את עצמה לרוחב ולגובה של הבמה, כך ששום נושא לא נחתך
function CameraFit({ dir, target, size, fov, margin = 1.1 }) {
  const { camera, size: px, invalidate } = useThree();
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
  return null;
}

// ---------- הבמה: חלון לילה, אור חם אחד, זוהר וניצוצות ----------
const fine = typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches;
export function Stage3D({ children, camera = [0, 2.2, 7.4], fov = 32, target = [0, 0.6, 0], size = [7, 4], height, label, className = '', shadowY = 0, shadowScale = 12, orbit = true, bokeh = true, bloom = 0.8, margins = true }) {
  const reduce = useReducedMotion();
  const store = useMemo(createCalloutStore, []);
  const stageRef = useRef();
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !margins) return undefined;
    const ro = new ResizeObserver(() => el.classList.toggle('callouts-numbered', el.clientWidth < 470));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <CalloutCtx.Provider value={store}>
    <div ref={stageRef} className={`stage3d holo ${margins ? '' : 'no-margins'} ${className}`} style={height ? { height } : undefined} role="img" aria-label={label}>
      <div className="stage-canvas">
      <Canvas
        dpr={[1, 2]} frameloop={reduce ? 'demand' : 'always'}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: false }}
        camera={{ position: camera, fov, near: 0.1, far: 80 }}
        onCreated={({ camera: cam, gl }) => { cam.lookAt(...target); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.15; }}
      >
        <color attach="background" args={[HOLO.bg]} />
        <fog attach="fog" args={[HOLO.bg, 10, 26]} />
        <CameraFit dir={camera} target={target} size={size} fov={fov} />
        {orbit && fine && (
          <OrbitControls target={target} enablePan={false} enableZoom={false} rotateSpeed={0.5}
            minPolarAngle={Math.PI * 0.18} maxPolarAngle={Math.PI * 0.55} minAzimuthAngle={-Math.PI / 3} maxAzimuthAngle={Math.PI / 3} />
        )}
        <ambientLight intensity={0.35} />
        {/* האור האחד: חם, מאחור ומלמעלה, ואור קצה כחול מהצד */}
        <directionalLight position={[3.5, 5.5, -3]} intensity={2.6} color="#FFD7A0" />
        <directionalLight position={[-5, 2, 3]} intensity={0.9} color="#5FB8FF" />
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={3} color="#FFD9A6" position={[3, 4, -4]} scale={[6, 3, 1]} />
          <Lightformer form="rect" intensity={1.6} color="#3FA9F5" position={[-5, 2, 3]} scale={[4, 4, 1]} />
          <Lightformer form="ring" intensity={0.8} color="#EBC47E" position={[0, 6, 0]} scale={3} />
        </Environment>
        {bokeh && <Bokeh center={[target[0], target[1] + 0.8, target[2] - 4]} spread={[size[0] * 2.4, size[1] * 2.2, 5]} />}
        <Suspense fallback={null}>{children}</Suspense>
        <GroundGlow y={shadowY} r={shadowScale * 0.35} />
        <EffectComposer multisampling={4} disableNormalPass>
          <Bloom mipmapBlur intensity={bloom} luminanceThreshold={0.3} luminanceSmoothing={0.3} radius={0.6} />
          <Vignette offset={0.3} darkness={0.55} eskil={false} />
        </EffectComposer>
      </Canvas>
      </div>
      <Callouts store={store} stageRef={stageRef} />
    </div>
    </CalloutCtx.Provider>
  );
}

// ---------- חומרים ----------
export function Brass({ color = '#C9974A', rough = 0.28 }) {
  return <meshStandardMaterial color={color} metalness={1} roughness={rough} envMapIntensity={1.6} emissive="#5A3810" emissiveIntensity={0.35} />;
}
// זכוכית וקרמיקה הופכות להולוגרמה: אותה צורה, זוהר בשוליים
const glassTone = (c) => (!c || c === '#ffffff' || c === '#F6EFE2' || c === '#F1E6D2' ? '#8FD8FF' : c);
export function Glass({ color, opacity = 1, tint = 0 }) {
  return <Holo color={glassTone(color)} base={tint ? 0.12 : 0.04} glow={1.25} opacity={opacity} />;
}
export function Ceramic({ color = '#8FD8FF' }) {
  return <Holo color={color} base={0.08} glow={1.2} />;
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
// כל תווית בסצנה היא קריאה מהשוליים: הטקסט מחוץ לגרפיקה, וקו הובלה אל הנקודה
export function FloatLabel({ position, title, sub, tone, size = 'm', onClick, active, side }) {
  return <CalloutAnchor position={position} title={title} sub={sub} tone={tone} size={size} onClick={onClick} active={active} side={side} />;
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
        <mesh><sphereGeometry args={[r, 64, 64]} /><Holo color={ELEMENT_COLOR.space} base={0.02} glow={1.5} power={2.6} /></mesh>
        <mesh><sphereGeometry args={[r * 0.08, 16, 16]} /><meshBasicMaterial color="#DDE6FF" toneMapped={false} /></mesh>
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
                <meshStandardMaterial color="#EAFBFF" emissive={ELEMENT_COLOR.air} emissiveIntensity={1.4} roughness={0.2} toneMapped={false} />
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
        <mesh scale={[1, 0.42, 1]}><sphereGeometry args={[r, 64, 64]} /><Holo color={ELEMENT_COLOR.water} base={0.18} glow={1.4} /></mesh>
        <mesh ref={ripple} rotation={[-Math.PI / 2, 0, 0]} position={[0, -r * 0.3, 0]}>
          <ringGeometry args={[r * 1.05, r * 1.09, 96]} />
          <meshBasicMaterial color={ELEMENT_COLOR.water} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }
  return (
    <group>
      <mesh geometry={stoneGeo}><meshStandardMaterial color="#6E5236" roughness={0.9} metalness={0.1} emissive="#3A2210" emissiveIntensity={0.5} /></mesh>
      <mesh geometry={stoneGeo} scale={1.04}><Holo color={ELEMENT_COLOR.earth} base={0.02} glow={1.2} power={3} /></mesh>
    </group>
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
      <meshStandardMaterial color="#E8C27A" emissive="#C08A3A" emissiveIntensity={0.9} metalness={0.6} roughness={0.3} toneMapped={false} />
    </mesh>
  );
}

export function BodySculpture({ d, tint, active = true, scale = 1, showElements = true }) {
  // גוף אדם אמיתי (BodyParts3D) כהולוגרמה, בפרופורציות של החוקה: ואטה צרה וגבוהה, קאפה רחבה
  const body = useBody();
  const b = BUILD3D[d];
  if (!body) return null;
  const H = 2.6 * b.h * scale;
  const k = H / body.height;
  const wx = Math.pow(b.w, 0.62);
  const op = active ? 1 : 0.3;
  return (
    <group scale={[k * wx, k, k * Math.pow(b.w, 0.5)]}>
      <mesh geometry={body.skin}><Holo color={tint} base={0.006} glow={0.95} power={2.7} opacity={op} /></mesh>
      <mesh geometry={body.bones}><Holo color="#BFE6FF" base={0.004} glow={0.32} power={2.6} opacity={op * 0.8} /></mesh>
      {showElements && (
        <>
          <group position={[0, body.height * 0.775, 0.02]} scale={[1 / (k * wx), 1 / k, 1 / (k * Math.pow(b.w, 0.5))]}><ElementObject id={b.el[0]} r={Math.min(0.11 * scale * 1.6, 0.22)} still={!active} /></group>
          <group position={[0, body.height * 0.66, 0.02]} scale={[1 / (k * wx), 1 / k, 1 / (k * Math.pow(b.w, 0.5))]}><ElementObject id={b.el[1]} r={Math.min(0.11 * scale * 1.6, 0.22)} still={!active} /></group>
        </>
      )}
    </group>
  );
}
export const bodyHeight = (d, scale = 1) => 2.6 * BUILD3D[d].h * scale;

// בסיס פליז דק מתחת לנושא
export function Plinth({ r = 0.5, y = 0 }) {
  return (
    <mesh position={[0, y + 0.02, 0]}>
      <cylinderGeometry args={[r, r * 1.04, 0.04, 64]} />
      <Brass rough={0.35} />
    </mesh>
  );
}
