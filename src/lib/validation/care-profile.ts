import { z } from "zod";

export const ageRangeSchema = z.enum(["child_5_9", "preteen_10_12", "teen_13_17", "adult_18_plus"]);

export const basicProfileSchema = z.object({
  displayName: z.string().trim().min(1, "A display name is required").max(80),
  ageRange: ageRangeSchema.optional(),
  preferredLanguage: z.string().trim().min(1).max(40).default("en"),
  communicationPreferences: z
    .object({
      verbal: z.boolean().optional(),
      usesAAC: z.boolean().optional(),
      notes: z.string().max(500).optional(),
    })
    .partial()
    .default({}),
});
export type BasicProfileInput = z.infer<typeof basicProfileSchema>;

export const labelListSchema = z.array(z.string().trim().min(1).max(120)).max(30);

export const routineSchema = z
  .object({
    school: z.string().max(300).optional(),
    home: z.string().max(300).optional(),
    therapy: z.string().max(300).optional(),
    transportation: z.string().max(300).optional(),
    meals: z.string().max(300).optional(),
    sleep: z.string().max(300).optional(),
  })
  .partial();
export type RoutineInput = z.infer<typeof routineSchema>;

export const createCareProfileSchema = basicProfileSchema.extend({
  triggers: labelListSchema.default([]),
  supportStrategies: labelListSchema.default([]),
  routine: routineSchema.default({}),
  routineNotes: z.string().max(1000).optional(),
  seedDemoBaseline: z.boolean().default(false),
});
export type CreateCareProfileInput = z.infer<typeof createCareProfileSchema>;

export const updateCareProfileSchema = basicProfileSchema.partial();
export type UpdateCareProfileInput = z.infer<typeof updateCareProfileSchema>;
