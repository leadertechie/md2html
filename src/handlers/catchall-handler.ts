import { TokenHandler, ParseContext } from './types.js';

/**
 * Catch-all handler for any token type that doesn't have a dedicated handler.
 * Wraps the raw token content in a container node so content is never silently lost.
 * Reports the unhandled type via the context's reportUnhandled callback.
 */
export class CatchAllHandler implements TokenHandler {
  readonly type = '*';

  handle(token: Record<string, unknown>, ctx: ParseContext) {
    const tokenType = token.type as string;

    // Report the unhandled token so callers can be notified
    ctx.reportUnhandled(tokenType, token);

    // Try to extract meaningful content from the raw token
    const raw = token.raw as string | undefined;
    const text = token.text as string | undefined;
    const content = raw || text || `[unhandled: ${tokenType}]`;

    return {
      type: 'container' as const,
      content,
      attributes: {
        'data-unhandled': tokenType,
        tag: 'div'
      }
    };
  }
}
