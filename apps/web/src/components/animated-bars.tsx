"use client";

import { motion } from "motion/react";

export default function AnimatedBars({
  heights,
  highlightIndex,
  delayBase = 0.1,
}: {
  heights: number[];
  highlightIndex?: number;
  delayBase?: number;
}) {
  return (
    <div
      style={{
        height: 220,
        borderRadius: 20,
        background: "linear-gradient(180deg, rgba(31,107,78,0.08), rgba(108,245,184,0.04))",
        border: "1px solid rgba(207,224,204,0.8)",
        display: "flex",
        alignItems: "end",
        padding: 16,
        gap: 12,
      }}
    >
      {heights.map((height, index) => (
        <motion.div
          key={index}
          initial={{ height: 0, opacity: 0.35 }}
          animate={{ height: `${height}%`, opacity: 1 }}
          transition={{ duration: 0.7, delay: delayBase + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
          style={{
            flex: 1,
            borderRadius: 12,
            background: index === highlightIndex ? "rgba(194,69,43,0.75)" : "rgba(31,107,78,0.75)",
          }}
        />
      ))}
    </div>
  );
}
