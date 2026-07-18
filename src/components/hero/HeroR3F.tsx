"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { HeroContent } from "./HeroContent";

type PointerRef = React.MutableRefObject<{ x: number; y: number }>;

const GROUND_Y = -1.7;

// ─── Heat-plains ground: cracked earth + animated heat shimmer (shader) ──────
function useHeatGroundMaterial() {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColorLow: { value: new THREE.Color("#3a0e02") },
          uColorHigh: { value: new THREE.Color("#ff7a2e") },
        },
        vertexShader: /* glsl */ `
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec3 pos = position;
            pos.z += sin(pos.x * 2.2 + uTime * 1.6) * 0.05
                   + sin(pos.y * 3.1 - uTime * 1.1) * 0.035;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform vec3 uColorLow;
          uniform vec3 uColorHigh;
          varying vec2 vUv;

          float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }

          void main() {
            vec3 base = mix(uColorLow, uColorHigh, smoothstep(0.05, 0.95, vUv.y));

            // Cracked-earth grid lines, jittered per cell
            vec2 grid = vUv * 26.0;
            vec2 cell = floor(grid);
            float n = hash(cell);
            vec2 f = fract(grid);
            float crack = smoothstep(0.05, 0.0, abs(f.x - n))
                        + smoothstep(0.05, 0.0, abs(f.y - fract(n * 7.0)));
            vec3 color = mix(base, base * 0.32, clamp(crack, 0.0, 1.0));

            // Rising heat-shimmer brightening near the "horizon"
            float shimmer = 0.5 + 0.5 * sin(vUv.x * 22.0 + uTime * 2.4);
            color += uColorHigh * shimmer * 0.06 * vUv.y;

            gl_FragColor = vec4(color, 1.0);
          }
        `,
      }),
    [],
  );
}

function HeatPlains() {
  const material = useHeatGroundMaterial();
  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <mesh position={[-3.1, GROUND_Y, -1]} rotation={[-1.18, 0, 0.05]} material={material}>
      <planeGeometry args={[8.5, 6.5, 64, 48]} />
    </mesh>
  );
}

// ─── Kashmir mountain range — layered low-poly peaks with snow caps ──────────
const PEAKS = [
  { x: 3.2, z: -6.4, h: 4.2, r: 2.3, color: "#a9cee0", snow: true },
  { x: 5.4, z: -7.4, h: 5.0, r: 2.6, color: "#8fb9d6", snow: true },
  { x: 2.2, z: -4.2, h: 2.6, r: 1.6, color: "#7da6c4", snow: false },
  { x: 6.4, z: -5.2, h: 3.4, r: 2.0, color: "#bcd9ea", snow: true },
  { x: 4.3, z: -3.2, h: 2.1, r: 1.5, color: "#6c93b3", snow: false },
];

function KashmirMountains() {
  return (
    <group>
      {PEAKS.map((p, i) => (
        <group key={i} position={[p.x, GROUND_Y + p.h / 2, p.z]}>
          <mesh rotation={[0, (i * Math.PI) / 7, 0]}>
            <coneGeometry args={[p.r, p.h, 5]} />
            <meshStandardMaterial color={p.color} roughness={0.9} flatShading />
          </mesh>
          {p.snow && (
            <mesh
              position={[0, p.h * 0.3, 0]}
              scale={[0.6, 0.4, 0.6]}
              rotation={[0, (i * Math.PI) / 7, 0]}
            >
              <coneGeometry args={[p.r, p.h, 5]} />
              <meshStandardMaterial
                color="#f4fbff"
                roughness={0.55}
                flatShading
                emissive="#cdeeff"
                emissiveIntensity={0.18}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

// ─── Heat embers — rising particles over the plains (left) ──────────────────
const EMBER_COUNT = 200;

function HeatEmbers() {
  const pointsRef = useRef<THREE.Points>(null);
  const { positions, speeds, baseY, span } = useMemo(() => {
    const span = 6;
    const positions = new Float32Array(EMBER_COUNT * 3);
    const speeds = new Float32Array(EMBER_COUNT);
    const baseY = new Float32Array(EMBER_COUNT);
    for (let i = 0; i < EMBER_COUNT; i++) {
      const x = -7.5 + Math.random() * 4.5;
      const y = -2.5 + Math.random() * span;
      const z = -3.5 + Math.random() * 4.5;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      speeds[i] = 0.22 + Math.random() * 0.46;
      baseY[i] = y;
    }
    return { positions, speeds, baseY, span };
  }, []);

  useFrame(({ clock }) => {
    const geom = pointsRef.current?.geometry;
    if (!geom) return;
    const arr = geom.attributes.position.array as Float32Array;
    const t = clock.elapsedTime;
    for (let i = 0; i < EMBER_COUNT; i++) {
      const offset = (((baseY[i] + 2.5 + t * speeds[i]) % span) + span) % span;
      arr[i * 3 + 1] = offset - 2.5;
    }
    geom.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ff8a3d"
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Glowing center portal — the "Kashmir is calling" threshold ─────────────
function GlowPortal() {
  const ringRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  const glowTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2,
      );
      gradient.addColorStop(0, "rgba(56,176,128,0.85)");
      gradient.addColorStop(0.5, "rgba(56,176,128,0.22)");
      gradient.addColorStop(1, "rgba(56,176,128,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ringRef.current) ringRef.current.scale.setScalar(1 + Math.sin(t * 1.3) * 0.035);
    if (innerRef.current) innerRef.current.rotation.z = t * 0.18;
  });

  return (
    <group position={[0.2, 0.5, 1.2]}>
      <sprite scale={[6, 6, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.6}
        />
      </sprite>
      <mesh ref={ringRef}>
        <torusGeometry args={[1.4, 0.035, 16, 80]} />
        <meshBasicMaterial color="#22a878" toneMapped={false} />
      </mesh>
      <mesh ref={innerRef} rotation={[0, 0, Math.PI / 5]}>
        <torusGeometry args={[1.05, 0.02, 16, 80]} />
        <meshBasicMaterial color="#3fcf9c" toneMapped={false} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

// ─── Camera rig — subtle parallax driven by section-level pointer tracking ──
function CameraRig({ pointer }: { pointer: PointerRef }) {
  const { camera } = useThree();
  const lookTarget = useMemo(() => new THREE.Vector3(0.2, 0.5, 0), []);
  useFrame(() => {
    const targetX = pointer.current.x * 0.7;
    const targetY = 0.4 - pointer.current.y * 0.4;
    camera.position.x += (targetX - camera.position.x) * 0.045;
    camera.position.y += (targetY - camera.position.y) * 0.045;
    camera.lookAt(lookTarget);
  });
  return null;
}

function Scene({ pointer }: { pointer: PointerRef }) {
  return (
    <>
      <color attach="background" args={["#0a1830"]} />
      <fog attach="fog" args={["#0a1830", 9, 22]} />

      <ambientLight intensity={0.5} />
      <pointLight position={[-6, 2.5, 4]} color="#ff7a33" intensity={60} distance={22} />
      <pointLight position={[6, 3.5, 1]} color="#39c6ff" intensity={55} distance={22} />
      <directionalLight position={[0, 6, 5]} intensity={0.35} color="#ffffff" />

      <CameraRig pointer={pointer} />

      <HeatPlains />
      <HeatEmbers />
      <KashmirMountains />
      <Sparkles
        count={130}
        scale={[6.5, 6, 4]}
        position={[3.6, 0.8, -1]}
        size={2.2}
        speed={0.25}
        color="#bfe9ff"
        opacity={0.55}
      />
      <GlowPortal />
    </>
  );
}

// ─── Cinematic Three.js hero — gated behind NEXT_PUBLIC_HERO_MODE="r3f" ──────
// Falls back to HeroParallax on mobile / reduced-motion / slow connections (see Hero.tsx).
export function HeroR3F() {
  const pointer = useRef({ x: 0, y: 0 });

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointer.current = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: ((e.clientY - rect.top) / rect.height) * 2 - 1,
    };
  };
  const handlePointerLeave = () => {
    pointer.current = { x: 0, y: 0 };
  };

  return (
    <section
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative min-h-screen flex flex-col overflow-hidden bg-brand-navy"
      aria-label="Hero — Kashmir holiday promotion"
    >
      {/* ── 3D SCENE ──────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <Canvas
          camera={{ position: [0, 0.4, 8.5], fov: 42 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: false }}
        >
          <Scene pointer={pointer} />
        </Canvas>
      </div>

      {/* Readability overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent 45%, rgba(0,0,0,0.6))",
        }}
        aria-hidden
      />

      <HeroContent />
    </section>
  );
}
