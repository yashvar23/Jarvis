/**
 * `@zoyapieces/piece-zoya-agent` -- delegate a goal to a Zoya sub-agent
 * (M7). The agent runs its own LLM + tool-loop and returns a final message
 * plus the trace of tools it invoked. Use this when the LLM should plan and
 * pick tools; for known-tool invocation use `zoya-tool`, for single-shot
 * LLM completion use `zoya-ask`.
 *
 * Calls back to `/v1/zoya/agent/delegate`.
 */

import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { delegateAction } from "./lib/actions/delegate";

export const zoyaAgentPiece = createPiece({
  displayName: "Zoya: Agent",
  description:
    "Run a Zoya sub-agent (M7) with a goal. The agent uses its full reasoning + tool loop and returns the final answer plus the tool-call trace.",
  auth: PieceAuth.None(),
  minimumSupportedRelease: "0.0.0",
  logoUrl: "",
  authors: ["zoya"],
  actions: [delegateAction],
  triggers: [],
});

