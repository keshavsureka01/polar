"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

export function InteractiveBackdrop() {
  const [cursor, setCursor] = useState({ x: 0.5, y: 0.28 });
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;

      setCursor({
        x: event.clientX / width,
        y: event.clientY / height
      });
    };

    const handleScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScroll(window.scrollY / maxScroll);
    };

    handleScroll();
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const offsetX = (cursor.x - 0.5) * 56;
  const offsetY = (cursor.y - 0.5) * 42;
  const scrollShift = scroll * 160;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 bg-polar-grid"
        style={
          {
            "--grid-x": `${offsetX * 0.18}px`,
            "--grid-y": `${offsetY * 0.18 + scrollShift * 0.14}px`
          } as CSSProperties
        }
      />
      <div
        className="absolute inset-0 bg-polar-sheen"
        style={{
          transform: `translate3d(${offsetX * 0.12}px, ${offsetY * 0.12 + scrollShift * 0.1}px, 0)`
        }}
      />
      <div
        className="absolute left-1/2 top-1/3 h-[34rem] w-[34rem] rounded-full bg-cyan-500/8 blur-3xl"
        style={{
          transform: `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), 0)`
        }}
      />
      <div
        className="absolute right-[-6rem] top-24 h-[28rem] w-[28rem] rounded-full bg-emerald-500/6 blur-3xl"
        style={{
          transform: `translate3d(${offsetX * -0.7}px, ${offsetY * 0.4 + scrollShift * 0.18}px, 0)`
        }}
      />
      <div
        className="absolute bottom-[-10rem] left-[12%] h-[24rem] w-[24rem] rounded-full bg-amber-500/5 blur-3xl"
        style={{
          transform: `translate3d(${offsetX * 0.45}px, ${offsetY * -0.3 - scrollShift * 0.12}px, 0)`
        }}
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0)_0%,rgba(3,7,18,0.45)_70%,rgba(3,7,18,0.92)_100%)]"
        style={{
          transform: `translate3d(${offsetX * 0.05}px, ${offsetY * 0.05}px, 0)`
        }}
      />
    </div>
  );
}
