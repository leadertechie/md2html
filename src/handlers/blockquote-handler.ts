import { TokenHandler, ParseContext } from './types.js';

/**
 * Handles 'blockquote' tokens.
 */
export class BlockquoteHandler implements TokenHandler {
  readonly type = 'blockquote';

  handle(token: Record<string, unknown>, ctx: ParseContext) {
    return {
      type: 'container' as const,
      attributes: { tag: 'blockquote' },
      children: ctx.parseTokens((token.tokens as unknown[]) || [], ctx.maxRecursionDepth + 1)
    };
  }
}
