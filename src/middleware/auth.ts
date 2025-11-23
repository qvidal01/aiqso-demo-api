import { FastifyRequest, FastifyReply } from 'fastify';
import admin from 'firebase-admin';
import { logger } from '../utils/logger.js';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    uid: string;
    email?: string;
  };
}

export const optionalAuth = async (
  request: AuthenticatedRequest,
  reply: FastifyReply
) => {
  try {
    // Check if Firebase is initialized
    if (admin.apps.length === 0) {
      // Firebase not configured, continue as guest
      return;
    }

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth provided, continue as guest
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
      logger.debug('User authenticated', { uid: decodedToken.uid });
    } catch (error) {
      // Invalid token, continue as guest but log the error
      logger.warn('Invalid auth token', { error });
    }
  } catch (error) {
    logger.error('Auth middleware error', { error });
  }
};

export const requireAuth = async (
  request: AuthenticatedRequest,
  reply: FastifyReply
) => {
  try {
    // Check if Firebase is initialized
    if (admin.apps.length === 0) {
      return reply.status(503).send({
        success: false,
        error: 'Authentication not configured on this server',
      });
    }

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    const token = authHeader.split('Bearer ')[1];

    const decodedToken = await admin.auth().verifyIdToken(token);
    request.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    logger.debug('User authenticated (required)', { uid: decodedToken.uid });
  } catch (error) {
    logger.error('Auth verification failed', { error });
    return reply.status(401).send({
      success: false,
      error: 'Invalid authentication token',
    });
  }
};
