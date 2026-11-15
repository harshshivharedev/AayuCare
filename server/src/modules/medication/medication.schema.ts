import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM 24-hour format

export const createMedicationSchema = z.object({
  elderProfileId: z.string().uuid('Invalid Elder Profile ID'),
  name: z.string().min(2, 'Medication name must be at least 2 characters'),
  dosage: z.string().min(1, 'Dosage is required (e.g., 1 Tablet, 500mg)'),
  frequency: z.string().default('DAILY'),
  scheduleTimes: z
    .array(z.string().regex(timeRegex, 'Each time must be in HH:MM 24-hour format (e.g., 08:30)'))
    .min(1, 'At least one schedule time is required'),
  mealRelation: z.enum(['BEFORE_MEAL', 'AFTER_MEAL', 'WITH_MEAL', 'ANYTIME']).default('AFTER_MEAL'),
  criticality: z.enum(['HIGH_RISK', 'ROUTINE']).default('ROUTINE'),
  pillImageUrl: z.string().optional().nullable(),
  voiceNoteUrl: z.string().optional().nullable(),
  voiceNoteText: z.string().optional().nullable(),
  dietaryGuidelines: z.array(z.string()).default([]),
  instructions: z.string().optional().nullable()
});

export const updateMedicationSchema = createMedicationSchema.partial().omit({
  elderProfileId: true
});

export const confirmDoseSchema = z.object({
  medicationId: z.string().uuid('Invalid Medication ID'),
  scheduledFor: z.string().datetime().optional(),
  method: z.enum(['BUTTON_TAP', 'VOICE', 'CAREGIVER_OVERRIDE', 'SYSTEM_AUTO']).default('BUTTON_TAP'),
  notes: z.string().optional()
});

export type CreateMedicationInput = z.input<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.input<typeof updateMedicationSchema>;
export type ConfirmDoseInput = z.input<typeof confirmDoseSchema>;
