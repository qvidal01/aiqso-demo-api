import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { chat as openaiChat, generateWorkflow, getUsageStats } from '../services/openai.js';
import { logger } from '../utils/logger.js';
import { ChatRequest } from '../types/index.js';

const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  context: z.enum(['workflow', 'automation', 'general']).optional(),
  conversationId: z.string().optional(),
});

export default async function chatRoutes(fastify: FastifyInstance) {
  // Chat with Cyberque
  fastify.post('/chat', async (request, reply) => {
    try {
      const data = chatRequestSchema.parse(request.body);

      logger.info('Chat request received', {
        context: data.context,
        conversationId: data.conversationId,
      });

      const response = await openaiChat(data as ChatRequest);

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: any) {
      logger.error('Chat request failed', { error: error.message });

      return reply.status(400).send({
        success: false,
        error: error.message || 'Chat request failed',
      });
    }
  });

  // Generate workflow from description
  fastify.post('/chat/generate-workflow', async (request, reply) => {
    try {
      const schema = z.object({
        description: z.string().min(10).max(500),
      });

      const { description } = schema.parse(request.body);

      logger.info('Workflow generation requested', { description });

      const workflow = await generateWorkflow(description);

      if (!workflow) {
        return reply.status(400).send({
          success: false,
          error: 'Failed to generate workflow. Please provide more details.',
        });
      }

      return reply.send({
        success: true,
        data: workflow,
      });
    } catch (error: any) {
      logger.error('Workflow generation failed', { error: error.message });

      return reply.status(400).send({
        success: false,
        error: error.message || 'Workflow generation failed',
      });
    }
  });

  // Get usage stats
  fastify.get('/chat/usage', async (request, reply) => {
    const stats = getUsageStats();

    return reply.send({
      success: true,
      data: stats,
    });
  });
}
