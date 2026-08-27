"use client";

import { Compass, Globe, Radio, Target, Zap } from "lucide-react";
import { useEffect, useRef } from "react";
import { POLAR_STATIONS, PolarStation } from "@/services/polarApi";

interface MotionGlobeViewProps {
  selectedStation: PolarStation;
  active: boolean;
  onSelectStation: (station: PolarStation) => void;
}

export function MotionGlobeView({ selectedStation, active, onSelectStation }: MotionGlobeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectedRef = useRef(selectedStation);

  useEffect(() => {
    selectedRef.current = selectedStation;
  }, [selectedStation]);

  useEffect(() => {
    let disposed = false;
    let frameId = 0;

    async function mount() {
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
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 0.25, 4.9);

      const group = new THREE.Group();
      scene.add(group);

      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(1.55, 80, 80),
        new THREE.MeshBasicMaterial({ color: 0x07111f, wireframe: true, transparent: true, opacity: 0.46 })
      );
      group.add(globe);

      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(1.62, 80, 80),
        new THREE.MeshBasicMaterial({ color: 0x155e75, transparent: true, opacity: 0.08 })
      );
      group.add(shell);

      const stationMeshes = POLAR_STATIONS.map((station) => {
        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 20, 20),
          new THREE.MeshBasicMaterial({ color: station.id === selectedRef.current.id ? 0x22d3ee : 0x64748b })
        );
        marker.position.copy(latLonToVector3(station.latitude, station.longitude, 1.72, THREE));
        marker.userData.stationId = station.id;
        group.add(marker);

        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.11, 0.004, 8, 48),
          new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: station.id === selectedRef.current.id ? 0.95 : 0.24 })
        );
        ring.position.copy(marker.position);
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        group.add(ring);

        return { station, marker, ring };
      });

      const gridMaterial = new THREE.LineBasicMaterial({ color: 0x1e3a5f, transparent: true, opacity: 0.38 });
      for (let lat = -75; lat <= 75; lat += 25) {
        group.add(makeLatitudeLine(lat, THREE, gridMaterial));
      }
      for (let lon = 0; lon < 180; lon += 20) {
        group.add(makeLongitudeLine(lon, THREE, gridMaterial));
      }

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();

      function resize() {
        const rect = activeCanvas.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      function handlePointerDown(event: PointerEvent) {
        const rect = activeCanvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(stationMeshes.map(({ marker }) => marker));
        const stationId = hits[0]?.object.userData.stationId;
        const station = POLAR_STATIONS.find((item) => item.id === stationId);

        if (station) {
          onSelectStation(station);
        }
      }

      activeCanvas.addEventListener("pointerdown", handlePointerDown);

      function animate(time: number) {
        resize();
        const selected = selectedRef.current;
        const targetY = -selected.longitude * (Math.PI / 180) - Math.PI / 2;
        const targetX = selected.latitude * (Math.PI / 420);

        group.rotation.y += (targetY - group.rotation.y) * 0.035;
        group.rotation.x += (targetX - group.rotation.x) * 0.035;
        camera.position.z += (3.62 - camera.position.z) * 0.025;

        stationMeshes.forEach(({ station, marker, ring }) => {
          const selectedMarker = station.id === selected.id;
          const markerMaterial = marker.material as import("three").MeshBasicMaterial;
          const ringMaterial = ring.material as import("three").MeshBasicMaterial;
          markerMaterial.color.setHex(selectedMarker ? 0x22d3ee : 0x64748b);
          ringMaterial.opacity = selectedMarker ? 0.92 : 0.22;
          const pulse = selectedMarker ? 1 + Math.sin(time * 0.004) * 0.18 : 0.72;
          marker.scale.setScalar(pulse);
          ring.scale.setScalar(selectedMarker ? 1.05 + Math.sin(time * 0.004) * 0.16 : 0.72);
        });

        renderer.render(scene, camera);
        frameId = window.requestAnimationFrame(animate);
      }

      animate(0);

      return () => {
        window.cancelAnimationFrame(frameId);
        activeCanvas.removeEventListener("pointerdown", handlePointerDown);
        renderer.dispose();
        globe.geometry.dispose();
        shell.geometry.dispose();
        globe.material.dispose();
        shell.material.dispose();
        stationMeshes.forEach(({ marker, ring }) => {
          marker.geometry.dispose();
          ring.geometry.dispose();
          (marker.material as import("three").Material).dispose();
          (ring.material as import("three").Material).dispose();
        });
      };
    }

    let cleanup: (() => void) | undefined;
    mount().then((dispose) => {
      cleanup = dispose;
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [onSelectStation]);

  return (
    <section className="relative min-h-[620px] overflow-hidden rounded-lg border border-cyan-500/30 bg-[#030712] shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
      <div className="absolute -right-24 -top-24 h-96 w-96 animate-[spin_72s_linear_infinite] rounded-full border border-cyan-500/10" />
      <div className="absolute -bottom-28 left-8 h-[440px] w-[440px] animate-[spin_96s_linear_infinite_reverse] rounded-full border border-cyan-500/10" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.035)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full cursor-crosshair" aria-label="Interactive polar station globe" />

      <div className="relative z-10 flex min-h-[620px] flex-col justify-between p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
          <div className="max-w-xl">
            <div className="mb-2 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              <Globe className="h-4 w-4" aria-hidden="true" />
              Spatial Telemetry and Global Matrix
            </div>
            <h2 className="text-3xl font-black tracking-wide text-white sm:text-4xl">Select Polar Research Node</h2>
            <p className="mt-2 max-w-lg font-mono text-xs leading-5 text-slate-400">
              Station selection drives live Open-Meteo weather, solar radiation, generator dispatch, and alert automation at exact coordinates.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:max-w-2xl xl:grid-cols-5">
            {POLAR_STATIONS.map((station) => {
              const selected = selectedStation.id === station.id;

              return (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => onSelectStation(station)}
                  className={`flex min-h-16 items-center gap-2 rounded-lg border px-3 py-2 text-left font-mono text-xs transition-all duration-300 ${
                    selected
                      ? "scale-[1.02] border-cyan-300 bg-cyan-400 text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.26)]"
                      : "border-slate-800 bg-slate-950/70 text-slate-300 hover:border-cyan-600 hover:bg-slate-900/90"
                  }`}
                >
                  <Target className={`h-3.5 w-3.5 shrink-0 ${selected ? "text-slate-950" : "text-cyan-300"}`} aria-hidden="true" />
                  <span>
                    <span className="block font-bold leading-tight">{station.name.split(" ")[0]}</span>
                    <span className="mt-1 block text-[10px] opacity-75">{station.country}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 border-t border-slate-800/80 pt-5 font-mono text-xs md:grid-cols-3">
          <HudMetric
            icon={<Compass className="h-4 w-4 animate-[spin_10s_linear_infinite]" aria-hidden="true" />}
            label="Coordinate Lock"
            value={`${Math.abs(selectedStation.latitude).toFixed(3)}S, ${Math.abs(selectedStation.longitude).toFixed(3)}${selectedStation.longitude >= 0 ? "E" : "W"}`}
            tone="cyan"
          />
          <HudMetric
            icon={<Radio className="h-4 w-4" aria-hidden="true" />}
            label="API Source Sync"
            value={active ? "Open-Meteo Global Grid" : "Awaiting live lock"}
            tone="green"
          />
          <HudMetric icon={<Zap className="h-4 w-4" aria-hidden="true" />} label="Elevation Altitude" value={`${selectedStation.elevation} meters MSL`} tone="amber" />
        </div>
      </div>
    </section>
  );
}

function HudMetric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "cyan" | "green" | "amber" }) {
  const toneClass = tone === "cyan" ? "text-cyan-300 border-cyan-800/70 bg-cyan-950/40" : tone === "green" ? "text-emerald-300 border-emerald-800/70 bg-emerald-950/35" : "text-amber-300 border-amber-800/70 bg-amber-950/35";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800/80 bg-slate-950/70 p-3.5 backdrop-blur">
      <div className={`rounded border p-2.5 ${toneClass}`}>{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</div>
        <div className="mt-1 font-bold text-slate-100">{value}</div>
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
  const radius = Math.cos(latitude * (Math.PI / 180)) * 1.56;
  const y = Math.sin(latitude * (Math.PI / 180)) * 1.56;
  const points = Array.from({ length: 121 }, (_, index) => {
    const angle = (index / 120) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  });

  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
}

function makeLongitudeLine(longitude: number, THREE: typeof import("three"), material: import("three").LineBasicMaterial) {
  const points = Array.from({ length: 121 }, (_, index) => {
    const latitude = -90 + (index / 120) * 180;
    return latLonToVector3(latitude, longitude, 1.565, THREE);
  });

  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
}
