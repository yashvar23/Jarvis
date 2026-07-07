/**
 * Google API Wrappers
 *
 * Thin wrappers around Gmail and Calendar REST APIs.
 * Uses raw fetch() — no googleapis package needed.
 */

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';
const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';

// --- Types ---

export type GmailMessage = {
  id: string;
  threadId: string;
};

export type GmailMessageDetail = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  labels: string[];
};

export type CalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees: string[];
  htmlLink?: string;
};

// --- Gmail ---

export async function listUnreadEmails(
  accessToken: string,
  maxResults: number = 10
): Promise<GmailMessage[]> {
  const params = new URLSearchParams({
    q: 'is:unread',
    maxResults: String(maxResults),
  });

  const resp = await fetch(`${GMAIL_BASE}/messages?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    throw new Error(`Gmail list failed: ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json() as any;
  return (data.messages ?? []).map((m: any) => ({
    id: m.id,
    threadId: m.threadId,
  }));
}

export async function getEmailDetail(
  accessToken: string,
  messageId: string
): Promise<GmailMessageDetail> {
  const resp = await fetch(`${GMAIL_BASE}/messages/${messageId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    throw new Error(`Gmail get failed: ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json() as any;
  const headers = data.payload?.headers ?? [];

  function getHeader(name: string): string {
    return headers.find((h: any) => h.name === name)?.value ?? '';
  }

  return {
    id: data.id,
    threadId: data.threadId,
    subject: getHeader('Subject'),
    from: getHeader('From'),
    to: getHeader('To'),
    date: getHeader('Date'),
    snippet: data.snippet ?? '',
    labels: data.labelIds ?? [],
  };
}

// --- Calendar ---

export async function listUpcomingEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
  maxResults: number = 20
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    maxResults: String(maxResults),
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const resp = await fetch(
    `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!resp.ok) {
    throw new Error(`Calendar list failed: ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json() as any;
  return (data.items ?? []).map((event: any) => ({
    id: event.id,
    summary: event.summary ?? '(No title)',
    description: event.description,
    start: event.start?.dateTime ?? event.start?.date ?? '',
    end: event.end?.dateTime ?? event.end?.date ?? '',
    location: event.location,
    attendees: (event.attendees ?? []).map((a: any) => a.email).filter(Boolean),
    htmlLink: event.htmlLink,
  }));
}
