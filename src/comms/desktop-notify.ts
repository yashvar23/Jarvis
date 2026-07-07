/**
 * Desktop Notification Sender
 *
 * Sends native desktop notifications.
 * Tries in order:
 *   1. notify-send (Linux/WSLg)
 *   2. PowerShell toast (WSL2 → Windows)
 * Gracefully degrades if neither is available.
 */

type NotifyMethod = 'notify-send' | 'powershell' | null;

let method: NotifyMethod | undefined;

function detectMethod(): NotifyMethod {
  if (method !== undefined) return method;

  // Try notify-send first (native Linux/WSLg)
  try {
    const result = Bun.spawnSync(['which', 'notify-send']);
    if (result.exitCode === 0) {
      method = 'notify-send';
      console.log('[DesktopNotify] Using notify-send');
      return method;
    }
  } catch { /* continue */ }

  // Try PowerShell (WSL2 → Windows toast)
  try {
    const result = Bun.spawnSync(['which', 'powershell.exe']);
    if (result.exitCode === 0) {
      method = 'powershell';
      console.log('[DesktopNotify] Using PowerShell toasts');
      return method;
    }
  } catch { /* continue */ }

  method = null;
  console.log('[DesktopNotify] No notification method available');
  return method;
}

/**
 * Send a native desktop notification.
 * Returns true if sent, false if unavailable.
 */
export function sendDesktopNotification(
  title: string,
  body: string,
  options?: {
    urgency?: 'low' | 'normal' | 'critical';
    expireMs?: number;
  }
): boolean {
  const m = detectMethod();
  if (!m) return false;

  try {
    if (m === 'notify-send') {
      return sendViaNotifySend(title, body, options);
    } else {
      return sendViaPowerShell(title, body);
    }
  } catch {
    return false;
  }
}

function sendViaNotifySend(
  title: string,
  body: string,
  options?: { urgency?: string; expireMs?: number }
): boolean {
  const urgency = options?.urgency ?? 'normal';
  const expireMs = options?.expireMs ?? (urgency === 'critical' ? 10000 : 5000);

  Bun.spawn([
    'notify-send',
    `--urgency=${urgency}`,
    `--expire-time=${expireMs}`,
    '--app-name=JARVIS',
    title,
    body,
  ], { stdout: 'ignore', stderr: 'ignore' });
  return true;
}

function sendViaPowerShell(title: string, body: string): boolean {
  // Escape single quotes for PowerShell
  const safeTitle = title.replace(/'/g, "''").slice(0, 100);
  const safeBody = body.replace(/'/g, "''").slice(0, 200);

  const script = `
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime] | Out-Null
    $xml = [Windows.Data.Xml.Dom.XmlDocument]::new()
    $xml.LoadXml('<toast><visual><binding template="ToastText02"><text id="1">${safeTitle}</text><text id="2">${safeBody}</text></binding></visual></toast>')
    $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('JARVIS').Show($toast)
  `.trim();

  Bun.spawn(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', script], {
    stdout: 'ignore',
    stderr: 'ignore',
  });
  return true;
}

/**
 * Check if desktop notifications are available.
 */
export function isDesktopNotifyAvailable(): boolean {
  return detectMethod() !== null;
}
