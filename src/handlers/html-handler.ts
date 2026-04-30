import { TokenHandler, ParseContext } from './types.js';

/**
 * Handles 'html' tokens (inline or block-level raw HTML).
 * In preserveRawHTML mode, passes through allowed HTML tags.
 * Otherwise, stores the raw content as a container node.
 */
export class HtmlHandler implements TokenHandler {
  readonly type = 'html';

  handle(token: Record<string, unknown>, ctx: ParseContext) {
    if (ctx.preserveRawHTML) {
      const raw = token.raw as string;
      const processed = ctx.processRawHTML(raw);
      if (processed.trim()) {
        return { type: 'container' as const, rawHTML: processed };
      }
      return null;
    }
    return { type: 'container' as const, content: token.raw as string };
  }
}
