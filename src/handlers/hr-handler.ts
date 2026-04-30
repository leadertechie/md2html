import { TokenHandler, ParseContext } from './types.js';

/**
 * Handles 'hr' tokens (horizontal rules).
 */
export class HrHandler implements TokenHandler {
  readonly type = 'hr';

  handle(_token: Record<string, unknown>, _ctx: ParseContext) {
    return { type: 'container' as const, attributes: { tag: 'hr' } };
  }
}
