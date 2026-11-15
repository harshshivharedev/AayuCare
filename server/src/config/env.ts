import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional().default(''),

  // AI Engines (Adaption AI Primary + Gemini Fallback)
  ADAPTION_AI_API_KEY: z.string().optional().default(''),
  ADAPTION_AI_BASE_URL: z.string().optional().default('https://api.adaptionlab.com/v1'),
  ADAPTION_AI_MODEL: z.string().optional().default('adaption-vision-pro'),
  GEMINI_API_KEY: z.string().optional().default('')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment configuration:', parsedEnv.error.format());
  throw new Error('Invalid environment configuration. Please check your .env file.');
}

export const ENV = parsedEnv.data;
