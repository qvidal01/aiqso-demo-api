import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../services/supabase.js';
import { logger } from '../utils/logger.js';

// Schema for tracking events
const trackEventSchema = z.object({
  event: z.string(),
  source_page: z.string(),
  source_section: z.string().optional(),
  referrer: z.string().optional(),
  utm: z.object({
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_term: z.string().optional(),
    utm_content: z.string().optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.string().optional(),
  user_agent: z.string().optional(),
});

// Schema for feedback
const feedbackSchema = z.object({
  type: z.enum(['bug', 'suggestion', 'question', 'other']),
  message: z.string().min(1),
  email: z.string().email().optional().nullable(),
  source_page: z.string().optional(),
  user_agent: z.string().optional(),
});

// Schema for newsletter subscription
const newsletterSchema = z.object({
  email: z.string().email(),
  frequency: z.enum(['weekly', 'monthly']).default('monthly'),
  source_page: z.string().optional(),
  referrer: z.string().optional(),
  timestamp: z.string().optional(),
  userAgent: z.string().optional(),
});

// Simple hash function for IP privacy
function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export default async function trackingRoutes(fastify: FastifyInstance) {
  // Track website events
  fastify.post('/track', async (request, reply) => {
    try {
      const data = trackEventSchema.parse(request.body);

      // Get client IP
      const forwarded = request.headers['x-forwarded-for'];
      const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'unknown';

      const { error } = await supabase.from('website_events').insert([
        {
          event_type: data.event,
          source_page: data.source_page,
          source_section: data.source_section || null,
          referrer: data.referrer || null,
          utm_source: data.utm?.utm_source || null,
          utm_medium: data.utm?.utm_medium || null,
          utm_campaign: data.utm?.utm_campaign || null,
          utm_term: data.utm?.utm_term || null,
          utm_content: data.utm?.utm_content || null,
          metadata: data.metadata || {},
          user_agent: data.user_agent || null,
          ip_hash: ip !== 'unknown' ? hashIP(ip) : null,
          created_at: data.timestamp || new Date().toISOString(),
        },
      ]);

      if (error) {
        logger.error('Failed to store tracking event', { error });
        return reply.status(200).send({ success: true, stored: false });
      }

      logger.debug('Tracking event stored', { event: data.event, source: data.source_page });
      return { success: true, stored: true };
    } catch (error: any) {
      logger.error('Track API error', { error: error.message });
      return reply.status(200).send({ success: false });
    }
  });

  // Submit feedback
  fastify.post('/feedback', async (request, reply) => {
    try {
      const data = feedbackSchema.parse(request.body);

      const { error } = await supabase.from('website_feedback').insert([
        {
          type: data.type,
          message: data.message,
          email: data.email || null,
          source_page: data.source_page || '/',
          user_agent: data.user_agent || null,
          status: 'new',
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        logger.error('Failed to store feedback', { error });
        return reply.status(500).send({ error: 'Failed to save feedback' });
      }

      logger.info('Feedback received', { type: data.type, source: data.source_page });
      return { success: true, message: 'Feedback received!' };
    } catch (error: any) {
      logger.error('Feedback API error', { error: error.message });
      return reply.status(400).send({ error: error.message });
    }
  });

  // Get feedback (for admin)
  fastify.get('/feedback', async (request, reply) => {
    try {
      const { status, limit = '50' } = request.query as { status?: string; limit?: string };

      let query = supabase
        .from('website_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        return reply.status(500).send({ error: 'Failed to fetch feedback' });
      }

      return { feedback: data };
    } catch (error: any) {
      return reply.status(500).send({ error: 'Failed to fetch feedback' });
    }
  });

  // Newsletter subscription
  fastify.post('/newsletter', async (request, reply) => {
    try {
      const data = newsletterSchema.parse(request.body);

      // Check if already subscribed
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id, status')
        .eq('email', data.email)
        .single();

      if (existing) {
        if (existing.status === 'active') {
          return { success: true, message: 'Already subscribed!' };
        }
        // Reactivate if previously unsubscribed
        await supabase
          .from('newsletter_subscribers')
          .update({
            status: 'active',
            frequency: data.frequency,
            subscribed_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        logger.info('Newsletter reactivated', { email: data.email });
        return { success: true, message: 'Subscription reactivated!' };
      }

      // New subscription
      const { error } = await supabase.from('newsletter_subscribers').insert([
        {
          email: data.email,
          frequency: data.frequency,
          source_page: data.source_page || '/',
          referrer: data.referrer || null,
          subscribed_at: new Date().toISOString(),
          status: 'active',
        },
      ]);

      if (error) {
        logger.error('Failed to store newsletter subscription', { error });
        // Still return success - don't fail the user experience
        return { success: true, message: 'Subscribed!' };
      }

      // Also track as an event
      await supabase.from('website_events').insert([
        {
          event_type: 'newsletter_signup',
          source_page: data.source_page || '/',
          referrer: data.referrer || null,
          metadata: { email_domain: data.email.split('@')[1], frequency: data.frequency },
          created_at: new Date().toISOString(),
        },
      ]);

      logger.info('Newsletter subscription', { email: data.email, source: data.source_page });
      return { success: true, message: 'Successfully subscribed!' };
    } catch (error: any) {
      logger.error('Newsletter API error', { error: error.message });
      return reply.status(400).send({ error: error.message });
    }
  });

  // Get newsletter subscribers (for admin)
  fastify.get('/newsletter/subscribers', async (request, reply) => {
    try {
      const { status = 'active', limit = '100' } = request.query as { status?: string; limit?: string };

      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('status', status)
        .order('subscribed_at', { ascending: false })
        .limit(parseInt(limit));

      if (error) {
        return reply.status(500).send({ error: 'Failed to fetch subscribers' });
      }

      return { subscribers: data, count: data?.length || 0 };
    } catch (error: any) {
      return reply.status(500).send({ error: 'Failed to fetch subscribers' });
    }
  });

  // Analytics summary
  fastify.get('/analytics/summary', async (request, reply) => {
    try {
      const { days = '30' } = request.query as { days?: string };
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(days));

      // Get event counts by type
      const { data: events } = await supabase
        .from('website_events')
        .select('event_type')
        .gte('created_at', cutoff.toISOString());

      const eventCounts: Record<string, number> = {};
      events?.forEach(e => {
        eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
      });

      // Get subscriber count
      const { count: subscriberCount } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get feedback count
      const { count: feedbackCount } = await supabase
        .from('website_feedback')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');

      // Get top source pages
      const { data: sourcePagesRaw } = await supabase
        .from('website_events')
        .select('source_page')
        .gte('created_at', cutoff.toISOString());

      const sourcePageCounts: Record<string, number> = {};
      sourcePagesRaw?.forEach(e => {
        sourcePageCounts[e.source_page] = (sourcePageCounts[e.source_page] || 0) + 1;
      });

      const topSourcePages = Object.entries(sourcePageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([page, count]) => ({ page, count }));

      return {
        period_days: parseInt(days),
        events: eventCounts,
        total_events: events?.length || 0,
        active_subscribers: subscriberCount || 0,
        pending_feedback: feedbackCount || 0,
        top_source_pages: topSourcePages,
      };
    } catch (error: any) {
      logger.error('Analytics summary error', { error: error.message });
      return reply.status(500).send({ error: 'Failed to fetch analytics' });
    }
  });
}
