import { describe, it, expect } from 'vitest';
import { LinkHandler } from '../../src/handlers/link-handler';
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
    metadata: {},
    ...overrides
  };

}

describe('LinkHandler', () => {
  it('should handle basic link', () => {
    const handler = new LinkHandler();
    const ctx = createMockContext();
    const result = handler.handle({
      type: 'link',
      text: 'Click here',
      href: 'https://example.com',
      tokens: []
    }, ctx);
    expect(result?.type).toBe('link');
    expect(result?.content).toBe('Click here');
    expect(result?.attributes?.href).toBe('https://example.com');
  });

  it('should handle link with title', () => {
    const handler = new LinkHandler();
    const ctx = createMockContext();
    const result = handler.handle({
      type: 'link',
      text: 'Example',
      href: 'https://example.com',
      title: 'Example Site',
      tokens: []
    }, ctx);
    expect(result?.type).toBe('link');
    expect(result?.content).toBe('Example');
    expect(result?.attributes?.href).toBe('https://example.com');
    expect(result?.attributes?.title).toBe('Example Site');
  });

  it('should handle link without title', () => {
    const handler = new LinkHandler();
    const ctx = createMockContext();
    const result = handler.handle({
      type: 'link',
      text: 'Example',
      href: '/relative/path',
      tokens: []
    }, ctx);
    expect(result?.type).toBe('link');
    expect(result?.attributes?.href).toBe('/relative/path');
    expect(result?.attributes?.title).toBeUndefined();
  });

  it('should process inline formatting in link text', () => {
    const handler = new LinkHandler();
    const ctx = createMockContext({
      processInlineFormatting: (s) => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    });
    const result = handler.handle({
      type: 'link',
      text: '**bold** link',
      href: 'https://example.com',
      tokens: []
    }, ctx);
    expect(result?.type).toBe('link');
    expect(result?.content).toBe('<strong>bold</strong> link');
  });

  it('should process slots in link text', () => {
    const handler = new LinkHandler();
    const ctx = createMockContext({
      processSlots: (s) => s.replace(/\[\[(.*?)\]\]/g, 'resolved-$1')
    });
    const result = handler.handle({
      type: 'link',
      text: 'Go to [[page]]',
      href: '/page',
      tokens: []
    }, ctx);
    expect(result?.content).toBe('Go to resolved-page');
  });
});
