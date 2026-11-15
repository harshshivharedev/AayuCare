import { z } from 'zod';

export const PairCareCircleSchema = z.object({
  carePasscode: z
    .string()
    .min(6, 'Passcode must be at least 6 characters')
    .max(12, 'Passcode must not exceed 12 characters')
    .transform((val) => val.trim().toUpperCase()),
  relationship: z.string().optional().default('CAREGIVER'),
});

export const UpdateElderProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  age: z.number().int().min(50).max(120).optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().min(10).optional(),
  notes: z.string().optional(),
});

export type PairCareCircleInput = z.infer<typeof PairCareCircleSchema>;
export type UpdateElderProfileInput = z.infer<typeof UpdateElderProfileSchema>;
