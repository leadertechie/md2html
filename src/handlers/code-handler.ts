import { TokenHandler, ParseContext } from './types.js';

/**
 * Handles 'code' tokens (fenced code blocks).
 */
export class CodeHandler implements TokenHandler {
  readonly type = 'code';

  handle(token: Record<string, unknown>, _ctx: ParseContext) {
    return {
      type: 'code' as const,
      content: token.text as string,
      attributes: { lang: token.lang as string || '' }
    };
  }
}
