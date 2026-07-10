"use client";

import { useEffect, useRef, useState } from "react";

const BAR_COUNT = 28;
const IDLE_LEVEL = 0.06;

export function WaveformVisualizer({
  level,
  active,
}: {
  level: number;
  active: boolean;
}) {
  const [bars, setBars] = useState<number[]>(() =>
    new Array(BAR_COUNT).fill(IDLE_LEVEL),
  );
  const barsRef = useRef(bars);
  barsRef.current = bars;

  useEffect(() => {
    if (!active) {
      setBars(new Array(BAR_COUNT).fill(IDLE_LEVEL));
      return;
    }

    const next = barsRef.current.slice(1);
    next.push(Math.max(IDLE_LEVEL, Math.min(1, level)));
    setBars(next);
  }, [active, level]);

  return (
    <div
      className="flex h-12 min-w-[160px] items-center justify-center gap-[2px] rounded-[10px] border border-[var(--border)] bg-white px-3"
      role="img"
      aria-label={active ? "Recording audio levels" : "Not recording"}
    >
      {bars.map((value, index) => (
        <span
          key={index}
          className="w-[3px] rounded-full transition-[height] duration-75 ease-out"
          style={{
            height: `${Math.round(value * 100)}%`,
            backgroundColor: active
              ? "var(--primary)"
              : "var(--border-strong)",
            opacity: active ? 0.55 + value * 0.45 : 1,
          }}
        />
      ))}
    </div>
  );
}
