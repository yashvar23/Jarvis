/**
 * List Sidecars Tool
 *
 * Returns live sidecar connection status. The AI calls this
 * before routing commands to a remote machine via the `target` param.
 */

import type { ToolDefinition } from './registry.ts';
import { getSidecarManager } from './sidecar-route.ts';

export const listSidecarsTool: ToolDefinition = {
  name: 'list_sidecars',
  description: 'List enrolled sidecar machines with live connection status, capabilities, and system info. Use this to discover available remote targets before using run_command, read_file, write_file, or list_directory with a "target" parameter.',
  category: 'sidecar',
  parameters: {
    filter: {
      type: 'string',
      description: 'Optional filter string — only sidecars whose name or ID contain this string are returned (case-insensitive). Omit to list all.',
      required: false,
    },
  },
  execute: async (params) => {
    const manager = getSidecarManager();
    if (!manager) {
      return 'Sidecar system not initialized.';
    }

    const filter = (params.filter as string | undefined)?.trim().toLowerCase();
    let sidecars = manager.listSidecars();

    if (filter) {
      sidecars = sidecars.filter(
        (s) => s.name.toLowerCase().includes(filter) || s.id.toLowerCase().includes(filter),
      );
    }

    if (sidecars.length === 0) {
      return filter
        ? `No sidecars matching "${filter}".`
        : 'No sidecars enrolled.';
    }

    return sidecars.map((s) => {
      const status = s.connected ? 'CONNECTED' : 'OFFLINE';
      const caps = s.capabilities?.length ? s.capabilities.join(', ') : 'none';
      const host = s.hostname ?? 'unknown';
      const os = s.os ?? 'unknown';
      const lastSeen = s.last_seen_at ?? 'never';
      let line = `[${status}] ${s.name} (${s.id})\n  Host: ${host} | OS: ${os} | Capabilities: ${caps} | Last seen: ${lastSeen}`;
      if (s.unavailable_capabilities?.length) {
        const unavailLines = s.unavailable_capabilities.map(u => `    - ${u.name}: ${u.reason}`);
        line += `\n  Unavailable (missing deps):\n${unavailLines.join('\n')}`;
      }
      return line;
    }).join('\n\n');
  },
};
