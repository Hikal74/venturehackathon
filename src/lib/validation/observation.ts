import { z } from "zod";

// Accepts anything Date.parse() understands (in particular the
// `datetime-local` input format, which has no seconds/timezone and would
// fail z.string().datetime()'s strict ISO-8601 check) rather than a
// specific format, since this is normalized to a real ISO string before
// it's ever written to the database (see services/observations.ts).
const looseDateTime = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date and time");

export const createObservationSchema = z.object({
  careProfileId: z.string().uuid(),
  occurredAt: looseDateTime.optional(),
  environment: z.string().trim().max(200).optional(),
  activity: z.string().trim().max(200).optional(),
  possibleTrigger: z.string().trim().max(200).optional(),
  supportAction: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
  outcome: z.string().trim().max(500).optional(),
  eventId: z.string().uuid().optional(),
});
export type CreateObservationInput = z.infer<typeof createObservationSchema>;
