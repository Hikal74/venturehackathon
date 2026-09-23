import Link from "next/link";
import { Database, Lock, ShieldCheck, Sparkles, Stethoscope, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/landing/landing-nav";
import { HeroVisual } from "@/components/landing/hero-visual";
import { FaqSection } from "@/components/landing/faq-section";
import { ScrollReveal } from "@/components/shared/scroll-reveal";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <LandingNav />

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-8 md:px-6 md:py-24">
        <div className="flex flex-col items-start gap-6 text-left">
          <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-muted-foreground">
            Built for VentureHack 2026
          </span>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            <span className="gradient-text-brand">Signals in.</span>
            <br />
            Understanding out.
          </h1>
          <p className="max-w-lg text-balance text-muted-foreground">
            AuraLink Care turns physiological signals, personal history, and caregiver context into
            AI-assisted, plain-language explanations a caregiver can act on — for people with Autism
            Spectrum Disorder, built with responsible-AI guardrails from day one.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">Try Demo</Link>
            </Button>
            <Button size="lg" variant="outline" className="magnetic-hover" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </div>
        <HeroVisual />
      </section>

      {/* Problem / Solution */}
      <ScrollReveal>
        <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-12 md:grid-cols-2 md:px-6">
          <div className="card-hover rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-muted-foreground">The problem</h2>
            <p className="mt-2 text-lg">
              People may have difficulty communicating discomfort or overload before others recognize it —
              leaving caregivers reacting after the fact, without the context to understand what happened or
              why.
            </p>
          </div>
          <div className="card-hover rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="gradient-text-brand text-sm font-semibold">The solution</h2>
            <p className="mt-2 text-lg">
              AuraLink combines physiological signals with a personal baseline, recorded history, and
              caregiver context — then uses AI to explain what changed, in plain language, grounded only in
              that person&apos;s own record.
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* How it works */}
      <ScrollReveal>
        <section className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6">
          <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            How it works
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { step: "Sense", desc: "Wearable-simulated signals: heart rate, HRV, GSR, skin temperature, activity." },
              { step: "Understand", desc: "Compared against this person's own baseline — never a population average." },
              { step: "Support", desc: "Prioritizes strategies already known to help this specific individual." },
              { step: "Learn", desc: "Patterns discovered over time from real recorded history, not assumptions." },
            ].map((item, i) => (
              <div
                key={item.step}
                className="magnetic-hover flex flex-col gap-2 rounded-2xl border border-black/5 bg-white p-4"
              >
                <span
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: i % 2 === 0 ? "var(--brand-cobalt)" : "var(--brand-violet)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-semibold">{item.step}</span>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Product preview */}
      <ScrollReveal>
        <section className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6">
          <div className="glass-panel flex flex-col gap-4 p-8">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>How is Alex doing right now?</span>
              <span>Illustrative preview</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-status-good/10">
                <ShieldCheck className="h-7 w-7 text-status-good" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold">Calm</h3>
                <p className="text-sm text-muted-foreground">Signals are within Alex&apos;s typical baseline range.</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This is a static preview for the landing page — the real dashboard computes this live from
              stored sensor readings and each person&apos;s own history.
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* Audiences */}
      <ScrollReveal>
        <section className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6">
          <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Built for the people around the data
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card-hover flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-status-recovering/10">
                <Users className="h-4 w-4 text-status-recovering" />
              </div>
              <h3 className="text-sm font-semibold">For caregivers</h3>
              <p className="text-xs text-muted-foreground">
                A dashboard that answers &quot;how are they doing right now&quot; in one glance, and an AI that
                explains changes using this person&apos;s own history — never generic advice.
              </p>
            </div>
            <div className="card-hover flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-status-recovering/10">
                <Stethoscope className="h-4 w-4 text-status-recovering" />
              </div>
              <h3 className="text-sm font-semibold">For specialists</h3>
              <p className="text-xs text-muted-foreground">
                Care profiles can be shared with view or edit access, so a specialist sees the same
                baseline, timeline, and patterns a caregiver does — nothing fabricated, nothing withheld.
              </p>
            </div>
            <div className="card-hover flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-status-recovering/10">
                <Wrench className="h-4 w-4 text-status-recovering" />
              </div>
              <h3 className="text-sm font-semibold">For technical reviewers</h3>
              <p className="text-xs text-muted-foreground">
                Real Postgres schema with Row Level Security, a documented prototype baseline algorithm, and
                an AI pipeline that fails honestly. See <code className="text-[11px]">docs/</code> in the repo.
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Trust anchors — honest equivalents, not FDA/HIPAA claims this product doesn't hold */}
      <ScrollReveal>
        <section className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6">
          <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Trust, built in — not claimed
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { icon: Lock, label: "Row Level Security", desc: "Enforced by Postgres, not app code" },
              { icon: ShieldCheck, label: "No AI diagnosis, ever", desc: "Guardrailed at the prompt layer" },
              { icon: Database, label: "Postgres-backed storage", desc: "Every record is a real, queryable row" },
              { icon: Sparkles, label: "Full export & delete", desc: "Your data, on your terms" },
            ].map((item) => (
              <div
                key={item.label}
                className="card-hover flex flex-col items-center gap-2 rounded-2xl border border-black/5 bg-white p-5 text-center"
              >
                <item.icon className="h-5 w-5" style={{ color: "var(--brand-cobalt)" }} />
                <p className="text-xs font-semibold">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            AuraLink Care is not FDA cleared and makes no HIPAA compliance claim — it is a hackathon MVP,
            explicitly positioned as an assistive tool, not a medical device. See{" "}
            <code className="text-[11px]">docs/SECURITY.md</code> for the full, honest picture.
          </p>
        </section>
      </ScrollReveal>

      {/* FAQ */}
      <ScrollReveal>
        <FaqSection />
      </ScrollReveal>

      {/* Final CTA */}
      <ScrollReveal>
        <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-16 text-center md:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            See it with a <span className="gradient-text-brand">demo profile</span> in under a minute.
          </h2>
          <Button size="lg" asChild>
            <Link href="/signup">Try Demo</Link>
          </Button>
        </section>
      </ScrollReveal>

      <footer className="mx-auto w-full max-w-4xl px-4 py-8 text-center text-xs text-muted-foreground md:px-6">
        AuraLink Care is an assistive monitoring and communication tool. It is not a medical device and does not
        diagnose autism, anxiety, or any medical condition.
      </footer>
    </div>
  );
}
