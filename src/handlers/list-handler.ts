import { TokenHandler, ParseContext } from './types.js';

/**
 * Handles 'list' tokens (ordered and unordered).
 */
export class ListHandler implements TokenHandler {
  readonly type = 'list';

  handle(token: Record<string, unknown>, ctx: ParseContext) {
    return {
      type: 'list' as const,
      ordered: token.ordered as boolean,
      children: (token.items as Array<Record<string, unknown>>).map((item) => ({
        type: 'list-item' as const,
        content: ctx.processSlots(ctx.processInlineFormatting(item.text as string))
      }))
    };
  }
}
