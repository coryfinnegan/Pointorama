"use client";
import { useEffect, useRef } from "react";

export default function Starfield() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    for (let i = 0; i < 80; i++) {
      const s = document.createElement("div");
      s.className = "star";
      const size = Math.random() * 2 + 1;
      const color = Math.random() > 0.7 ? "#ffd700" : "#aaaaff";
      s.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;background:${color};--d:${2 + Math.random() * 4}s;--delay:-${Math.random() * 4}s`;
      el.appendChild(s);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}
    />
  );
}
