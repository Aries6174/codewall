"use client";

import { useMemo, useRef, useSyncExternalStore } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ShaderMaterial, Vector2 } from "three";

/**
 * CODEWALL_ / Black Hole Background
 *
 * A GPU-rendered, stylized black hole: dark event horizon, golden photon ring,
 * tilted accretion disk, gravitational glow, and distant stars.
 *
 * This is an artistic shader rather than a physically accurate simulation.
 * It is intentionally dim so the code editor stays legible.
 *
 * Dependencies: three, @react-three/fiber, @types/three
 * Usage: <ThreeBackground /> as the first child of the page's <main>.
 */

// Adjust these two values to position and brighten/dim the scene.
const BLACK_HOLE_CENTER: [number, number] = [0.49, 0.53]; // 0 = left/bottom, 1 = right/top
const BRIGHTNESS = 0.10; // Try 0.6 for a quieter background, 1.0 for brighter gold.

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uAspect;
  uniform float uBrightness;
  uniform vec2 uCenter;
  varying vec2 vUv;

  // Very small, inexpensive noise helpers for dusty ring texture.
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float glowLine(float distanceToLine, float width) {
    return exp(-pow(distanceToLine / max(width, 0.0001), 2.0));
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv - uCenter;
    p.x *= uAspect; // Keep the event horizon circular across aspect ratios.
    float radius = length(p);
    float theta = atan(p.y, p.x);
    float t = uTime * 0.11;

    // Slightly blue-black space, nearly black at the edges.
    vec3 color = vec3(0.0028, 0.0040, 0.0037);

    // Sparse, mostly fixed stars; no geometry or extra draw calls required.
    vec2 starUv = uv * vec2(uAspect, 1.0) * 105.0;
    vec2 cell = floor(starUv);
    vec2 starPos = vec2(hash21(cell + 12.7), hash21(cell + 88.4));
    float starDist = length(fract(starUv) - starPos);
    float star = step(0.987, hash21(cell + 42.1))
               * glowLine(starDist, 0.045)
               * (0.50 + 0.10 * sin(uTime * 0.3 + cell.x));
    color += vec3(0.72, 0.57, 0.35) * star * 0.46;

    // A very faint warm cloud around the accretion disk.
    float cloudNoise = noise2(p * 6.5 + vec2(t * 0.08, 1.3));
    float cloud = exp(-pow(radius / 0.53, 2.0));
    color += vec3(0.065, 0.026, 0.003) * cloud
           * (0.45 + 0.55 * cloudNoise);

    // Tip the disk gently upward to the right. It remains elliptical, as a
    // projected accretion disk should, rather than becoming a circular orbit.
    float c = 0.986;
    float s = 0.167;
    vec2 tilted = vec2(c * p.x + s * p.y, -s * p.x + c * p.y);
    float diskRadius = length(vec2(tilted.x / 0.55, tilted.y / 0.090));

    // Winding, gently moving trails inside the glowing accretion flow.
    float spin = atan(tilted.y * 2.5, tilted.x);
    float ribbon = 0.5 + 0.5 * sin(spin * 8.0 - diskRadius * 21.0 + t * 1.2);
    float textureNoise = noise2(vec2(diskRadius * 35.0 - t * 0.7, spin * 5.0));
    float texture = 0.54 + 0.29 * ribbon + 0.29 * textureNoise;

    // Multiple thin, overlapping streaks give depth without 3D particles.
    float wideBand  = glowLine(diskRadius - 0.91, 0.22) * 0.30;
    float innerBand = glowLine(diskRadius - 0.73, 0.095) * 0.52;
    float outerBand = glowLine(diskRadius - 1.13, 0.075) * 0.22;
    float fineLine  = glowLine(diskRadius - 0.99, 0.018) * 0.22;

    // Slightly brighter on the left, similar to the reference image.
    float asymmetry = 1.13 - 0.35 * smoothstep(-0.55, 0.5, p.x);
    float flow = (wideBand + innerBand + outerBand + fineLine)
               * texture * asymmetry;

    // Disk glow spreads past the crisp trails.
    float diskHaze = exp(-abs(tilted.y) / 0.105)
                   * exp(-pow(tilted.x / 0.65, 2.0)) * 0.13;
    float diskEmission = flow + diskHaze;
    color += vec3(1.00, 0.43, 0.075) * diskEmission * 0.92;
    color += vec3(1.00, 0.74, 0.28) * flow * 0.26;

    // Broad gravitational lensing halo surrounding the event horizon.
    float lensHalo = glowLine(radius - 0.155, 0.055) * 0.18;
    color += vec3(0.72, 0.29, 0.035) * lensHalo;

    // Dark central silhouette always sits in front of the disk.
    float shadow = 1.0 - smoothstep(0.113, 0.124, radius);
    color = mix(color, vec3(0.00030, 0.00035, 0.00030), shadow);

    // Bright narrow photon ring and a thinner secondary bent-light arc.
    float photonRing = glowLine(radius - 0.127, 0.0035);
    float photonBloom = glowLine(radius - 0.130, 0.017) * 0.32;
    float lensArc = glowLine(radius - 0.173 - 0.013 * sin(theta + 0.6), 0.006)
                  * smoothstep(-0.5, 0.65, sin(theta + 0.4)) * 0.20;

    // The small bright knot near the lower left of the silhouette.
    float hotspot = glowLine(length((p - vec2(-0.18, -0.042)) * vec2(1.0, 1.8)), 0.023)
                  * 0.86;

    color += vec3(1.0, 0.54, 0.13)
           * (photonRing * 0.50 + photonBloom + lensArc + hotspot);
    color += vec3(1.0, 0.80, 0.39) * photonRing * 0.22;

    // Keep the far-right info column and screen edges comfortably readable.
    float rightSideFade = 1.0 - 0.30 * smoothstep(0.70, 0.98, uv.x);
    float vignette = 1.0 - 0.40 * smoothstep(0.46, 1.02, length((uv - 0.5) * vec2(uAspect, 1.0)));
    color *= rightSideFade * vignette * uBrightness;

    // Soft filmic tonemapping, then convert to display gamma.
    color = 1.0 - exp(-color * 1.55);
    color = pow(color, vec3(1.0 / 2.2));
    gl_FragColor = vec4(color, 1.0);
  }
`;

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const media = window.matchMedia(MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia(MOTION_QUERY).matches;
}

function BlackHolePlane() {
  const material = useRef<ShaderMaterial>(null);
  const { viewport, size } = useThree();

  // Keep object identity stable: React Three Fiber forwards these to the GPU.
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAspect: { value: size.width / Math.max(size.height, 1) },
      uBrightness: { value: BRIGHTNESS },
      uCenter: { value: new Vector2(...BLACK_HOLE_CENTER) },
    }),
    [size.width, size.height]
  );

  useFrame(({ clock }) => {
    if (material.current) {
      material.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Full-page, non-interactive background. Your page UI stays on top. */
export default function ThreeBackground() {
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getReducedMotion,
    () => true
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ backgroundColor: "#020403" }}
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50, near: 0.1, far: 10 }}
        dpr={[1, 1.5]}
        gl={{ alpha: false, antialias: false, powerPreference: "low-power" }}
        frameloop={reducedMotion ? "demand" : "always"}
        fallback={
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 59% 53%, #241507 0%, #080906 27%, #020403 65%)",
            }}
          />
        }
      >
        <BlackHolePlane />
      </Canvas>
    </div>
  );
}
