import { FastifyInstance } from 'fastify';
import { getAuthUrl, getTokensFromCode } from '../services/google-calendar.js';
import { logger } from '../utils/logger.js';

export default async function calendarRoutes(fastify: FastifyInstance) {
  // Get OAuth URL for Google Calendar
  fastify.get('/calendar/auth-url', async (request, reply) => {
    try {
      const authUrl = getAuthUrl();

      return reply.send({
        success: true,
        data: { authUrl },
      });
    } catch (error: any) {
      logger.error('Failed to generate auth URL', { error: error.message });

      return reply.status(500).send({
        success: false,
        error: 'Failed to generate authorization URL',
      });
    }
  });

  // OAuth callback handler
  fastify.get('/calendar/callback', async (request: any, reply) => {
    try {
      const { code, state } = request.query;

      if (!code) {
        return reply.status(400).send({
          success: false,
          error: 'Authorization code missing',
        });
      }

      const tokens = await getTokensFromCode(code);

      logger.info('Google Calendar authorized', { hasRefreshToken: !!tokens.refresh_token });

      // In a real app, you'd store these tokens securely
      // For demo, we'll return them to be stored client-side temporarily
      return reply.send({
        success: true,
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresIn: tokens.expiry_date,
        },
      });
    } catch (error: any) {
      logger.error('Calendar OAuth callback failed', { error: error.message });

      return reply.status(500).send({
        success: false,
        error: 'Authorization failed',
      });
    }
  });
}
