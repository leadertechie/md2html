import { describe, it, expect } from 'vitest';
import { CodeHandler } from '../../src/handlers/code-handler';
import { ParseContext } from '../../src/handlers';

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

describe('CodeHandler', () => {
  it('should handle code blocks with language', () => {
    const handler = new CodeHandler();
    const ctx = createMockContext();
    const result = handler.handle({
      type: 'code',
      text: 'console.log("hello")',
      lang: 'javascript'
    }, ctx);
    expect(result?.type).toBe('code');
    expect(result?.content).toBe('console.log("hello")');
    expect(result?.attributes?.lang).toBe('javascript');
  });

  it('should handle code blocks without language', () => {
    const handler = new CodeHandler();
    const ctx = createMockContext();
    const result = handler.handle({
      type: 'code',
      text: 'plain text',
      lang: ''
    }, ctx);
    expect(result?.attributes?.lang).toBe('');
  });
});
