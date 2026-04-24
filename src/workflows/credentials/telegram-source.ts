/**
 * `ZoyaTelegramConnectionSource` -- bridges Zoya's existing Telegram
 * bot token (configured in `~/.zoya/config.yaml` under
 * `channels.telegram.bot_token`) into the workflow runtime's
 * `CredentialResolver`. When a piece asks for `zoya:telegram`, the source
 * returns the same token Zoya is using for the inbound bot.
 *
 * The piece sees a `SECRET_TEXT`-shaped value:
 *   { secret_text: <bot-token-string> }
 *
 * This matches the engine's V0-context unwrap in
 * `connection-resolver.ts:makeConnectionValueCompatibleWithContextV0`, which
 * reads `connection.value.secret_text` for SECRET_TEXT auth. V1-context
 * pieces receive the same object verbatim. Activepieces' telegram-bot piece
 * sees the raw token string in V0 mode and `auth.secret_text` in V1.
 *
 * If Telegram isn't configured (token missing or empty), `resolve` returns
 * null so the credential resolver falls through to the user's manually-
 * created `app_connection` row, if any.
 */

import type {
  ZoyaConnectionSource,
  ResolvedConnection,
} from "./adapter";

export const ZOYA_TELEGRAM_PREFIX = "zoya:telegram";

export class ZoyaTelegramConnectionSource implements ZoyaConnectionSource {
  readonly id = "telegram";

  /**
   * Token supplier. Closes over the daemon's config so changes (e.g., user
   * rotates the bot token + restarts) take effect without rebuilding the
   * source. Returns null when telegram isn't configured.
   */
  constructor(private readonly getToken: () => string | null) {}

  canResolve(externalId: string): boolean {
    return externalId === ZOYA_TELEGRAM_PREFIX || externalId.startsWith(`${ZOYA_TELEGRAM_PREFIX}:`);
  }

  async resolve(_externalId: string): Promise<ResolvedConnection | null> {
    const token = this.getToken();
    if (!token) return null;
    return {
      type: "SECRET_TEXT",
      value: { secret_text: token },
    };
  }
}

