import { describe, it, expect } from 'vitest';
import { ImageHandler } from '../../src/handlers/image-handler';
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

describe('ImageHandler', () => {
  it('should handle standalone images', () => {
    const handler = new ImageHandler();
    const ctx = createMockContext();
    const result = handler.handle({
      type: 'image',
      href: '/path/to/img.png',
      title: 'Alt text'
    }, ctx);
    expect(result?.type).toBe('image');
    expect(result?.src).toBe('/path/to/img.png');
    expect(result?.alt).toBe('Alt text');
  });

  it('should process image paths via context', () => {
    const handler = new ImageHandler();
    const ctx = createMockContext({
      processImagePath: (s) => `/prefix${s}`
    });
    const result = handler.handle({
      type: 'image',
      href: 'img.png',
      title: 'Alt'
    }, ctx);
    expect(result?.src).toBe('/prefiximg.png');
  });
});
