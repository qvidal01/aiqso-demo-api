import { logger } from '../utils/logger.js';
import { SimulationResult } from '../types/index.js';

// SMS Simulation
export const simulateSMS = (
  phoneNumber: string,
  message: string
): SimulationResult => {
  logger.info('SMS simulated', { phoneNumber, messageLength: message.length });

  return {
    simulated: true,
    action: 'SMS',
    recipient: phoneNumber,
    preview: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
    wouldHappen: `In production, ${phoneNumber} would receive this SMS message via Twilio.`,
    technicalDetails: {
      service: 'Twilio',
      endpoint: 'POST /2010-04-01/Accounts/{AccountSid}/Messages.json',
      cost: '$0.0079 per message',
      deliveryTime: '2-5 seconds',
      characterCount: message.length,
      segmentCount: Math.ceil(message.length / 160),
    },
  };
};

// Phone Call Simulation
export const simulatePhoneCall = (
  phoneNumber: string,
  script: string
): SimulationResult => {
  logger.info('Phone call simulated', { phoneNumber, scriptLength: script.length });

  const estimatedDuration = Math.ceil(script.split(' ').length / 2.5); // ~150 words per minute

  return {
    simulated: true,
    action: 'Phone Call',
    recipient: phoneNumber,
    preview: `Call to ${phoneNumber} - Duration: ~${estimatedDuration} seconds`,
    wouldHappen: `In production, ${phoneNumber} would receive an automated phone call with text-to-speech.`,
    technicalDetails: {
      service: 'Twilio Voice',
      endpoint: 'POST /2010-04-01/Accounts/{AccountSid}/Calls.json',
      cost: `$0.013 per minute (~$${((estimatedDuration / 60) * 0.013).toFixed(3)})`,
      estimatedDuration: `${estimatedDuration} seconds`,
      voice: 'Polly.Joanna (Neural)',
      script: script.substring(0, 200),
    },
  };
};

// Webhook Simulation
export const simulateWebhook = (
  url: string,
  payload: Record<string, any>,
  method: string = 'POST'
): SimulationResult => {
  logger.info('Webhook simulated', { url, method });

  return {
    simulated: true,
    action: 'Webhook',
    recipient: url,
    preview: `${method} request to ${url}`,
    wouldHappen: `In production, a ${method} request would be sent to ${url} with the provided payload.`,
    technicalDetails: {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AIQSO-Automation/1.0',
        'X-AIQSO-Signature': 'hmac-sha256-signature-would-be-here',
      },
      payload,
      timeout: '30 seconds',
      retries: 3,
    },
  };
};

// Slack Message Simulation
export const simulateSlackMessage = (
  channel: string,
  message: string
): SimulationResult => {
  logger.info('Slack message simulated', { channel, messageLength: message.length });

  return {
    simulated: true,
    action: 'Slack Message',
    recipient: channel,
    preview: message.substring(0, 100),
    wouldHappen: `In production, this message would be posted to ${channel} via Slack Web API.`,
    technicalDetails: {
      service: 'Slack Web API',
      endpoint: 'POST /api/chat.postMessage',
      channel,
      message,
      features: ['Markdown formatting', 'Mentions', 'Attachments', 'Threading'],
      cost: 'Free (Slack API)',
    },
  };
};

// CRM Update Simulation
export const simulateCRMUpdate = (
  platform: 'salesforce' | 'hubspot',
  record: Record<string, any>
): SimulationResult => {
  logger.info('CRM update simulated', { platform, recordId: record.id });

  const platformDetails = {
    salesforce: {
      endpoint: 'PATCH /services/data/v58.0/sobjects/{Object}/{Id}',
      authMethod: 'OAuth 2.0',
    },
    hubspot: {
      endpoint: 'PATCH /crm/v3/objects/{objectType}/{objectId}',
      authMethod: 'API Key',
    },
  };

  return {
    simulated: true,
    action: 'CRM Update',
    recipient: `${platform.charAt(0).toUpperCase() + platform.slice(1)} CRM`,
    preview: `Update ${record.type || 'record'}: ${record.id || 'New'}`,
    wouldHappen: `In production, this would update/create a record in ${platform}.`,
    technicalDetails: {
      platform,
      ...platformDetails[platform],
      record,
      cost: 'Included in CRM subscription',
    },
  };
};

// Email Sequence Simulation
export const simulateEmailSequence = (
  emails: Array<{ delay: number; subject: string; to: string }>
): SimulationResult => {
  logger.info('Email sequence simulated', { emailCount: emails.length });

  const totalDuration = emails.reduce((sum, email) => sum + email.delay, 0);

  return {
    simulated: true,
    action: 'Email Sequence',
    recipient: `${emails.length} email(s)`,
    preview: `${emails.length}-email drip campaign over ${Math.ceil(totalDuration / 86400000)} days`,
    wouldHappen: `In production, this would send ${emails.length} emails on a schedule.`,
    technicalDetails: {
      service: 'SendGrid Marketing Campaigns',
      emailCount: emails.length,
      totalDuration: `${Math.ceil(totalDuration / 86400000)} days`,
      schedule: emails.map((e, i) => ({
        step: i + 1,
        subject: e.subject,
        delay: `${Math.ceil(e.delay / 86400000)} days`,
        to: e.to,
      })),
      cost: `$0 (within free tier)`,
    },
  };
};
