import React, { useMemo } from "react";

// Deterministic petals — no random on each render
const PETALS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 5.7 + 3) % 100}%`,
  size: 14 + (i % 5) * 4,
  fallDuration: `${8 + (i % 7) * 1.5}s`,
  swayDuration: `${3 + (i % 4) * 0.8}s`,
  delay: `-${(i * 1.3) % 12}s`,
  // Alternate between emoji types for variety
  symbol: i % 3 === 0 ? "🌸" : i % 3 === 1 ? "🌺" : "🌷",
}));

// Blurred background blob positions
const BLOBS = [
  { top: "8%",  left: "5%",  size: 220, opacity: 0.08 },
  { top: "60%", left: "80%", size: 280, opacity: 0.06 },
  { top: "30%", left: "50%", size: 180, opacity: 0.05 },
  { top: "75%", left: "20%", size: 240, opacity: 0.07 },
];

export default function CherryBlossomBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Blurred cherry blossom blob glows */}
      {BLOBS.map((blob, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: blob.top,
            left: blob.left,
            width: blob.size,
            height: blob.size,
            borderRadius: "50%",
            background: "radial-gradient(circle, #f9a8d4 0%, #fbcfe8 50%, transparent 70%)",
            opacity: blob.opacity,
            filter: "blur(40px)",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Falling sakura petals */}
      {PETALS.map((p) => (
        <span
          key={p.id}
          className="sakura-petal"
          style={{
            left: p.left,
            fontSize: p.size,
            animationDuration: `${p.fallDuration}, ${p.swayDuration}`,
            animationDelay: `${p.delay}, ${p.delay}`,
          }}
        >
          {p.symbol}
        </span>
      ))}
    </div>
  );
}
