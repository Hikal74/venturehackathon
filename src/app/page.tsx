import Link from "next/link";
import { Database, Lock, ShieldCheck, Sparkles, Stethoscope, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/landing/landing-nav";
import { HeroVisual } from "@/components/landing/hero-visual";
import { FaqSection } from "@/components/landing/faq-section";
import { StatsBand } from "@/components/landing/stats-band";
import { HowItWorksDiagram } from "@/components/landing/how-it-works-diagram";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { SignalPulse } from "@/components/shared/signal-pulse";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <LandingNav />

      <section className="hero-band">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 pt-28 pb-20 md:grid-cols-2 md:gap-8 md:px-6 md:pt-36 md:pb-28">
          <div className="flex flex-col items-start gap-6 text-left">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-sm">
              Built for VentureHack 2026
            </span>
            <h1 className="text-display text-white">
              <span className="gradient-text-brand">Signals in.</span>
              <br />
              Understanding out.
            </h1>
            <p className="max-w-lg text-balance text-white/65">
              AuraLink Care turns physiological signals, personal history, and caregiver context into
              AI-assisted, plain-language explanations a caregiver can act on — for people with Autism
              Spectrum Disorder, built with responsible-AI guardrails from day one.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/signup">Try Demo</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="magnetic-hover border-white/25 bg-white/5 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <SignalPulse className="mx-auto -mt-4 h-4 w-full max-w-xs opacity-70" />

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

      <ScrollReveal>
        <StatsBand />
      </ScrollReveal>

      <ScrollReveal>
        <section className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6">
          <h2 className="text-label mb-8 text-center">How it works</h2>
          <HowItWorksDiagram />
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="mx-auto w-full max-w-4xl px-4 py-12 md:px-6">
          <div className="glass-panel flex flex-col gap-6 p-8 md:p-10">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>How is Alex doing right now?</span>
              <span>Illustrative preview</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-status-good/10">
                <ShieldCheck className="h-8 w-8 text-status-good" />
              </div>
              <div>
                <h3 className="text-h2">Calm</h3>
                <p className="text-body-sm text-muted-foreground">Signals are within Alex&apos;s typical baseline range.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {[
                { label: "Heart rate", value: "72 bpm", pct: 55, color: "var(--series-heart-rate)" },
                { label: "HRV", value: "48 ms", pct: 70, color: "var(--series-hrv)" },
                { label: "GSR", value: "0.31 µS", pct: 40, color: "var(--series-gsr)" },
                { label: "Skin temp", value: "33.2°C", pct: 60, color: "var(--series-skin-temp)" },
                { label: "Activity", value: "Low", pct: 30, color: "var(--series-activity)" },
              ].map((m) => (
                <div key={m.label} className="flex flex-col items-center gap-2 rounded-2xl bg-white/60 p-3">
                  <div className="flex h-16 w-full items-end justify-center">
                    <div
                      className="metric-bar-grow w-3 rounded-full"
                      style={{ height: `${m.pct}%`, background: m.color }}
                    />
                  </div>
                  <span className="text-xs font-semibold">{m.value}</span>
                  <span className="text-center text-[10px] text-muted-foreground">{m.label}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              This is a static preview for the landing page — the real dashboard computes this live from
              stored sensor readings and each person&apos;s own history.
            </p>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6">
          <h2 className="text-label mb-6 text-center">
            Built for the people around the data
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card-hover flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-status-recovering/10">
                <Users className="h-5 w-5 text-status-recovering" />
              </div>
              <h3 className="text-h3">For caregivers</h3>
              <p className="text-body-sm text-muted-foreground">
                A dashboard that answers &quot;how are they doing right now&quot; in one glance, and an AI that
                explains changes using this person&apos;s own history — never generic advice.
              </p>
            </div>
            <div className="card-hover flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-status-recovering/10">
                <Stethoscope className="h-5 w-5 text-status-recovering" />
              </div>
              <h3 className="text-h3">For specialists</h3>
              <p className="text-body-sm text-muted-foreground">
                Care profiles can be shared with view or edit access, so a specialist sees the same
                baseline, timeline, and patterns a caregiver does — nothing fabricated, nothing withheld.
              </p>
            </div>
            <div className="card-hover flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-status-recovering/10">
                <Wrench className="h-5 w-5 text-status-recovering" />
              </div>
              <h3 className="text-h3">For technical reviewers</h3>
              <p className="text-body-sm text-muted-foreground">
                Real Postgres schema with Row Level Security, a documented prototype baseline algorithm, and
                an AI pipeline that fails honestly. See <code className="text-xs">docs/</code> in the repo.
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6">
          <h2 className="text-label mb-6 text-center">
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
                className="card-hover flex flex-col items-center gap-2.5 rounded-2xl border border-black/5 bg-white p-6 text-center"
              >
                <item.icon className="h-6 w-6" style={{ color: "var(--brand-cobalt)" }} />
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
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

      <ScrollReveal>
        <FaqSection />
      </ScrollReveal>

      <ScrollReveal>
        <section className="hero-band">
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-20 text-center md:px-6">
            <h2 className="text-h1 text-white">
              See it with a <span className="gradient-text-brand">demo profile</span> in under a minute.
            </h2>
            <Button size="lg" asChild>
              <Link href="/signup">Try Demo</Link>
            </Button>
          </div>
        </section>
      </ScrollReveal>

      <footer className="mx-auto w-full max-w-4xl px-4 py-8 text-center text-xs text-muted-foreground md:px-6">
        AuraLink Care is an assistive monitoring and communication tool. It is not a medical device and does not
        diagnose autism, anxiety, or any medical condition.
      </footer>
    </div>
  );
}
