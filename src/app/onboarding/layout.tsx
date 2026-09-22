export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 md:py-16">
        <div className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-status-recovering" aria-hidden />
          AuraLink Care
        </div>
        {children}
      </div>
    </div>
  );
}
