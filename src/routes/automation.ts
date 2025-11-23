import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sendEmail } from '../services/sendgrid.js';
import { createCalendarEvent } from '../services/google-calendar.js';
import {
  simulateSMS,
  simulatePhoneCall,
  simulateWebhook,
  simulateSlackMessage,
  simulateCRMUpdate,
} from '../services/simulation.js';
import { saveAutomationResult } from '../services/supabase.js';
import { logger } from '../utils/logger.js';
import { AutomationRequest } from '../types/index.js';

const automationRequestSchema = z.object({
  service: z.string(),
  deliveryMethod: z.enum(['email', 'sms', 'call', 'calendar', 'webhook', 'slack', 'crm']),
  recipient: z.string(),
  payload: z.record(z.any()),
  simulate: z.boolean().optional().default(false),
  accessToken: z.string().optional(),
});

export default async function automationRoutes(fastify: FastifyInstance) {
  // Execute automation
  fastify.post('/automation/execute', async (request, reply) => {
    try {
      const data = automationRequestSchema.parse(request.body);

      logger.info('Automation request received', {
        service: data.service,
        method: data.deliveryMethod,
        simulate: data.simulate,
      });

      let result: any;

      // Email - Real integration
      if (data.deliveryMethod === 'email' && !data.simulate) {
        result = await sendEmail({
          to: data.recipient,
          subject: data.payload.subject || 'AIQSO Demo',
          text: data.payload.message || '',
          html: data.payload.html,
        });
      }
      // Calendar - Real integration (requires OAuth token)
      else if (data.deliveryMethod === 'calendar' && !data.simulate && data.accessToken) {
        result = await createCalendarEvent(data.accessToken, {
          summary: data.payload.summary,
          description: data.payload.description,
          startTime: new Date(data.payload.startTime),
          endTime: new Date(data.payload.endTime),
          attendees: data.payload.attendees || [data.recipient],
          location: data.payload.location,
        });
      }
      // SMS - Simulation
      else if (data.deliveryMethod === 'sms' || (data.deliveryMethod === 'sms' && data.simulate)) {
        result = simulateSMS(data.recipient, data.payload.message || '');
      }
      // Phone Call - Simulation
      else if (data.deliveryMethod === 'call') {
        result = simulatePhoneCall(data.recipient, data.payload.script || '');
      }
      // Webhook - Simulation
      else if (data.deliveryMethod === 'webhook') {
        result = simulateWebhook(data.recipient, data.payload, data.payload.method || 'POST');
      }
      // Slack - Simulation
      else if (data.deliveryMethod === 'slack') {
        result = simulateSlackMessage(data.recipient, data.payload.message || '');
      }
      // CRM - Simulation
      else if (data.deliveryMethod === 'crm') {
        result = simulateCRMUpdate(
          data.payload.platform || 'salesforce',
          data.payload.record || {}
        );
      }
      // Fallback for calendar without token
      else if (data.deliveryMethod === 'calendar') {
        result = {
          simulated: true,
          action: 'Calendar Invite',
          recipient: data.recipient,
          preview: `Calendar event: ${data.payload.summary}`,
          wouldHappen: 'In production, this would create a Google Calendar event and send invites.',
          technicalDetails: {
            service: 'Google Calendar API',
            requiresAuth: true,
            summary: data.payload.summary,
            startTime: data.payload.startTime,
            endTime: data.payload.endTime,
          },
        };
      }
      else {
        throw new Error('Unsupported delivery method');
      }

      // Save result to database (async, don't block response)
      if (result.id) {
        saveAutomationResult(result).catch((err) =>
          logger.error('Failed to save automation result', { error: err })
        );
      }

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Automation execution failed', { error: error.message });

      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to execute automation',
      });
    }
  });

  // Get service catalog
  fastify.get('/automation/services', async (request, reply) => {
    const services = [
      {
        id: 'lead-notification',
        name: 'Lead Notification',
        category: 'crm',
        description: 'Instantly notify sales team of new leads',
        icon: 'UserPlus',
        supportedDeliveryMethods: ['email', 'sms', 'slack'],
        demoTemplate: {
          subject: 'New Lead: {{name}}',
          message: 'New lead from {{source}}: {{name}} ({{email}})',
        },
      },
      {
        id: 'appointment-booking',
        name: 'Appointment Booking',
        category: 'operations',
        description: 'Automated appointment confirmations',
        icon: 'Calendar',
        supportedDeliveryMethods: ['email', 'sms', 'calendar'],
        demoTemplate: {
          subject: 'Your Appointment Confirmation',
          message: 'Your appointment is confirmed for {{date}} at {{time}}',
        },
      },
      {
        id: 'customer-support',
        name: 'Support Ticket Response',
        category: 'support',
        description: 'Auto-respond to support tickets',
        icon: 'MessageCircle',
        supportedDeliveryMethods: ['email', 'slack', 'webhook'],
        demoTemplate: {
          subject: 'Re: Support Ticket #{{ticketId}}',
          message: 'Thank you for contacting support. We\'ve received your request.',
        },
      },
      {
        id: 'order-confirmation',
        name: 'Order Confirmation',
        category: 'operations',
        description: 'Send order confirmations instantly',
        icon: 'ShoppingCart',
        supportedDeliveryMethods: ['email', 'sms'],
        demoTemplate: {
          subject: 'Order Confirmation #{{orderId}}',
          message: 'Your order #{{orderId}} has been confirmed. Total: ${{amount}}',
        },
      },
      {
        id: 'event-registration',
        name: 'Event Registration',
        category: 'marketing',
        description: 'Automate event registrations',
        icon: 'Users',
        supportedDeliveryMethods: ['email', 'calendar', 'sms'],
        demoTemplate: {
          subject: 'You\'re Registered for {{eventName}}',
          message: 'Thanks for registering! Event details: {{date}} at {{location}}',
        },
      },
      {
        id: 'password-reset',
        name: 'Password Reset',
        category: 'support',
        description: 'Automated password reset emails',
        icon: 'Lock',
        supportedDeliveryMethods: ['email', 'sms'],
        demoTemplate: {
          subject: 'Reset Your Password',
          message: 'Click here to reset your password: {{resetLink}}',
        },
      },
      {
        id: 'invoice-reminder',
        name: 'Invoice Reminder',
        category: 'operations',
        description: 'Automated invoice reminders',
        icon: 'DollarSign',
        supportedDeliveryMethods: ['email', 'sms'],
        demoTemplate: {
          subject: 'Invoice #{{invoiceId}} Due Soon',
          message: 'Your invoice of ${{amount}} is due on {{dueDate}}',
        },
      },
      {
        id: 'welcome-sequence',
        name: 'Welcome Email Sequence',
        category: 'marketing',
        description: 'Onboard new users automatically',
        icon: 'Mail',
        supportedDeliveryMethods: ['email'],
        demoTemplate: {
          subject: 'Welcome to {{companyName}}!',
          message: 'We\'re excited to have you! Here\'s how to get started...',
        },
      },
    ];

    return reply.send({
      success: true,
      data: services,
    });
  });
}
