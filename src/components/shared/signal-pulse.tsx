/**
 * The product's one deliberate recurring visual motif (design brief §24):
 * a calm waveform referencing the physiological signals AuraLink actually
 * reads (heart rate, HRV, GSR...), not a decorative abstract shape. Same
 * line every time it appears — used sparingly as a section divider and,
 * smaller, as a quiet "live" cue behind the brand mark — so it stays
 * recognizable instead of decorating everything.
 *
 * Two overlaid copies of the same path: a solid, always-visible base line
 * (so the waveform shape actually reads at a glance) plus a brighter
 * highlight segment that travels along it via stroke-dashoffset — "signal
 * traveling through the line," not the line itself flickering in and out.
 * Pure CSS animation (see .signal-pulse-path in globals.css), no JS —
 * respects prefers-reduced-motion automatically.
 */
const PATH = "M0 16 H80 L92 16 L100 4 L110 28 L118 16 H160 L172 16 L180 8 L188 24 L196 16 H240";
// Total length of PATH above, measured via SVGPathElement.getTotalLength() —
// keep this in sync if the path ever changes. Sized so the highlight's
// dasharray (40 + 245) sums to exactly this, for a seamless dashoffset loop.
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
