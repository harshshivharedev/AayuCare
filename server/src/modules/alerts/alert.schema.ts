import { z } from 'zod';

export const AlertTypeEnum = z.enum(['MISSED_DOSE', 'UPCOMING_DOSE', 'APPOINTMENT']);
export const AlertStatusEnum = z.enum(['PENDING', 'SENT', 'FAILED']);

export const CreateAlertSchema = z.object({
  elderProfileId: z.string().min(1, 'Elder profile ID required'),
  recipientEmail: z.string().email('Valid recipient email required'),
  alertType: AlertTypeEnum,
  title: z.string().min(3),
  message: z.string().min(5),
});

export type CreateAlertInput = z.infer<typeof CreateAlertSchema>;
