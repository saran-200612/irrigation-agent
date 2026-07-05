import React, { useEffect, useState } from 'react';

export default function MoistureDial({ confidence = 0.8, waterMm = 12.5 }) {
  const [offset, setOffset] = useState(283); // Circumference of radius 45 is ~283

  useEffect(() => {
    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const shouldAnimate = !mediaQuery.matches;

    // Radius = 45, Circumference = 2 * PI * 45 = 282.74 (approx 283)
    const targetOffset = 283 - (confidence * 283);

    if (shouldAnimate) {
      // Trigger transition slightly after mount to ensure animation plays
      const timer = setTimeout(() => {
        setOffset(targetOffset);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Set instantly if motion is reduced
      setOffset(targetOffset);
    }
  }, [confidence]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-surface rounded-[6px] border border-water/10 h-full">
      <h3 className="font-display text-[13px] tracking-wider uppercase text-text-dim mb-3">
        Confidence / Water Depth
      </h3>

      <div className="relative w-44 h-44">
        {/* SVG Circular Gauge */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <defs>
            {/* Linear gradient from Wheat (warning/low) to Water (canal blue/high) */}
            <linearGradient id="gaugeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--wheat)" />
              <stop offset="100%" stopColor="var(--water)" />
            </linearGradient>
          </defs>

          {/* Background circle track */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="var(--bg)"
            strokeWidth="8"
            fill="transparent"
            className="opacity-40"
          />

          {/* Foreground animated indicator arc */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray="283"
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>

        {/* Center reading details */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-bold text-text tracking-tight">
            {waterMm.toFixed(1)}
          </span>
          <span className="font-display text-[11px] font-semibold text-water tracking-wider uppercase mt-0.5">
            mm water
          </span>
          <span className="font-mono text-[11px] text-text-dim mt-1.5 opacity-80">
            Conf: {(confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-[12px] text-text-dim">
          Circular arc indicates confidence weight from dry status to secure water profile.
        </p>
      </div>
    </div>
  );
}
