"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    // subtle breathing along the normals so the surface feels alive
    float breathe = sin(uTime * 0.9 + position.y * 2.0) * 0.012
                  + sin(uTime * 1.7 + position.x * 3.0) * 0.006;
    vec3 pos = position + normal * breathe;

    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Screen-space halftone: light the surface, then draw one mark per 12px
// screen cell whose radius follows the local brightness. Marks morph
// between circles (shadow) and diamonds (light); cells near the cursor
// swell and burn red.
const FRAGMENT_SHADER = /* glsl */ `
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uIsTouch;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(-vViewPosition);

    vec3 mouseLight = vec3(uMouse.x * 2.5, uMouse.y * 2.5, 1.5);
    vec3 autoLight = vec3(sin(uTime * 0.4) * 1.5, cos(uTime * 0.27) * 1.0, 1.5);
    vec3 lightDir = normalize(mix(mouseLight, autoLight, uIsTouch));

    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfVec), 0.0), 80.0);
    float specHard = pow(max(dot(normal, halfVec), 0.0), 200.0);
    float specular = spec * 0.5 + specHard * 0.8;

    float rim = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.5) * 0.45;
    float diffuse = max(dot(normal, lightDir), 0.0) * 0.28;

    float lightLevel = clamp(diffuse * 1.4 + rim * 0.9 + specular * 3.0, 0.0, 1.0);
    float lightShaped = smoothstep(0.1, 0.8, lightLevel);

    float cellSize = 12.0;
    vec2 cellId = floor(gl_FragCoord.xy / cellSize);
    vec2 cellLocal = fract(gl_FragCoord.xy / cellSize) - 0.5;
    // circle in the shadows, diamond in the light
    float circleDist = length(cellLocal);
    float diamondDist = (abs(cellLocal.x) + abs(cellLocal.y)) * 0.82;
    float dotDist = mix(circleDist, diamondDist, lightShaped);
    float cellHash = fract(sin(dot(cellId, vec2(127.1, 311.7))) * 43758.5453);
    float cellHash2 = fract(sin(dot(cellId, vec2(91.34, 47.71))) * 28471.13);
    float pulsePrimary = sin(uTime * 2.2 + cellHash * 6.2831) * 0.5 + 0.5;
    float pulseSecondary = sin(uTime * 1.3 + cellHash2 * 6.2831) * 0.5 + 0.5;

    vec2 cursorPx = (uMouse * 0.5 + 0.5) * uResolution;
    vec2 cellCenterPx = (cellId + 0.5) * cellSize;
    float cursorDistPx = distance(cellCenterPx, cursorPx);
    float cursorInfluence = (1.0 - smoothstep(0.0, 220.0, cursorDistPx)) * (1.0 - uIsTouch);

    float dotRadius = lightShaped * 0.6
      + (pulsePrimary - 0.5) * 0.10 * lightShaped
      + (pulseSecondary - 0.5) * 0.06 * lightShaped
      + cursorInfluence * 0.35;
    dotRadius = max(dotRadius, 0.0);
    float dotMask = smoothstep(dotRadius + 0.08, dotRadius - 0.08, dotDist);

    vec3 dotColor = vec3(1.0);
    vec3 cursorColor = vec3(1.0, 0.23, 0.19); // red burn around the cursor
    vec3 mixedDotColor = mix(dotColor, cursorColor, cursorInfluence);
    vec3 hotTint = vec3(0.35, 1.0, 0.6) * pow(specular, 1.2) * 2.0 * (1.0 - cursorInfluence);
    vec3 color = mix(vec3(0.0), mixedDotColor + hotTint, dotMask);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function CatBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 5);

    const uniforms = {
      uMouse: { value: new THREE.Vector2(0, 0) },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uTime: { value: 0 },
      uIsTouch: { value: window.matchMedia("(pointer: coarse)").matches ? 1 : 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
    });

    const group = new THREE.Group();
    scene.add(group);

    let disposed = false;
    new GLTFLoader().load("/glb/cat.glb", (gltf) => {
      if (disposed) return;
      const model = gltf.scene;
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) child.material = material;
      });

      // center the model and scale it to a consistent height
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      model.position.sub(center);
      const scale = 2.6 / Math.max(size.x, size.y, size.z);
      group.scale.setScalar(scale);
      group.add(model);
    });

    const targetMouse = new THREE.Vector2(0, 0);
    const smoothMouse = new THREE.Vector2(0, 0);

    const onPointerMove = (e: PointerEvent) => {
      targetMouse.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1)
      );
    };
    window.addEventListener("pointermove", onPointerMove);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      uniforms.uTime.value = t;

      // damped cursor + gentle head-follow rotation 
      smoothMouse.lerp(targetMouse, 0.05);
      uniforms.uMouse.value.set(smoothMouse.x, smoothMouse.y);
      group.rotation.y = smoothMouse.x * 0.35 + Math.sin(t * 0.25) * 0.08;
      group.rotation.x = -smoothMouse.y * 0.2 + Math.cos(t * 0.31) * 0.04;
      group.position.y = Math.sin(t * 0.5) * 0.05;

      renderer.render(scene, camera);
    };
    tick();

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="fixed inset-0 z-0 transition-opacity duration-700"
      style={{ opacity: isHome ? 1 : 0.12 }}
    />
  );
}
