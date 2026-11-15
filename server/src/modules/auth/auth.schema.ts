import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['ELDERLY', 'CAREGIVER', 'FAMILY', 'ADMIN']).optional().default('ELDERLY')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

export const googleAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(10, 'Google ID Token is required'),
    role: z.enum(['ELDERLY', 'CAREGIVER', 'FAMILY']).optional().default('CAREGIVER')
  })
});

export type RegisterInput = z.input<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>['body'];
