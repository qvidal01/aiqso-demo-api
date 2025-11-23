import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  // Server
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string(),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),

  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  // SendGrid
  SENDGRID_API_KEY: z.string().startsWith('SG.'),
  SENDGRID_FROM_EMAIL: z.string().email(),
  SENDGRID_FROM_NAME: z.string().default('AIQSO Demo Portal'),

  // Google Calendar
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REDIRECT_URI: z.string().url(),

  // Rate Limiting
  RATE_LIMIT_MAX: z.string().default('100'),
  RATE_LIMIT_WINDOW: z.string().default('900000'),

  // Demo Configuration
  DEMO_SESSION_DURATION: z.string().default('3600000'),
  AUTO_DELETE_DEMO_DATA_DAYS: z.string().default('7'),
  MAX_WORKFLOW_STEPS: z.string().default('20'),
  MAX_WORKFLOW_EXECUTION_TIME: z.string().default('30000'),

  // Budget Controls
  OPENAI_MONTHLY_BUDGET_USD: z.string().default('10'),
  SENDGRID_DAILY_LIMIT: z.string().default('50'),
});

const parseConfig = () => {
  try {
    return configSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment configuration:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const config = parseConfig();

export const getConfig = () => ({
  server: {
    port: parseInt(config.PORT, 10),
    nodeEnv: config.NODE_ENV,
    apiUrl: config.API_URL,
    allowedOrigins: config.ALLOWED_ORIGINS.split(','),
  },
  firebase: {
    projectId: config.FIREBASE_PROJECT_ID,
    clientEmail: config.FIREBASE_CLIENT_EMAIL,
    privateKey: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  supabase: {
    url: config.SUPABASE_URL,
    anonKey: config.SUPABASE_ANON_KEY,
    serviceKey: config.SUPABASE_SERVICE_KEY,
  },
  openai: {
    apiKey: config.OPENAI_API_KEY,
    model: config.OPENAI_MODEL,
  },
  sendgrid: {
    apiKey: config.SENDGRID_API_KEY,
    fromEmail: config.SENDGRID_FROM_EMAIL,
    fromName: config.SENDGRID_FROM_NAME,
  },
  google: {
    clientId: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    redirectUri: config.GOOGLE_REDIRECT_URI,
  },
  rateLimit: {
    max: parseInt(config.RATE_LIMIT_MAX, 10),
    window: parseInt(config.RATE_LIMIT_WINDOW, 10),
  },
  demo: {
    sessionDuration: parseInt(config.DEMO_SESSION_DURATION, 10),
    autoDeleteDays: parseInt(config.AUTO_DELETE_DEMO_DATA_DAYS, 10),
    maxWorkflowSteps: parseInt(config.MAX_WORKFLOW_STEPS, 10),
    maxExecutionTime: parseInt(config.MAX_WORKFLOW_EXECUTION_TIME, 10),
  },
  budget: {
    openaiMonthly: parseInt(config.OPENAI_MONTHLY_BUDGET_USD, 10),
    sendgridDaily: parseInt(config.SENDGRID_DAILY_LIMIT, 10),
  },
});
