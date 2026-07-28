"use client";

import { useEffect, useId, useRef } from "react";
import * as THREE from "three";

import styles from "./location-orb-illustration.module.css";

type LocationOrbIllustrationProps = {
  className?: string;
  status?: "idle" | "locating" | "ready";
};

function createPinGeometry() {
  const pin = new THREE.Shape();
  pin.moveTo(0, -1.22);
  pin.bezierCurveTo(-0.2, -0.93, -0.82, -0.15, -0.82, 0.42);
  pin.bezierCurveTo(-0.82, 1.06, -0.46, 1.43, 0, 1.43);
  pin.bezierCurveTo(0.46, 1.43, 0.82, 1.06, 0.82, 0.42);
  pin.bezierCurveTo(0.82, -0.15, 0.2, -0.93, 0, -1.22);

  const aperture = new THREE.Path();
  aperture.absellipse(0, 0.48, 0.27, 0.27, 0, Math.PI * 2, false);
  pin.holes.push(aperture);

  const geometry = new THREE.ExtrudeGeometry(pin, {
    bevelEnabled: true,
    bevelSegments: 5,
    bevelSize: 0.08,
    bevelThickness: 0.07,
    curveSegments: 28,
    depth: 0.32,
    steps: 1,
  });
  geometry.translate(0, 0, -0.16);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Repère de localisation sculptural propre à Leco.
 *
 * Le canvas ne représente aucune coordonnée réelle. Il traduit uniquement
 * l’état de la permission par son mouvement, sa lumière et ses ondes.
 */
export function LocationOrbIllustration({
  className,
  status = "idle",
}: LocationOrbIllustrationProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const id = useId().replaceAll(":", "");
  const surface = `leco-surface-${id}`;
  const beacon = `leco-beacon-${id}`;
  const glow = `leco-glow-${id}`;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof window.WebGLRenderingContext === "undefined") return;

    const canvas = document.createElement("canvas");
    canvas.className = styles.canvas;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 30);
    camera.position.set(0, 2.45, 7.1);
    camera.lookAt(0, 0.72, 0);

    const world = new THREE.Group();
    world.rotation.y = -0.18;
    scene.add(world);

    const map = new THREE.Group();
    world.add(map);

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x49362f,
      metalness: 0.12,
      roughness: 0.56,
    });
    const topMaterial = new THREE.MeshStandardMaterial({
      color: 0xe9b386,
      metalness: 0.08,
      roughness: 0.48,
    });
    const lineMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd4ad,
      opacity: 0.45,
      transparent: true,
    });
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x100b0a,
      opacity: 0.3,
      transparent: true,
    });

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.74, 1.86, 0.24, 64),
      baseMaterial,
    );
    base.position.y = -0.06;
    map.add(base);

    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(1.62, 1.72, 0.08, 64),
      topMaterial,
    );
    top.position.y = 0.1;
    map.add(top);

    const route = new THREE.Mesh(
      new THREE.TorusGeometry(0.93, 0.018, 8, 96),
      lineMaterial,
    );
    route.position.y = 0.155;
    route.rotation.x = Math.PI / 2;
    route.scale.y = 0.62;
    map.add(route);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.76, 48),
      shadowMaterial,
    );
    shadow.position.set(0, 0.165, 0.05);
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(1, 0.58, 1);
    map.add(shadow);

    const pulseMaterials = Array.from(
      { length: 3 },
      () =>
        new THREE.MeshBasicMaterial({
          color: 0xffad68,
          opacity: 0,
          transparent: true,
        }),
    );
    const pulses = pulseMaterials.map((material, index) => {
      const pulse = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.018, 8, 72),
        material,
      );
      pulse.position.y = 0.18 + index * 0.002;
      pulse.rotation.x = Math.PI / 2;
      map.add(pulse);
      return pulse;
    });

    const pinMaterial = new THREE.MeshStandardMaterial({
      color: 0xff7658,
      emissive: 0x35110b,
      emissiveIntensity: 0.35,
      metalness: 0.16,
      roughness: 0.27,
    });
    const pin = new THREE.Mesh(createPinGeometry(), pinMaterial);
    pin.position.y = 1.08;
    pin.scale.setScalar(0.76);
    world.add(pin);

    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xffefcf,
      emissive: 0xff925d,
      emissiveIntensity: 1.55,
      metalness: 0.04,
      roughness: 0.22,
    });
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 28, 18),
      coreMaterial,
    );
    core.position.set(0, 1.45, 0.27);
    world.add(core);

    scene.add(new THREE.HemisphereLight(0xffe7cc, 0x2e1a20, 2.15));

    const keyLight = new THREE.DirectionalLight(0xfff1d7, 4.2);
    keyLight.position.set(-3.5, 5.5, 5);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xff6f61, 18, 8, 2);
    rimLight.position.set(3, 2.2, 2.4);
    scene.add(rimLight);

    const readyColor = new THREE.Color(0x72c78f);
    const accentColor = new THREE.Color(0xff7658);
    const timer = new THREE.Timer();
    timer.connect(document);
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    );
    let frame: number | null = null;
    let isVisible = true;
    let disposed = false;
    let pointerX = 0;
    let pointerY = 0;

    function resize() {
      const width = Math.max(host?.clientWidth ?? 0, 1);
      const height = Math.max(host?.clientHeight ?? 0, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function draw(timestamp?: number) {
      if (disposed) return;

      timer.update(timestamp);
      const time = timer.getElapsed();
      const currentStatus = host?.dataset.status ?? "idle";
      const reduced = Boolean(prefersReducedMotion?.matches);
      const locating = currentStatus === "locating";
      const ready = currentStatus === "ready";
      const motion = reduced ? 0 : 1;

      world.rotation.y +=
        (pointerX * 0.16 +
          Math.sin(time * 0.55) * 0.08 * motion -
          world.rotation.y) *
        0.045;
      world.rotation.x +=
        (pointerY * 0.08 +
          Math.sin(time * 0.72) * 0.018 * motion -
          world.rotation.x) *
        0.04;
      pin.position.y =
        1.08 + Math.sin(time * (locating ? 1.8 : 1.05)) * 0.055 * motion;
      core.position.y = pin.position.y + 0.37;
      core.scale.setScalar(1 + Math.sin(time * 2.2) * 0.045 * motion);
      map.rotation.y = Math.sin(time * 0.28) * 0.055 * motion;

      pinMaterial.color.lerp(ready ? readyColor : accentColor, 0.055);
      rimLight.color.lerp(ready ? readyColor : accentColor, 0.055);

      pulses.forEach((pulse, index) => {
        const speed = locating ? 1.45 : ready ? 0.72 : 0.46;
        const progress = (time * speed + index / pulses.length) % 1;
        const scale = 0.82 + progress * 2.25;
        pulse.scale.setScalar(scale);
        pulseMaterials[index].opacity =
          (1 - progress) * (locating ? 0.5 : ready ? 0.25 : 0.16) * motion;
      });

      renderer.render(scene, camera);
      host?.setAttribute("data-webgl", "ready");

      if (!reduced && isVisible) {
        frame = window.requestAnimationFrame(draw);
      } else {
        frame = null;
      }
    }

    function start() {
      if (frame === null) frame = window.requestAnimationFrame(draw);
    }

    function handlePointerMove(event: PointerEvent) {
      const bounds = host?.getBoundingClientRect();
      if (!bounds) return;
      pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    }

    function handlePointerLeave() {
      pointerX = 0;
      pointerY = 0;
    }

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            resize();
            start();
          });
    const intersectionObserver =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            isVisible = entry?.isIntersecting ?? true;
            if (isVisible) start();
            else if (frame !== null) {
              window.cancelAnimationFrame(frame);
              frame = null;
            }
          });

    resizeObserver?.observe(host);
    intersectionObserver?.observe(host);
    prefersReducedMotion?.addEventListener?.("change", start);
    host.addEventListener("pointermove", handlePointerMove);
    host.addEventListener("pointerleave", handlePointerLeave);
    resize();
    start();

    return () => {
      disposed = true;
      if (frame !== null) window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      prefersReducedMotion?.removeEventListener?.("change", start);
      host.removeEventListener("pointermove", handlePointerMove);
      host.removeEventListener("pointerleave", handlePointerLeave);
      timer.dispose();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
      canvas.remove();
      host.removeAttribute("data-webgl");
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={[styles.root, className].filter(Boolean).join(" ")}
      data-status={status}
      ref={hostRef}
    >
      <svg
        className={styles.fallback}
        fill="none"
        focusable="false"
        viewBox="0 0 260 220"
      >
        <defs>
          <linearGradient id={surface} x1="76" x2="195" y1="59" y2="183">
            <stop stopColor="#f4c094" />
            <stop offset="1" stopColor="#795044" />
          </linearGradient>
          <linearGradient id={beacon} x1="113" x2="151" y1="71" y2="145">
            <stop stopColor={status === "ready" ? "#82d09b" : "#ff8f70"} />
            <stop
              offset="1"
              stopColor={status === "ready" ? "#397e52" : "#a63d42"}
            />
          </linearGradient>
          <radialGradient id={glow}>
            <stop stopColor="#f0a24c" stopOpacity=".42" />
            <stop offset="1" stopColor="#f0a24c" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="130" cy="183" fill={`url(#${glow})`} rx="104" ry="29" />
        <g className={styles.fallbackMap}>
          <path
            d="m36 125 94-54 94 54-94 55-94-55Z"
            fill={`url(#${surface})`}
          />
          <path d="m36 125 94 55v23l-94-55v-23Z" fill="#684137" />
          <path d="m224 125-94 55v23l94-55v-23Z" fill="#52312e" />
          <path
            d="m70 126 60-35 60 35-60 35-60-35Z"
            stroke="#ffd4ad"
            strokeDasharray="5 7"
            strokeOpacity=".45"
            strokeWidth="2"
          />
        </g>
        <g className={styles.fallbackBeacon}>
          <path
            d="M130 42c-22 0-39 17-39 39 0 31 39 66 39 66s39-35 39-66c0-22-17-39-39-39Z"
            fill={`url(#${beacon})`}
          />
          <ellipse cx="130" cy="81" fill="#fff0d3" rx="14" ry="16" />
        </g>
      </svg>
    </div>
  );
}
