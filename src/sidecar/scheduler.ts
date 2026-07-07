/**
 * Event Scheduler — Round-Robin Fairness
 *
 * Processes sidecar events with round-robin scheduling across sidecars
 * to prevent any single sidecar from monopolizing event handling.
 */

import type { SidecarEvent, EventPriority } from './protocol.ts';

interface QueuedEvent {
  sidecarId: string;
  event: SidecarEvent;
  priority: EventPriority;
  enqueuedAt: number;
}

type EventHandler = (sidecarId: string, event: SidecarEvent) => Promise<void>;

export class EventScheduler {
  private queues = new Map<string, QueuedEvent[]>();
  private sidecarIds: string[] = [];
  private roundRobinIndex = 0;
  private handlers = new Map<string, EventHandler[]>();
  private running = false;
  private processing = false;
  private drainTimer: Timer | null = null;
  private readonly drainIntervalMs: number;

  constructor(drainIntervalMs = 50) {
    this.drainIntervalMs = drainIntervalMs;
  }

  /** Register a handler for a specific event_type */
  on(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  /** Enqueue an event from a sidecar */
  enqueue(sidecarId: string, event: SidecarEvent, priority?: EventPriority): void {
    let queue = this.queues.get(sidecarId);
    if (!queue) {
      queue = [];
      this.queues.set(sidecarId, queue);
      this.sidecarIds.push(sidecarId);
    }

    queue.push({
      sidecarId,
      event,
      priority: priority ?? event.priority ?? 'normal',
      enqueuedAt: Date.now(),
    });

    // Sort by priority within each sidecar's queue
    queue.sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority));
  }

  /** Remove a sidecar's queue (on disconnect) */
  removeSidecar(sidecarId: string): void {
    this.queues.delete(sidecarId);
    this.sidecarIds = this.sidecarIds.filter(id => id !== sidecarId);
    if (this.roundRobinIndex >= this.sidecarIds.length) {
      this.roundRobinIndex = 0;
    }
  }

  /** Start the processing loop */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.drainTimer = setInterval(() => this.drain(), this.drainIntervalMs);
  }

  /** Stop the processing loop */
  stop(): void {
    this.running = false;
    if (this.drainTimer) {
      clearInterval(this.drainTimer);
      this.drainTimer = null;
    }
  }

  private async drain(): Promise<void> {
    if (this.processing || this.sidecarIds.length === 0) return;
    this.processing = true;

    try {
      // One round-robin pass: try each sidecar once
      const count = this.sidecarIds.length;
      for (let i = 0; i < count; i++) {
        const idx = (this.roundRobinIndex + i) % count;
        const sidecarId = this.sidecarIds[idx]!;
        const queue = this.queues.get(sidecarId);

        if (!queue || queue.length === 0) continue;

        const item = queue.shift()!;
        this.roundRobinIndex = (idx + 1) % count;

        await this.dispatch(item);

        // Process one event per drain tick to stay non-blocking
        break;
      }
    } catch (err) {
      console.error('[EventScheduler] Drain error:', err);
    } finally {
      this.processing = false;
    }
  }

  private async dispatch(item: QueuedEvent): Promise<void> {
    const handlers = this.handlers.get(item.event.event_type) ?? [];
    const wildcardHandlers = this.handlers.get('*') ?? [];
    const allHandlers = [...handlers, ...wildcardHandlers];

    for (const handler of allHandlers) {
      try {
        await handler(item.sidecarId, item.event);
      } catch (err) {
        console.error(`[EventScheduler] Handler error for ${item.event.event_type}:`, err);
      }
    }
  }
}

function priorityWeight(p: EventPriority): number {
  switch (p) {
    case 'critical': return 0;
    case 'high': return 1;
    case 'normal': return 2;
    case 'low': return 3;
  }
}
