import { z } from 'zod';

export const createAppointmentSchema = z.object({
  elderProfileId: z.string().uuid('Invalid Elder Profile ID'),
  doctorName: z.string().min(2, 'Doctor name must be at least 2 characters'),
  specialty: z.string().min(2, 'Medical specialty is required (e.g. Cardiologist, Diabetologist)'),
  clinicAddress: z.string().min(2, 'Clinic or hospital address is required'),
  appointmentDate: z.string().datetime('Appointment date must be a valid ISO 8601 datetime string'),
  prepNotes: z.string().optional().nullable()
});

export const updateAppointmentSchema = createAppointmentSchema
  .partial()
  .omit({ elderProfileId: true })
  .extend({
    status: z.enum(['UPCOMING', 'COMPLETED', 'CANCELLED']).optional()
  });

export type CreateAppointmentInput = z.input<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.input<typeof updateAppointmentSchema>;
