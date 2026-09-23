/** Same page-entrance treatment as the (app) segment — see that template.tsx for why. */
export default function AuthTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
