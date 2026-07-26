"use client";

import { useEffect, useRef, useState } from "react";

import { LockIcon, RadarIcon } from "@/components/ui/icons";

const people = [
  { distance: "Tout près", id: "awa", name: "Awa" },
  { distance: "Dans ton secteur", id: "yann", name: "Yann" },
  { distance: "À moins d’un km", id: "mariam", name: "Mariam" },
] as const;

interface ProximityFieldProps {
  onSelect?: (profileId: string) => void;
  selectedId?: string;
}

export function ProximityField({
  onSelect,
  selectedId: controlledSelectedId,
}: ProximityFieldProps) {
  const [internalSelectedId, setInternalSelectedId] = useState("awa");
  const [rendererReady, setRendererReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const selectedId = controlledSelectedId ?? internalSelectedId;

  useEffect(() => {
    const canvas = canvasRef.current;
    const field = fieldRef.current;

    if (!canvas || !field) {
      return;
    }

    let cancelled = false;
    let animationFrame = 0;
    let resizeObserver: ResizeObserver | undefined;

    async function mountScene() {
      const THREE = await import("three");

      if (cancelled || !canvasRef.current || !fieldRef.current) {
        return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas: canvasRef.current,
        powerPreference: "high-performance",
      });
      const group = new THREE.Group();
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      function tokenColor(token: string) {
        const probe = document.createElement("span");
        probe.style.color = `var(${token})`;
        probe.style.position = "absolute";
        probe.style.visibility = "hidden";
        fieldRef.current?.appendChild(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();

        const sampler = document.createElement("canvas");
        sampler.width = 1;
        sampler.height = 1;
        const context = sampler.getContext("2d", { willReadFrequently: true });

        if (!context) {
          return new THREE.Color(resolved);
        }

        context.fillStyle = resolved;
        context.fillRect(0, 0, 1, 1);
        const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;

        return new THREE.Color().setRGB(
          red / 255,
          green / 255,
          blue / 255,
          THREE.SRGBColorSpace,
        );
      }

      const ringMaterial = new THREE.LineBasicMaterial({
        color: tokenColor("--color-rule-2"),
        opacity: 0.46,
        transparent: true,
      });
      const connectionMaterial = new THREE.LineBasicMaterial({
        color: tokenColor("--color-accent"),
        opacity: 0.28,
        transparent: true,
      });
      const nodeColors = [
        tokenColor("--color-profile-1"),
        tokenColor("--color-profile-2"),
        tokenColor("--color-profile-3"),
      ];
      const positions = [
        new THREE.Vector3(1.4, 0.82, 0.08),
        new THREE.Vector3(-1.55, -0.35, 0.18),
        new THREE.Vector3(0.4, -1.42, 0.28),
      ];
      const geometries: Array<{ dispose: () => void }> = [];
      const materials: Array<{ dispose: () => void }> = [
        ringMaterial,
        connectionMaterial,
      ];

      [1.05, 1.95, 2.85].forEach((radius) => {
        const curve = new THREE.EllipseCurve(
          0,
          0,
          radius,
          radius * 0.74,
          0,
          Math.PI * 2,
        );
        const geometry = new THREE.BufferGeometry().setFromPoints(
          curve.getPoints(112),
        );
        geometries.push(geometry);
        group.add(new THREE.LineLoop(geometry, ringMaterial));
      });

      const connectionGeometry = new THREE.BufferGeometry().setFromPoints(
        positions.flatMap((position) => [new THREE.Vector3(), position]),
      );
      geometries.push(connectionGeometry);
      group.add(new THREE.LineSegments(connectionGeometry, connectionMaterial));

      const centerGeometry = new THREE.CircleGeometry(0.2, 36);
      const centerMaterial = new THREE.MeshBasicMaterial({
        color: tokenColor("--color-accent"),
      });
      geometries.push(centerGeometry);
      materials.push(centerMaterial);
      group.add(new THREE.Mesh(centerGeometry, centerMaterial));

      positions.forEach((position, index) => {
        const geometry = new THREE.CircleGeometry(
          selectedId === people[index].id ? 0.2 : 0.14,
          32,
        );
        const material = new THREE.MeshBasicMaterial({
          color: nodeColors[index],
        });
        const node = new THREE.Mesh(geometry, material);
        node.position.copy(position);
        geometries.push(geometry);
        materials.push(material);
        group.add(node);
      });

      group.rotation.x = -0.12;
      scene.add(group);
      camera.position.z = 6.5;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

      const target = { x: group.rotation.x, y: group.rotation.y };

      function draw() {
        group.rotation.x += (target.x - group.rotation.x) * 0.14;
        group.rotation.y += (target.y - group.rotation.y) * 0.14;
        renderer.render(scene, camera);

        const moving =
          Math.abs(target.x - group.rotation.x) > 0.001 ||
          Math.abs(target.y - group.rotation.y) > 0.001;

        if (moving && !reducedMotion) {
          animationFrame = requestAnimationFrame(draw);
        }
      }

      function resize() {
        const width = fieldRef.current?.clientWidth ?? 0;
        const height = fieldRef.current?.clientHeight ?? 0;

        if (!width || !height) {
          return;
        }

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        renderer.render(scene, camera);
      }

      function handlePointerMove(event: PointerEvent) {
        if (reducedMotion || !fieldRef.current) {
          return;
        }

        const bounds = fieldRef.current.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        target.x = -0.12 + y * 0.09;
        target.y = x * 0.12;
        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(draw);
      }

      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(fieldRef.current);
      fieldRef.current.addEventListener("pointermove", handlePointerMove);
      resize();
      setRendererReady(true);

      return () => {
        fieldRef.current?.removeEventListener("pointermove", handlePointerMove);
        resizeObserver?.disconnect();
        cancelAnimationFrame(animationFrame);
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((material) => material.dispose());
        renderer.dispose();
      };
    }

    let disposeScene: (() => void) | undefined;
    void mountScene().then((dispose) => {
      disposeScene = dispose;
    });

    return () => {
      cancelled = true;
      disposeScene?.();
      resizeObserver?.disconnect();
      cancelAnimationFrame(animationFrame);
    };
  }, [selectedId]);

  function selectProfile(profileId: string) {
    setInternalSelectedId(profileId);
    onSelect?.(profileId);
  }

  return (
    <figure className="proximity">
      <div className="proximity__heading">
        <div>
          <span className="surface-label">Rayon privé</span>
          <h2 id="proximity-title">Ton soir, en un regard</h2>
        </div>
        <span className="proximity__live">
          <span aria-hidden="true" />
          Actualisé
        </span>
      </div>

      <div
        aria-labelledby="proximity-title"
        className="proximity__field"
        data-renderer={rendererReady ? "ready" : "fallback"}
        ref={fieldRef}
        role="group"
      >
        <div aria-hidden="true" className="proximity__fallback">
          <span className="proximity__ring proximity__ring--1" />
          <span className="proximity__ring proximity__ring--2" />
          <span className="proximity__ring proximity__ring--3" />
          <RadarIcon />
        </div>
        <canvas aria-hidden="true" ref={canvasRef} />
        <span aria-hidden="true" className="proximity__you">
          Toi
        </span>
        {people.map((person, index) => (
          <button
            aria-pressed={selectedId === person.id}
            className={`proximity__node proximity__node--${index + 1}`}
            key={person.id}
            onClick={() => selectProfile(person.id)}
            type="button"
          >
            <span aria-hidden="true" className="proximity__node-signal" />
            <span>
              <strong>{person.name}</strong>
              <small>{person.distance}</small>
            </span>
          </button>
        ))}
      </div>

      <figcaption>
        <LockIcon />
        <span>
          <strong>Distance approximative uniquement.</strong> Aucune adresse,
          coordonnée ou trajectoire n’est affichée.
        </span>
      </figcaption>
    </figure>
  );
}
