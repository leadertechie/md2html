import { ContentNode } from '../types.js';
import { TokenHandler, ParseContext } from './types.js';

/**
 * Handles 'paragraph' tokens, including inline images and raw HTML.
 */
export class ParagraphHandler implements TokenHandler {
  readonly type = 'paragraph';

  handle(token: Record<string, unknown>, ctx: ParseContext) {
    const tokens = (token.tokens as Array<Record<string, unknown>>) || [];
    const hasInlineImage = tokens.some(t => t.type === 'image');
    const hasInlineHTML = tokens.some(t => t.type === 'html');

    if (hasInlineImage || (ctx.preserveRawHTML && hasInlineHTML)) {
      const children = tokens.map(t => {
        if (t.type === 'image') {
          return {
            type: 'image' as const,
            src: ctx.processImagePath(t.href as string),
            alt: t.text as string || ''
          };
        }
        if (t.type === 'html' && ctx.preserveRawHTML) {
          const processed = ctx.processRawHTML(t.raw as string);
          if (processed.trim()) {
            return { type: 'text' as const, content: processed };
          }
          return null;
        }
        return {
          type: 'text' as const,
          content: ctx.processSlots(ctx.processInlineFormatting(t.text as string || ''))
        };
      }).filter(Boolean) as ContentNode[];

      if (children.length === 0) return null;

      return { type: 'paragraph' as const, children };
    }

    return {
      type: 'paragraph' as const,
      content: ctx.processSlots(ctx.processInlineFormatting(token.text as string))
    };
  }
}
