import { TokenHandler, ParseContext } from './types.js';

/**
 * FrontmatterHandler — consumes YAML-ish frontmatter tokens produced by marked.lexer().
 * Parses the raw YAML and stores key-value pairs onto ctx.metadata.
 * Returns null so no HTML is emitted for frontmatter blocks.
 *
 * Handles both formats:
 *   key: value
 *   key:
 *     - item1
 *     - item2
 */
export class FrontmatterHandler implements TokenHandler {
  readonly type = 'frontmatter';

  handle(token: Record<string, unknown>, ctx: ParseContext) {
    const raw = (token.raw as string) || '';

    // Normalize line endings
    const lines = raw.split('\n');
    const parsed: Record<string, unknown> = {};

    let currentKey: string | null = null;
    let currentArray: string[] = [];

    for (const line of lines) {
      // Detect dashed list item (indented with `- `)
      const listMatch = line.match(/^\s+-\s+(.+)$/);
      if (listMatch && currentKey) {
        currentArray.push(listMatch[1].trim());
        continue;
      }

      // If we were building an array, flush it
      if (currentKey && currentArray.length > 0) {
        parsed[currentKey] = [...currentArray];
        currentArray = [];
        currentKey = null;
      }

      // Detect key: value or key:
      const keyMatch = line.match(/^(\w[\w_-]*)\s*:\s*(.*)$/);
      if (keyMatch) {
        currentKey = keyMatch[1];
        const val = keyMatch[2].trim();

        if (val === '') {
          // List follows — continue
          continue;
        } else if (val.startsWith('[') && val.endsWith(']')) {
          // Inline array: [a, b, c]
          parsed[currentKey] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
          currentKey = null;
        } else {
          parsed[currentKey] = val.replace(/^["']|["']$/g, '');
          currentKey = null;
        }
      }
    }

    // Flush any remaining array
    if (currentKey && currentArray.length > 0) {
      parsed[currentKey] = [...currentArray];
    }

    // Merge parsed metadata into the shared context metadata
    if (ctx.metadata) {
      Object.assign(ctx.metadata, parsed);
    }

    // Return null — frontmatter produces no HTML
    return null;
  }
}
