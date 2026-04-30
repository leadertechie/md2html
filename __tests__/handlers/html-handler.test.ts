import { describe, it, expect } from 'vitest';
import { HtmlHandler } from '../../src/handlers/html-handler';
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

describe('HtmlHandler', () => {
  it('should pass through raw HTML when preserveRawHTML is true', () => {
    const handler = new HtmlHandler();
    const ctx = createMockContext({
      preserveRawHTML: true,
      processRawHTML: (s) => s
    });
    const result = handler.handle({
      type: 'html',
      raw: '<div class="test">content</div>'
    }, ctx);
    expect(result?.type).toBe('container');
    expect(result?.rawHTML).toBe('<div class="test">content</div>');
  });

  it('should return null when processed HTML is empty', () => {
    const handler = new HtmlHandler();
    const ctx = createMockContext({
      preserveRawHTML: true,
      processRawHTML: () => ''
    });
    const result = handler.handle({
      type: 'html',
      raw: '<script>alert("xss")</script>'
    }, ctx);
    expect(result).toBeNull();
  });

  it('should store raw content when preserveRawHTML is false', () => {
    const handler = new HtmlHandler();
    const ctx = createMockContext({ preserveRawHTML: false });
    const result = handler.handle({
      type: 'html',
      raw: '<div>content</div>'
    }, ctx);
    expect(result?.type).toBe('container');
    expect(result?.content).toBe('<div>content</div>');
    expect(result?.rawHTML).toBeUndefined();
  });
});
