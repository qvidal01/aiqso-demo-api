import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import admin from 'firebase-admin';
import { getConfig } from './utils/config.js';
import { logger } from './utils/logger.js';
import { optionalAuth } from './middleware/auth.js';
import { cleanupOldDemoData } from './services/supabase.js';

// Import routes
import automationRoutes from './routes/automation.js';
import workflowRoutes from './routes/workflows.js';
import chatRoutes from './routes/chat.js';
import dashboardRoutes from './routes/dashboard.js';
import sessionRoutes from './routes/session.js';
import calendarRoutes from './routes/calendar.js';

const config = getConfig();

// Initialize Firebase Admin (optional - only if credentials provided)
if (config.firebase) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    }),
  });
  logger.info('✅ Firebase initialized');
} else {
  logger.warn('⚠️  Firebase not configured - authentication disabled (demo will work without user accounts)');
}

// Create Fastify instance
const fastify = Fastify({
  logger: config.server.nodeEnv === 'development',
  trustProxy: true,
});

// Register plugins
await fastify.register(helmet, {
  contentSecurityPolicy: config.server.nodeEnv === 'production',
});

await fastify.register(cors, {
  origin: config.server.allowedOrigins,
  credentials: true,
});

await fastify.register(rateLimit, {
  max: config.rateLimit.max,
  timeWindow: config.rateLimit.window,
  errorResponseBuilder: () => ({
    success: false,
    error: 'Rate limit exceeded. Please try again later.',
    statusCode: 429,
  }),
});

// Add global optional auth hook
fastify.addHook('onRequest', optionalAuth);

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// API info endpoint
fastify.get('/', async (request, reply) => {
  return {
    name: 'AIQSO Demo API',
    version: '1.0.0',
    description: 'Backend API for AIQSO Interactive Demo Portal',
    endpoints: {
      health: 'GET /health',
      automation: 'POST /api/automation/execute, GET /api/automation/services',
      workflows: 'GET|POST|PUT|DELETE /api/workflows',
      chat: 'POST /api/chat',
      dashboard: 'GET /api/dashboard/metrics, GET /api/dashboard/charts',
      session: 'POST|GET /api/session',
      calendar: 'GET /api/calendar/auth-url, GET /api/calendar/callback',
    },
    documentation: 'https://aiqso.io/docs/api',
  };
});

// Register API routes
await fastify.register(automationRoutes, { prefix: '/api' });
await fastify.register(workflowRoutes, { prefix: '/api' });
await fastify.register(chatRoutes, { prefix: '/api' });
await fastify.register(dashboardRoutes, { prefix: '/api' });
await fastify.register(sessionRoutes, { prefix: '/api' });
await fastify.register(calendarRoutes, { prefix: '/api' });

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
  });

  reply.status(error.statusCode || 500).send({
    success: false,
    error: config.server.nodeEnv === 'development'
      ? error.message
      : 'Internal server error',
  });
});

// Cleanup job - runs daily
const cleanupInterval = setInterval(async () => {
  logger.info('Running cleanup job');
  await cleanupOldDemoData();
}, 24 * 60 * 60 * 1000); // 24 hours

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Graceful shutdown initiated');

  clearInterval(cleanupInterval);

  await fastify.close();
  logger.info('Server closed');

  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const start = async () => {
  try {
    await fastify.listen({
      port: config.server.port,
      host: '0.0.0.0',
    });

    logger.info(`🚀 AIQSO Demo API running on http://0.0.0.0:${config.server.port}`);
    logger.info(`📊 Environment: ${config.server.nodeEnv}`);
    logger.info(`🔒 CORS allowed origins: ${config.server.allowedOrigins.join(', ')}`);
  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

start();
