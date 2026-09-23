const PATH = "M0 16 H80 L92 16 L100 4 L110 28 L118 16 H160 L172 16 L180 8 L188 24 L196 16 H240";
const PATH_LENGTH = 285;

export function SignalPulse({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 240 32" fill="none" className={className} preserveAspectRatio="none">
      <path
        d={PATH}
        stroke="url(#signal-pulse-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
      <path
        d={PATH}
        stroke="url(#signal-pulse-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`40 ${PATH_LENGTH - 40}`}
        className="signal-pulse-path"
      />
      <defs>
        <linearGradient id="signal-pulse-gradient" x1="0" y1="0" x2="240" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--brand-cyan)" />
          <stop offset="100%" stopColor="var(--brand-cobalt)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
