import React, { forwardRef } from 'react';

const PITCH_RATIO = 1.5;
const W = 400;

const FootballPitch = forwardRef(function FootballPitch({ children, className = '', width = W }, ref) {
  const ph = width * PITCH_RATIO;
  const pw = width;

  return (
    <svg ref={ref} viewBox={`0 0 ${pw} ${ph}`} className={className} style={{ width: '100%', maxWidth: width }}>
      <defs>
        <linearGradient id="pitch-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a5c2a" />
          <stop offset="50%" stopColor="#1e6b30" />
          <stop offset="100%" stopColor="#1a5c2a" />
        </linearGradient>
        <pattern id="stripes" width={pw} height={ph / 8} patternUnits="userSpaceOnUse">
          <rect width={pw} height={ph / 16} fill="rgba(255,255,255,0.02)" />
          <rect y={ph / 16} width={pw} height={ph / 16} fill="transparent" />
        </pattern>
      </defs>

      {/* Field background */}
      <rect width={pw} height={ph} rx="8" fill="url(#pitch-grad)" />
      <rect width={pw} height={ph} rx="8" fill="url(#stripes)" />

      {/* Field border */}
      <rect x="20" y="20" width={pw - 40} height={ph - 40} rx="4" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />

      {/* Center line */}
      <line x1="20" y1={ph / 2} x2={pw - 20} y2={ph / 2} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />

      {/* Center circle */}
      <circle cx={pw / 2} cy={ph / 2} r={pw * 0.12} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <circle cx={pw / 2} cy={ph / 2} r="3" fill="rgba(255,255,255,0.4)" />

      {/* Top penalty box */}
      <rect x={pw * 0.2} y="20" width={pw * 0.6} height={ph * 0.14} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <rect x={pw * 0.32} y="20" width={pw * 0.36} height={ph * 0.06} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <path d={`M ${pw * 0.35} ${20 + ph * 0.14} A ${pw * 0.1} ${pw * 0.1} 0 0 0 ${pw * 0.65} ${20 + ph * 0.14}`} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <rect x={pw * 0.4} y="14" width={pw * 0.2} height="6" rx="2" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />

      {/* Bottom penalty box */}
      <rect x={pw * 0.2} y={ph - 20 - ph * 0.14} width={pw * 0.6} height={ph * 0.14} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <rect x={pw * 0.32} y={ph - 20 - ph * 0.06} width={pw * 0.36} height={ph * 0.06} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <path d={`M ${pw * 0.35} ${ph - 20 - ph * 0.14} A ${pw * 0.1} ${pw * 0.1} 0 0 1 ${pw * 0.65} ${ph - 20 - ph * 0.14}`} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <rect x={pw * 0.4} y={ph - 20} width={pw * 0.2} height="6" rx="2" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />

      {/* Corner arcs */}
      <path d={`M 20 30 A 10 10 0 0 0 30 20`} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <path d={`M ${pw - 20} 30 A 10 10 0 0 1 ${pw - 30} 20`} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <path d={`M 20 ${ph - 30} A 10 10 0 0 1 30 ${ph - 20}`} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <path d={`M ${pw - 20} ${ph - 30} A 10 10 0 0 0 ${pw - 30} ${ph - 20}`} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

      {children}
    </svg>
  );
});

export function pitchToSvg(xPercent, yPercent, pitchWidth = W) {
  const ph = pitchWidth * PITCH_RATIO;
  const fieldX = 20 + (pitchWidth - 40) * (xPercent / 100);
  const fieldY = 20 + (ph - 40) * (yPercent / 100);
  return { x: fieldX, y: fieldY };
}

export { W as PITCH_WIDTH, PITCH_RATIO };
export default FootballPitch;
