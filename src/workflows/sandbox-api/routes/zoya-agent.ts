/**
 * `/v1/zoya/agent/delegate` -- backs the `zoya-agent` piece's `delegate`
 * action. The piece posts `{ goal, role?, maxIterations? }`; the route
 * returns the agent's `{ finalMessage, toolCalls, status, error? }`.
 *
 * Sub-agent execution (M7) lives entirely in the daemon. The handler here
 * only validates the envelope and dispatches to an injected `AgentDelegateFn`.
 */

import { json, err, parseJsonObject, type RouteContext, type RouteHandler } from "./shared";

export interface AgentDelegateRequest {
  goal: string;
  role?: string;
  maxIterations?: number;
}

export interface AgentDelegateResponse {
  finalMessage: string;
  toolCalls: Array<{
    name: string;
    args?: string;
    result?: string;
    error?: string;
  }>;
  status: "completed" | "max_iterations" | "error" | "canceled";
  error?: string;
}

export type AgentDelegateFn = (
  req: AgentDelegateRequest,
  ctx: { runId: string; projectId: string },
) => Promise<AgentDelegateResponse>;

export interface ZoyaAgentRouteDeps {
  agentDelegate?: AgentDelegateFn;
}

export function createZoyaAgentDelegateRoute(
  deps: ZoyaAgentRouteDeps,
): RouteHandler {
  return async (ctx: RouteContext) => {
    if (!deps.agentDelegate) {
      return err("zoya agent.delegate not configured", 503);
    }
    const raw = await parseJsonObject(ctx);
    if (raw instanceof Response) return raw;
    if (typeof raw.goal !== "string" || raw.goal.length === 0) {
      return err("goal must be a non-empty string", 400);
    }
    const out: AgentDelegateRequest = { goal: raw.goal };
    if (raw.role !== undefined) {
      if (typeof raw.role !== "string" || raw.role.length === 0) {
        return err("role must be a non-empty string if provided", 400);
      }
      out.role = raw.role;
    }
    if (raw.maxIterations !== undefined) {
      const n = raw.maxIterations;
      if (
        typeof n !== "number" ||
        !Number.isFinite(n) ||
        n <= 0 ||
        Math.floor(n) !== n
      ) {
        return err("maxIterations must be a positive integer", 400);
      }
      out.maxIterations = n;
    }
    const reply = await deps.agentDelegate(out, {
      runId: ctx.claims.runId,
      projectId: ctx.claims.projectId,
    });
    return json(reply);
  };
}
