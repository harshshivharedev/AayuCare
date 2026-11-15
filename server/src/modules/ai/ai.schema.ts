import { z } from 'zod';

export const aiAnalyzeSchema = z.object({
  prompt: z.string().min(3, 'Prompt must be at least 3 characters').max(5000),
  systemInstruction: z.string().optional()
});

export const scanPrescriptionSchema = z.object({
  prescriptionText: z.string().min(5, 'Prescription text is required'),
  elderProfileId: z.string().uuid().optional(),
  dietaryPreference: z.string().optional().default('Vegetarian Indian Diet')
});

export const dietaryCautionsSchema = z.object({
  medicationNames: z.array(z.string()).min(1, 'At least one medication name required'),
  age: z.number().optional().default(74),
  conditions: z.array(z.string()).optional().default(['Hypertension', 'Type-2 Diabetes'])
});

export const verifyPillSchema = z.object({
  expectedMedicationName: z.string().min(2, 'Expected medication name is required'),
  pillImageTextOrUrl: z.string().min(3, 'Pill image text or URL is required'),
  elderProfileId: z.string().uuid().optional()
});

export type AiAnalyzeInput = z.infer<typeof aiAnalyzeSchema>;
export type ScanPrescriptionInput = z.infer<typeof scanPrescriptionSchema>;
export type DietaryCautionsInput = z.infer<typeof dietaryCautionsSchema>;
export type VerifyPillInput = z.infer<typeof verifyPillSchema>;
