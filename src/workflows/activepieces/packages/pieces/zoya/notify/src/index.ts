/**
 * `@zoyapieces/piece-zoya-notify` -- channel-aware delivery. The piece
 * never picks recipients itself; the daemon's notifier handles fan-out across
 * Telegram / Discord / dashboard / desktop / voice.
 *
 * Calls back to `/v1/zoya/notify`.
 */

import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { notifyAction } from "./lib/actions/notify";

export const zoyaNotifyPiece = createPiece({
  displayName: "Zoya: Notify",
  description:
    "Deliver a message to the user via the configured channels (Telegram, Discord, voice, dashboard, desktop).",
  auth: PieceAuth.None(),
  minimumSupportedRelease: "0.0.0",
  logoUrl: "",
  authors: ["zoya"],
  actions: [notifyAction],
  triggers: [],
});
