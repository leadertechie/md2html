import { describe, it, expect } from 'vitest';
import { ParagraphHandler } from '../../src/handlers/paragraph-handler';
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

describe('ParagraphHandler', () => {
  it('should handle plain text paragraphs', () => {
    const handler = new ParagraphHandler();
    const ctx = createMockContext();
    const result = handler.handle({
      type: 'paragraph',
      text: 'Hello world',
      tokens: [{ type: 'text', text: 'Hello world' }]
    }, ctx);
    expect(result?.type).toBe('paragraph');
    expect(result?.content).toBe('Hello world');
  });

  it('should handle paragraphs with inline images', () => {
    const handler = new ParagraphHandler();
    const ctx = createMockContext({
      processImagePath: (s) => `/images/${s}`
    });
    const result = handler.handle({
      type: 'paragraph',
      text: 'Hello ![alt](img.png) world',
      tokens: [
        { type: 'text', text: 'Hello ' },
        { type: 'image', href: 'img.png', text: 'alt' },
        { type: 'text', text: ' world' }
      ]
    }, ctx);
    expect(result?.type).toBe('paragraph');
    expect(result?.children).toBeDefined();
    expect(result?.children?.length).toBe(3);
    expect(result?.children?.[1].type).toBe('image');
    expect(result?.children?.[1].src).toBe('/images/img.png');
  });

  it('should handle paragraphs with inline HTML when preserveRawHTML is true', () => {
    const handler = new ParagraphHandler();
    const ctx = createMockContext({
      preserveRawHTML: true,
      processRawHTML: (s) => s
    });
    const result = handler.handle({
      type: 'paragraph',
      text: 'Hello <div>World</div>',
      tokens: [
        { type: 'text', text: 'Hello ' },
        { type: 'html', raw: '<div>', text: '<div>' },
        { type: 'text', text: 'World' },
        { type: 'html', raw: '</div>', text: '</div>' }
      ]
    }, ctx);
    expect(result?.type).toBe('paragraph');
    expect(result?.children).toBeDefined();
    expect(result?.children?.length).toBe(4);
  });

  it('should not expand inline HTML when preserveRawHTML is false', () => {
    const handler = new ParagraphHandler();
    const ctx = createMockContext({ preserveRawHTML: false });
    const result = handler.handle({
      type: 'paragraph',
      text: 'Hello <div>World</div>',
      tokens: [
        { type: 'text', text: 'Hello ' },
        { type: 'html', raw: '<div>' },
        { type: 'text', text: 'World' },
        { type: 'html', raw: '</div>' }
      ]
    }, ctx);
    expect(result?.type).toBe('paragraph');
    expect(result?.children).toBeUndefined();
    expect(result?.content).toBeDefined();
  });
});
