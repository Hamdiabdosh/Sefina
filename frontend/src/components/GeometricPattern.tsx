// components/GeometricPattern.tsx
export const GeometricPattern = ({ opacity = 0.12 }: { opacity?: number }) => (
  <svg
    width="130"
    height="110"
    viewBox="0 0 130 110"
    aria-hidden="true"
    className="absolute top-0 right-0 pointer-events-none"
    style={{ opacity }}
  >
    <g stroke="#fff" strokeWidth="0.8" fill="none">
      <polygon points="100,5 120,17 120,41 100,53 80,41 80,17" />
      <polygon points="100,15 114,23 114,35 100,43 86,35 86,23" />
      <polygon points="60,30 80,42 80,66 60,78 40,66 40,42" />
      <polygon points="120,50 140,62 140,86 120,98 100,86 100,62" />
      <polygon points="20,55 40,67 40,91 20,103 0,91 0,67" />
    </g>
  </svg>
);
