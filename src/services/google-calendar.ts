import { google } from 'googleapis';
import { getConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { CalendarEventPayload, AutomationResult } from '../types/index.js';

const config = getConfig();

const oauth2Client = new google.auth.OAuth2(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri
);

export const getAuthUrl = (): string => {
  const scopes = ['https://www.googleapis.com/auth/calendar.events'];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
};

export const getTokensFromCode = async (code: string) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error: any) {
    logger.error('Failed to get tokens from code', { error: error.message });
    throw new Error('Failed to authenticate with Google Calendar');
  }
};

export const createCalendarEvent = async (
  accessToken: string,
  payload: CalendarEventPayload
): Promise<AutomationResult> => {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: payload.summary,
      description: payload.description,
      location: payload.location,
      start: {
        dateTime: payload.startTime.toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: payload.endTime.toISOString(),
        timeZone: 'America/New_York',
      },
      attendees: payload.attendees.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `aiqso-demo-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: event,
      sendUpdates: 'all',
    });

    logger.info('Calendar event created', {
      eventId: response.data.id,
      summary: payload.summary,
      attendees: payload.attendees.length,
    });

    return {
      id: `calendar_${Date.now()}`,
      status: 'success',
      deliveryMethod: 'calendar',
      timestamp: new Date(),
      details: `Calendar invite sent to ${payload.attendees.length} attendee(s)`,
      metadata: {
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
        hangoutLink: response.data.hangoutLink,
      },
    };
  } catch (error: any) {
    logger.error('Calendar event creation failed', {
      error: error.message,
      payload,
    });

    return {
      id: `calendar_${Date.now()}`,
      status: 'failed',
      deliveryMethod: 'calendar',
      timestamp: new Date(),
      details: `Failed to create calendar event: ${error.message}`,
    };
  }
};

export const revokeToken = async (accessToken: string): Promise<void> => {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    await oauth2Client.revokeCredentials();
    logger.info('Calendar token revoked');
  } catch (error: any) {
    logger.error('Token revocation failed', { error: error.message });
  }
};
