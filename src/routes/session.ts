import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createDemoSession, getDemoSession } from '../services/supabase.js';
import { logger } from '../utils/logger.js';

const createSessionSchema = z.object({
  metadata: z.record(z.any()).optional().default({}),
});

export default async function sessionRoutes(fastify: FastifyInstance) {
  // Create demo session
  fastify.post('/session', async (request: any, reply) => {
    try {
      const { metadata } = createSessionSchema.parse(request.body);
      const userId = request.user?.uid;

      const session = await createDemoSession(userId, metadata);

      logger.info('Demo session created', {
        sessionId: session.id,
        userId: session.userId,
      });

      return reply.send({
        success: true,
        data: session,
      });
    } catch (error: any) {
      logger.error('Session creation failed', { error: error.message });

      return reply.status(500).send({
        success: false,
        error: 'Failed to create session',
      });
    }
  });

  // Get session
  fastify.get('/session/:id', async (request: any, reply) => {
    try {
      const { id } = request.params;

      const session = await getDemoSession(id);

      if (!session) {
        return reply.status(404).send({
          success: false,
          error: 'Session not found',
        });
      }

      // Check if session expired
      if (new Date() > session.expiresAt) {
        return reply.status(410).send({
          success: false,
          error: 'Session expired',
        });
      }

      return reply.send({
        success: true,
        data: session,
      });
    } catch (error: any) {
      logger.error('Failed to get session', { error: error.message });

      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve session',
      });
    }
  });
}
