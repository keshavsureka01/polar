"use client";

import { useEffect, useRef } from "react";
import type { LocationResult } from "@/types/live";

interface TelemetryGlobeProps {
  location: LocationResult;
  active: boolean;
}

export function TelemetryGlobe({ location, active }: TelemetryGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let animationId = 0;

    async function mountGlobe() {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const activeCanvas = canvas;

      const THREE = await import("three");
      if (disposed) {
        return;
      }

      const renderer = new THREE.WebGLRenderer({ canvas: activeCanvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0.2, 4.8);

      const group = new THREE.Group();
      scene.add(group);

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.45, 64, 64),
        new THREE.MeshBasicMaterial({ color: 0x0b1324, wireframe: true, transparent: true, opacity: 0.42 })
      );
      group.add(sphere);

      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 64, 64),
        new THREE.MeshBasicMaterial({ color: 0x0e7490, transparent: true, opacity: 0.08 })
      );
      group.add(atmosphere);

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 20, 20),
        new THREE.MeshBasicMaterial({ color: active ? 0x22d3ee : 0xf59e0b })
      );
      marker.position.copy(latLonToVector3(location.latitude, location.longitude, 1.56, THREE));
      group.add(marker);

      const markerRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.09, 0.004, 8, 48),
        new THREE.MeshBasicMaterial({ color: active ? 0x22d3ee : 0xf59e0b, transparent: true, opacity: 0.8 })
      );
      markerRing.position.copy(marker.position);
      markerRing.lookAt(new THREE.Vector3(0, 0, 0));
      group.add(markerRing);

      const gridMaterial = new THREE.LineBasicMaterial({ color: 0x1e3a5f, transparent: true, opacity: 0.45 });
      for (let i = -60; i <= 60; i += 30) {
        group.add(makeLatitudeLine(i, THREE, gridMaterial));
      }
      for (let i = 0; i < 180; i += 30) {
        const line = makeLongitudeLine(i, THREE, gridMaterial);
        group.add(line);
      }

      function resize() {
        const rect = activeCanvas.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      function animate(time: number) {
        resize();
        group.rotation.y = time * 0.00008;
        markerRing.scale.setScalar(1 + Math.sin(time * 0.004) * 0.12);
        renderer.render(scene, camera);
        animationId = window.requestAnimationFrame(animate);
      }

      animate(0);

      return () => {
        window.cancelAnimationFrame(animationId);
        renderer.dispose();
        sphere.geometry.dispose();
        atmosphere.geometry.dispose();
        marker.geometry.dispose();
        markerRing.geometry.dispose();
        sphere.material.dispose();
        atmosphere.material.dispose();
        marker.material.dispose();
        markerRing.material.dispose();
      };
    }

    let cleanup: (() => void) | undefined;
    mountGlobe().then((dispose) => {
      cleanup = dispose;
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [active, location.latitude, location.longitude]);

  return (
    <div className="relative min-h-[300px] min-w-0 overflow-hidden rounded-lg border border-slate-800 bg-[#080d16] lg:min-h-[420px]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Live global telemetry position visualizer" />
      <div className="pointer-events-none absolute left-4 top-4 rounded border border-cyan-800/60 bg-slate-950/70 px-3 py-2 font-mono text-xs text-slate-300">
        <div className="font-semibold text-cyan-300">LIVE SITE LOCK</div>
        <div className="mt-1 text-slate-400">
          {location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}
        </div>
      </div>
    </div>
  );
}

function latLonToVector3(latitude: number, longitude: number, radius: number, THREE: typeof import("three")) {
  const phi = (90 - latitude) * (Math.PI / 180);
  const theta = (longitude + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function makeLatitudeLine(latitude: number, THREE: typeof import("three"), material: import("three").LineBasicMaterial) {
  const radius = Math.cos(latitude * (Math.PI / 180)) * 1.46;
  const y = Math.sin(latitude * (Math.PI / 180)) * 1.46;
  const points = Array.from({ length: 121 }, (_, index) => {
    const angle = (index / 120) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  });

  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
}

function makeLongitudeLine(longitude: number, THREE: typeof import("three"), material: import("three").LineBasicMaterial) {
  const points = Array.from({ length: 121 }, (_, index) => {
    const latitude = -90 + (index / 120) * 180;
    return latLonToVector3(latitude, longitude, 1.465, THREE);
  });

  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
}
