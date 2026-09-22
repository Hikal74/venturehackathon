import Link from "next/link";
import { CheckCircle2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/landing/landing-nav";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <LandingNav />

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center md:py-24">
        <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          Built for VentureHack 2026
        </span>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Understand signals.
          <br />
          Recognize patterns.
          <br />
          Support the person.
        </h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          AuraLink Care is an assistive monitoring and communication system for caregivers of people with Autism
          Spectrum Disorder — combining physiological signals, personal context, and AI-assisted analysis into
          something a caregiver can actually act on.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">Try Demo</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-12 md:grid-cols-2">
        <div className="clay p-6">
          <h2 className="text-sm font-semibold text-muted-foreground">The problem</h2>
          <p className="mt-2 text-lg">
            People may have difficulty communicating discomfort or overload before others recognize it — leaving
            caregivers reacting after the fact, without the context to understand what happened or why.
          </p>
        </div>
        <div className="clay p-6">
          <h2 className="text-sm font-semibold text-muted-foreground">The solution</h2>
          <p className="mt-2 text-lg">
            AuraLink combines physiological signals with a personal baseline, recorded history, and caregiver
            context — then uses AI to explain what changed, in plain language, grounded only in that person&apos;s
            own record.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-4xl px-4 py-12">
        <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          How it works
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { step: "Sense", desc: "Wearable-simulated signals: heart rate, HRV, GSR, skin temperature, activity." },
            { step: "Understand", desc: "Compared against this person's own baseline — never a population average." },
            { step: "Support", desc: "Prioritizes strategies already known to help this specific individual." },
            { step: "Learn", desc: "Patterns discovered over time from real recorded history, not assumptions." },
          ].map((item) => (
            <div key={item.step} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
              <span className="text-sm font-semibold">{item.step}</span>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Product preview */}
      <section className="mx-auto w-full max-w-3xl px-4 py-12">
        <div className="clay flex flex-col gap-4 border-2 p-8" style={{ borderColor: "var(--status-good)" }}>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>How is Alex doing right now?</span>
            <span>Illustrative preview</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-status-good/10">
              <CheckCircle2 className="h-7 w-7 text-status-good" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">Calm</h3>
              <p className="text-sm text-muted-foreground">Signals are within Alex&apos;s typical baseline range.</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            This is a static preview for the landing page — the real dashboard computes this live from stored
            sensor readings and each person&apos;s own history.
          </p>
        </div>
      </section>

      {/* Privacy / Responsible AI */}
      <section className="mx-auto w-full max-w-4xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
            <Lock className="h-5 w-5 text-status-recovering" />
            <h3 className="text-sm font-semibold">Private by design</h3>
            <p className="text-xs text-muted-foreground">
              Row Level Security means one caregiver&apos;s account can never read another&apos;s data — enforced by
              the database, not just application code.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
            <ShieldCheck className="h-5 w-5 text-status-recovering" />
            <h3 className="text-sm font-semibold">Not a diagnostic tool</h3>
            <p className="text-xs text-muted-foreground">
              AuraLink never claims to diagnose autism, anxiety, or any condition, and never treats a signal change
              as proof of an emotion or cause.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
            <Sparkles className="h-5 w-5 text-status-recovering" />
            <h3 className="text-sm font-semibold">Honest about AI</h3>
            <p className="text-xs text-muted-foreground">
              Aura AI only reasons over this profile&apos;s own data, distinguishes measured from inferred, and says
              so plainly when it doesn&apos;t have enough information.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">See it with a demo profile in under a minute.</h2>
        <Button size="lg" asChild>
          <Link href="/signup">Try Demo</Link>
        </Button>
      </section>

      <footer className="mx-auto w-full max-w-4xl px-4 py-8 text-center text-xs text-muted-foreground">
        AuraLink Care is an assistive monitoring and communication tool. It is not a medical device and does not
        diagnose autism, anxiety, or any medical condition.
      </footer>
    </div>
  );
}
