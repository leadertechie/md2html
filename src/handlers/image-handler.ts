import { TokenHandler, ParseContext } from './types.js';

/**
 * Handles standalone 'image' tokens.
 */
export class ImageHandler implements TokenHandler {
  readonly type = 'image';

  handle(token: Record<string, unknown>, ctx: ParseContext) {
    return {
      type: 'image' as const,
      src: ctx.processImagePath(token.href as string),
      alt: token.title as string || ''
    };
  }
}
