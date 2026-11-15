import { z } from 'zod';

export const createAlertSchema = z.object({
  elderProfileId: z.string().uuid('Invalid Elder Profile ID'),
  recipientEmail: z.string().email('Invalid recipient email address'),
  alertType: z.enum(['MISSED_DOSE', 'UPCOMING_DOSE', 'APPOINTMENT']),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  message: z.string().min(2, 'Message must be at least 2 characters'),
  status: z.enum(['PENDING', 'SENT', 'ACKNOWLEDGED', 'FAILED']).default('PENDING')
});

export const evaluateMissedSchema = z.object({
  elderProfileId: z.string().uuid('Invalid Elder Profile ID'),
  thresholdMinutes: z.number().int().min(1).max(240).default(45)
});

export type CreateAlertInput = z.input<typeof createAlertSchema>;
export type EvaluateMissedInput = z.infer<typeof evaluateMissedSchema>;
