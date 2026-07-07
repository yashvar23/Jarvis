/**
 * Research Queue Tool
 *
 * Lets the agent (or user via chat) manage the background research queue.
 * Actions: add, list, remove.
 */

import type { ToolDefinition } from './registry.ts';
import type { ResearchQueue, ResearchPriority } from '../../daemon/research-queue.ts';

let queueRef: ResearchQueue | null = null;

/**
 * Wire the research queue instance. Must be called before tool use.
 */
export function setResearchQueueRef(queue: ResearchQueue): void {
  queueRef = queue;
}

export const researchQueueTool: ToolDefinition = {
  name: 'research_queue',
  description: 'Manage the background research queue. Add topics for JARVIS to research during idle time, list current queue, or remove topics.',
  category: 'productivity',
  parameters: {
    action: {
      type: 'string',
      description: 'Action to perform: "add", "list", or "remove"',
      required: true,
    },
    topic: {
      type: 'string',
      description: 'The research topic (required for "add")',
      required: false,
    },
    reason: {
      type: 'string',
      description: 'Why this topic should be researched (required for "add")',
      required: false,
    },
    priority: {
      type: 'string',
      description: 'Priority: "high", "normal", or "low" (default: "normal", for "add" only)',
      required: false,
    },
    id: {
      type: 'string',
      description: 'Topic ID to remove (required for "remove")',
      required: false,
    },
    status: {
      type: 'string',
      description: 'Filter by status for "list": "queued", "in_progress", "completed", "failed"',
      required: false,
    },
  },
  execute: async (params) => {
    if (!queueRef) {
      return { error: 'Research queue not initialized' };
    }

    const action = String(params.action ?? '');

    switch (action) {
      case 'add': {
        const topic = String(params.topic ?? '');
        const reason = String(params.reason ?? 'No reason provided');
        const priority = (params.priority as ResearchPriority) ?? 'normal';

        if (!topic) {
          return { error: 'Missing "topic" parameter' };
        }

        const entry = queueRef.addTopic(topic, reason, 'agent', priority);
        return {
          success: true,
          id: entry.id,
          message: `Added to research queue: "${topic}" (${priority} priority)`,
        };
      }

      case 'list': {
        const status = params.status as any;
        const topics = queueRef.list(status || undefined);
        return {
          count: topics.length,
          topics: topics.map((t) => ({
            id: t.id,
            topic: t.topic,
            reason: t.reason,
            priority: t.priority,
            status: t.status,
            source: t.source,
            result: t.result ? (t.result.length > 200 ? t.result.slice(0, 197) + '...' : t.result) : undefined,
          })),
        };
      }

      case 'remove': {
        const id = String(params.id ?? '');
        if (!id) {
          return { error: 'Missing "id" parameter' };
        }
        const removed = queueRef.remove(id);
        return { success: removed, message: removed ? 'Topic removed' : 'Topic not found' };
      }

      default:
        return { error: `Unknown action: "${action}". Use "add", "list", or "remove".` };
    }
  },
};
