import { TokenHandler, ParseContext } from './types.js';

/**
 * Handles standalone 'link' tokens (e.g., reference-style links, or links
 * that appear outside paragraphs in certain edge cases).
 */
export class LinkHandler implements TokenHandler {
  readonly type = 'link';

  handle(token: Record<string, unknown>, ctx: ParseContext) {
    const text = token.text as string || '';
    const href = token.href as string || '';
    const title = token.title as string || '';

    return {
      type: 'link' as const,
      content: ctx.processSlots(ctx.processInlineFormatting(text)),
      attributes: {
        href,
        ...(title ? { title } : {})
      }
    };
  }
}
