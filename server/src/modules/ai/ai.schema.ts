import { z } from 'zod';

export const aiAnalyzeSchema = z.object({
  body: z.object({
    prompt: z.string().min(3, 'Prompt must be at least 3 characters').max(5000),
    systemInstruction: z.string().optional()
  })
});

export const scanPrescriptionSchema = z.object({
  body: z.object({
    prescriptionText: z.string().min(5, 'Prescription text is required'),
    elderProfileId: z.string().optional(),
    dietaryPreference: z.string().optional().default('Vegetarian Indian Diet'),
  })
});

export const dietaryCautionsSchema = z.object({
  body: z.object({
    medicationNames: z.array(z.string()).min(1, 'At least one medication name required'),
    age: z.number().optional().default(74),
    conditions: z.array(z.string()).optional().default(['Hypertension', 'Type-2 Diabetes']),
  })
});

export type AiAnalyzeInput = z.infer<typeof aiAnalyzeSchema>['body'];
export type ScanPrescriptionInput = z.infer<typeof scanPrescriptionSchema>['body'];
export type DietaryCautionsInput = z.infer<typeof dietaryCautionsSchema>['body'];
