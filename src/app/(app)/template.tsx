/**
 * `template.tsx` (unlike `layout.tsx`) remounts on every navigation within
 * this route segment, so every in-app page transition gets a fresh, brief
 * entrance instead of the old page's content just being swapped out with a
 * hard cut. Pure presentation — `.page-enter` (globals.css) respects
 * `prefers-reduced-motion` the same way the rest of the app's motion does.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
