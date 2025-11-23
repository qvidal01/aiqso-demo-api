import sgMail from '@sendgrid/mail';
import { getConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { EmailPayload, AutomationResult } from '../types/index.js';

const config = getConfig();

sgMail.setApiKey(config.sendgrid.apiKey);

let dailyEmailCount = 0;
let lastResetDate = new Date().toDateString();

const checkDailyLimit = (): boolean => {
  const today = new Date().toDateString();

  if (today !== lastResetDate) {
    dailyEmailCount = 0;
    lastResetDate = today;
  }

  return dailyEmailCount < config.budget.sendgridDaily;
};

export const sendEmail = async (payload: EmailPayload): Promise<AutomationResult> => {
  try {
    if (!checkDailyLimit()) {
      throw new Error(`Daily email limit (${config.budget.sendgridDaily}) reached`);
    }

    const msg = {
      to: payload.to,
      from: {
        email: config.sendgrid.fromEmail,
        name: config.sendgrid.fromName,
      },
      subject: payload.subject,
      text: payload.text,
      html: payload.html || `<p>${payload.text}</p>`,
    };

    await sgMail.send(msg);
    dailyEmailCount++;

    logger.info('Email sent successfully', {
      to: payload.to,
      subject: payload.subject,
      count: dailyEmailCount,
    });

    return {
      id: `email_${Date.now()}`,
      status: 'success',
      deliveryMethod: 'email',
      timestamp: new Date(),
      details: `Email sent to ${payload.to}`,
      metadata: {
        subject: payload.subject,
        dailyCount: dailyEmailCount,
      },
    };
  } catch (error: any) {
    logger.error('Email sending failed', { error: error.message, payload });

    return {
      id: `email_${Date.now()}`,
      status: 'failed',
      deliveryMethod: 'email',
      timestamp: new Date(),
      details: `Failed to send email: ${error.message}`,
    };
  }
};

export const sendTemplateEmail = async (
  to: string,
  templateId: string,
  dynamicData: Record<string, any>
): Promise<AutomationResult> => {
  try {
    if (!checkDailyLimit()) {
      throw new Error(`Daily email limit (${config.budget.sendgridDaily}) reached`);
    }

    const msg = {
      to,
      from: {
        email: config.sendgrid.fromEmail,
        name: config.sendgrid.fromName,
      },
      templateId,
      dynamicTemplateData: dynamicData,
    };

    await sgMail.send(msg);
    dailyEmailCount++;

    logger.info('Template email sent successfully', {
      to,
      templateId,
      count: dailyEmailCount,
    });

    return {
      id: `email_${Date.now()}`,
      status: 'success',
      deliveryMethod: 'email',
      timestamp: new Date(),
      details: `Template email sent to ${to}`,
      metadata: {
        templateId,
        dailyCount: dailyEmailCount,
      },
    };
  } catch (error: any) {
    logger.error('Template email sending failed', { error: error.message });

    return {
      id: `email_${Date.now()}`,
      status: 'failed',
      deliveryMethod: 'email',
      timestamp: new Date(),
      details: `Failed to send template email: ${error.message}`,
    };
  }
};

export const getDailyEmailStats = () => ({
  sent: dailyEmailCount,
  limit: config.budget.sendgridDaily,
  remaining: config.budget.sendgridDaily - dailyEmailCount,
  resetDate: lastResetDate,
});
