import { z } from 'zod';

export const pairCareCircleSchema = z.object({
  body: z.object({
    carePasscode: z
      .string()
      .min(6, 'CarePasscode must be at least 6 characters')
      .max(12, 'CarePasscode cannot exceed 12 characters')
      .transform((val) => val.trim().toUpperCase())
  })
});

export const updateElderProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    age: z.number().int().min(40).max(125).optional(),
    bloodGroup: z.string().optional(),
    emergencyContact: z.string().min(10).optional(),
    notes: z.string().optional()
  })
});

export type PairCareCircleInput = z.infer<typeof pairCareCircleSchema>['body'];
export type UpdateElderProfileInput = z.infer<typeof updateElderProfileSchema>['body'];
