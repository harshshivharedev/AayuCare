import { z } from 'zod';

export const MealRelationEnum = z.enum(['BEFORE_MEAL', 'AFTER_MEAL', 'WITH_MEAL', 'ANYTIME']);
export const CriticalityEnum = z.enum(['HIGH_RISK', 'ROUTINE']);
export const ConfirmationMethodEnum = z.enum(['VOICE', 'BUTTON_TAP', 'CAREGIVER_OVERRIDE', 'SYSTEM_AUTO']);

export const CreateMedicationSchema = z.object({
  elderProfileId: z.string().min(1, 'Elder profile ID is required'),
  name: z.string().min(2, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required (e.g., 1 Tablet, 5ml)'),
  frequency: z.string().default('DAILY'),
  scheduleTimes: z.array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be HH:mm (24-hr)')).min(1, 'At least one scheduled time required'),
  mealRelation: MealRelationEnum.default('AFTER_MEAL'),
  criticality: CriticalityEnum.default('ROUTINE'),
  pillImageUrl: z.string().url().optional().nullable(),
  dietaryGuidelines: z.array(z.string()).default([]),
  instructions: z.string().optional().nullable(),
});

export const ConfirmDoseSchema = z.object({
  medicationId: z.string().min(1, 'Medication ID required'),
  scheduledFor: z.string().datetime().optional(),
  confirmationMethod: ConfirmationMethodEnum.default('BUTTON_TAP'),
  voiceTranscript: z.string().optional(),
  overrideLockout: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

export const UpdateMedicationSchema = CreateMedicationSchema.partial().omit({ elderProfileId: true });

export type CreateMedicationInput = z.infer<typeof CreateMedicationSchema>;
export type ConfirmDoseInput = z.infer<typeof ConfirmDoseSchema>;
export type UpdateMedicationInput = z.infer<typeof UpdateMedicationSchema>;
