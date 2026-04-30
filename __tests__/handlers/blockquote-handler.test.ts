import { describe, it, expect, vi } from 'vitest';
import { BlockquoteHandler } from '../../src/handlers/blockquote-handler';
import { ParseContext } from '../../src/handlers';
import { ContentNode } from '../../src/types';

function createMockContext(overrides?: Partial<ParseContext>): ParseContext {
  return {
    processImagePath: (s) => s,
    processInlineFormatting: (s) => s,
    processSlots: (s) => s,
    processRawHTML: (s) => s,
    parseTokens: () => [],
    preserveRawHTML: false,
    errorRecovery: 'throw',
    maxRecursionDepth: 100,
    reportUnhandled: () => {},
    ...overrides
  };
}

describe('BlockquoteHandler', () => {
  it('should handle blockquotes with nested tokens', () => {
    const handler = new BlockquoteHandler();
    const nestedNode: ContentNode = { type: 'paragraph', content: 'nested' };
    const parseTokens = vi.fn(() => [nestedNode]);
    const ctx = createMockContext({ parseTokens });
    const result = handler.handle({
      type: 'blockquote',
      tokens: [{ type: 'paragraph', text: 'nested' }]
    }, ctx);
    expect(result?.type).toBe('container');
    expect(result?.attributes?.tag).toBe('blockquote');
    expect(parseTokens).toHaveBeenCalled();
    expect(result?.children?.[0].content).toBe('nested');
  });
});
