import { z } from 'zod';

export const AppointmentStatusEnum = z.enum(['UPCOMING', 'COMPLETED', 'CANCELLED']);

export const CreateAppointmentSchema = z.object({
  elderProfileId: z.string().min(1, 'Elder profile ID required'),
  doctorName: z.string().min(2, 'Doctor name required'),
  specialty: z.string().min(2, 'Specialty required (e.g. Cardiologist)'),
  clinicAddress: z.string().min(3, 'Clinic address required'),
  appointmentDate: z.string().datetime('Must be valid ISO timestamp'),
  prepNotes: z.string().optional().nullable(),
});

export const UpdateAppointmentSchema = CreateAppointmentSchema.partial().omit({ elderProfileId: true });

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;
