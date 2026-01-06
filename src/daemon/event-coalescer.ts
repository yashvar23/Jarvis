/**
 * Event Coalescer — Batch Buffer
 *
 * Collects normal/low priority events in memory and flushes them
 * as a formatted summary string at heartbeat time. Groups events
 * by type for clean LLM consumption.
 */

import type { ClassifiedEvent, EventPriority } from './event-classifier.ts';

const MAX_BUFFER_SIZE = 100;

export class EventCoalescer {
  private buffer: ClassifiedEvent[] = [];

  /**
   * Add a classified event to the buffer.
   * Oldest events are dropped if buffer exceeds max size.
   */
  addEvent(event: ClassifiedEvent): void {
    this.buffer.push(event);

    if (this.buffer.length > MAX_BUFFER_SIZE) {
      // Drop oldest events
      const overflow = this.buffer.length - MAX_BUFFER_SIZE;
      this.buffer.splice(0, overflow);
    }
  }

  /**
   * Get the current buffer size.
   */
  get size(): number {
    return this.buffer.length;
  }

  /**
   * Flush the buffer and return a formatted summary string.
   * Returns empty string if no events buffered.
   */
  flush(): string {
    if (this.buffer.length === 0) {
      return '';
    }

    const events = [...this.buffer];
    this.buffer = [];

    // Group by event type
    const groups = new Map<string, ClassifiedEvent[]>();
    for (const evt of events) {
      const type = evt.event.type;
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(evt);
    }

    // Format each group
    const lines: string[] = [];
    lines.push(`## Recent Activity (${events.length} events since last check)`);
    lines.push('');

    for (const [type, groupEvents] of groups) {
      const label = formatEventType(type);
      lines.push(`**${label}** (${groupEvents.length}):`);

      // Show up to 5 details per group, summarize the rest
      const shown = groupEvents.slice(0, 5);
      for (const evt of shown) {
        lines.push(`  - ${evt.reason}`);
      }

      if (groupEvents.length > 5) {
        lines.push(`  - ... and ${groupEvents.length - 5} more`);
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Peek at the buffer without clearing it.
   */
  peek(): ClassifiedEvent[] {
    return [...this.buffer];
  }

  /**
   * Clear the buffer without returning anything.
   */
  clear(): void {
    this.buffer = [];
  }
}

/**
 * Human-readable label for event types.
 */
function formatEventType(type: string): string {
  switch (type) {
    case 'file_change': return 'File Changes';
    case 'clipboard': return 'Clipboard Activity';
    case 'process_started': return 'Apps Launched';
    case 'process_stopped': return 'Apps Closed';
    case 'notification': return 'System Notifications';
    case 'calendar': return 'Calendar Events';
    case 'email': return 'Emails';
    case 'browser': return 'Browser Activity';
    case 'commitment_overdue': return 'Overdue Commitments';
    case 'commitment_due_soon': return 'Upcoming Commitments';
    case 'screen_capture': return 'Screen Captures';
    case 'context_changed': return 'Context Switches';
    case 'error_detected': return 'Screen Errors';
    case 'stuck_detected': return 'Stuck Detection';
    case 'session_started': return 'Sessions Started';
    case 'session_ended': return 'Sessions Ended';
    case 'suggestion_ready': return 'Awareness Suggestions';
    default: return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
