import { TokenHandler, ParseContext } from './types.js';

/**
 * Handles 'heading' tokens (h1-h6).
 */
export class HeadingHandler implements TokenHandler {
  readonly type = 'heading';

  handle(token: Record<string, unknown>, ctx: ParseContext) {
    return {
      type: 'heading' as const,
      content: ctx.processSlots(token.text as string),
      attributes: { level: String(token.depth) }
    };
  }
}
