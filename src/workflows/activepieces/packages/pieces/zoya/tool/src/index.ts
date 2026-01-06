/**
 * `@zoyapieces/piece-zoya-tool` -- invoke a registered Zoya tool by name
 * directly from a flow. Cheap and deterministic: no LLM round-trip, no agent
 * planning, the caller already knows the tool id.
 *
 * Calls back to the daemon's `/v1/zoya/tools/invoke` endpoint via the
 * engine's per-run `context.server` bearer token.
 */

import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { invokeAction } from "./lib/actions/invoke";

export const zoyaToolPiece = createPiece({
  displayName: "Zoya: Tool",
  description:
    "Invoke a registered Zoya tool by name with the given parameters. Use this when you know exactly which tool to call; for LLM-picked tool dispatch use zoya-agent.",
  auth: PieceAuth.None(),
  minimumSupportedRelease: "0.0.0",
  logoUrl: "",
  authors: ["zoya"],
  actions: [invokeAction],
  triggers: [],
});
