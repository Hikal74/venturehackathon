import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Is AuraLink Care a medical device, or does it diagnose anything?",
    a: "No. It's an assistive monitoring and communication tool, not a diagnostic tool and not FDA cleared. It never claims certainty about an emotion, never claims correlation is causation, and never diagnoses autism, anxiety, or any medical condition. See the Responsible AI section above and docs/SECURITY.md for the full picture.",
  },
  {
    q: "Where do the readings come from — is there a real wearable?",
    a: "Not yet. The Device Simulator sends real HTTP packets to the same ingestion endpoint a physical wearable would use, and everything downstream (analytics, baseline, AI context) runs on that data exactly as it would for a real device. It's the ingestion and analysis pipeline that's real; the sensor itself is simulated for this MVP.",
  },
  {
    q: "How does AuraLink know what's normal for someone?",
    a: "Every reading is compared only against that person's own recent history — never a population average — via the Personal Baseline Engine. It's a documented prototype algorithm (see docs/AI_SYSTEM.md), not a clinically validated model.",
  },
  {
    q: "What happens if Aura AI (Gemini) is down?",
    a: "The dashboard, baseline calculations, timeline, and Patterns page are all deterministic and keep working with no AI call involved. Only the AI-generated explanations (\"What Changed?\" and the Aura AI chat) show an honest \"temporarily unavailable\" state instead of failing silently or guessing.",
  },
  {
    q: "Who can see a care profile's data?",
    a: "Access is enforced by Postgres Row Level Security, not just app-level checks — a care profile is only visible to accounts explicitly granted access to it. You can export or permanently delete a profile's data at any time from Settings.",
  },
  {
    q: "Is this ready for real caregiving use today?",
    a: "It's a hackathon MVP. The known limitations — no real wearable yet, a prototype (not clinically validated) baseline algorithm, no real-time push updates, and no CSRF/rate-limiting hardening yet — are listed candidly in the README and docs/, not hidden.",
  },
];

export function FaqSection() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6">
      <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Frequently asked questions
      </h2>
      <div className="clay p-2 md:p-4">
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`} className="px-4">
              <AccordionTrigger className="text-sm md:text-base">{item.q}</AccordionTrigger>
              <AccordionContent className="text-sm">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
