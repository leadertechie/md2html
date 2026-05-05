import { ContentNode } from '../types.js';
import { TokenHandler, ParseContext } from './types.js';

/**
 * ContainerBlockHandler — handles custom :::tag#id.class container blocks.
 *
 * These are produced by the MarkdownParser's preprocessor which converts
 * the ::: syntax into marked tokens before lexing, then reconstructs
 * containerBlock tokens after lexing.
 *
 * The handler parses the specifier (e.g. "section#header.content") into
 * tag name, id, and class(es), then recursively parses the inner tokens
 * as normal markdown content, producing a container node with the
 * specified HTML wrapper.
 */
export class ContainerBlockHandler implements TokenHandler {
  readonly type = 'containerBlock';

  handle(token: Record<string, unknown>, ctx: ParseContext): ContentNode | null {
    const specifier = token.specifier as string;
    const childTokens = token.tokens as unknown[];

    if (!specifier) return null;

    // Parse specifier: tag#id.class (any order, all optional except tag)
    const tagMatch = specifier.match(/^(\w+)/);
    const idMatch = specifier.match(/#([\w-]+)/);
    const classMatches = [...specifier.matchAll(/\.([\w-]+)/g)];

    const tag = tagMatch?.[1] || 'div';
    const id = idMatch?.[1] || '';
    const classes = classMatches.map(m => m[1]);

    // Recursively parse inner tokens as markdown
    const children = ctx.parseTokens(childTokens, 0);

    return {
      type: 'container' as const,
      children,
      attributes: {
        tag,
        id: id || undefined,
      },
      className: classes.length > 0 ? classes.join(' ') : undefined,
    };
  }
}
