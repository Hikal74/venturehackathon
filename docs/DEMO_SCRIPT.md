# Demo Script (2–3 minutes)

Run this once end-to-end before presenting — it depends on a care profile
seeded with demo data (checked by default in onboarding step 5, "Seed 7
days of demo data").

## Setup (before judges arrive)

1. Create an account, complete onboarding for a profile (e.g. "Alex"),
   leaving "Seed 7 days of demo data" checked.
2. Confirm the Dashboard shows **Calm** and Patterns shows at least the
   cafeteria time-of-day pattern. If not, see `README.md` troubleshooting.

## The walkthrough

**1. Dashboard (15s)**
"This is AuraLink Care. Right now, Alex is Calm — that's not a guess, it's
computed live by comparing the last sensor reading against Alex's own
7-day history." Point at the per-metric cards and their baseline
percentages.

**2. Open the Device Simulator (15s)**
Navigate to Devices. "We don't have the physical wearable yet, so this
simulator sends real packets to the same ingestion endpoint hardware would
eventually use." Click the **High Elevation** preset.

**3. Send Sensor Packet (15s)**
Click **Send Sensor Packet**. Narrate: "That's a real HTTP request,
validated, stored, and analyzed — not a state change in the browser."

**4. Back to Dashboard (15s)**
Navigate to Dashboard. Status card now reads **High Elevation**, an alert
banner is visible, and the metric cards show the new deviation percentages.

**5. What Changed? (30s)**
Click the **What Changed?** button. While it loads: "This calls Gemini with
a context object built specifically for Alex — baseline, recent history,
saved strategies — not a generic prompt." Read out 1–2 sections of the
result, pointing at the evidence tags (Measured/Calculated/Observed/
Inferred).

**6. Timeline (15s)**
Navigate to Timeline. Point out the new event entry and (if seeded data is
recent enough) a caregiver observation and the earlier calm baseline.

**7. Patterns (20s)**
Navigate to Patterns. "This is pure computation over stored history, no AI
call — which is what makes this more than an LLM wrapper. It found that
elevated signals repeated around lunchtime on 4 of the last 5 days with
data, most often alongside a caregiver note about a crowded cafeteria —
described as an association, never a cause."

**8. Close (10s)**
"Everything you just saw — the dashboard, the simulator, What Changed,
Patterns — is backed by a real Postgres database with row-level security,
so one caregiver's account can never see another's data."

## If something goes wrong live

- **Gemini is down / rate-limited:** What Changed shows "Aura AI is
  temporarily unavailable" — say so plainly and continue to Patterns/
  Reports, which don't depend on it. This is itself a talking point (see
  `docs/JUDGE_QA.md` "Why is this more than an LLM wrapper?").
- **Dashboard doesn't show High Elevation after sending a packet:** refresh
  the page once (Server Components re-fetch on navigation, not via
  websockets — there's no live push in this MVP, see Known Limitations in
  the README).
- **Patterns page looks empty:** the demo profile needs its seeded data;
  create a fresh profile with "Seed demo data" checked if the current one
  was created without it or has since been deleted via "Delete My Data."
