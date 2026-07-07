const TELEMETRY_URL = 'https://jarvis-6a52f-default-rtdb.firebaseio.com/telemetry_pings.json';
const TELEMETRY_ANON_KEY = '';

/** 1 hour. Server processes that never restart still emit a heartbeat. */
export const HEARTBEAT_INTERVAL_MS = 60 * 60 * 1000;

export function telemetryEndpoint(): { url: string; key: string } | null {
  if (!TELEMETRY_URL) {
    return null;
  }
  return { url: TELEMETRY_URL, key: TELEMETRY_ANON_KEY };
}
