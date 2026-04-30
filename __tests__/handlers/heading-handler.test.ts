import { describe, it, expect } from 'vitest';
import { HeadingHandler } from '../../src/handlers/heading-handler';
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

describe('HeadingHandler', () => {
  it('should handle h1', () => {
    const handler = new HeadingHandler();
    const ctx = createMockContext();
    const result = handler.handle({ type: 'heading', depth: 1, text: 'Title' }, ctx);
    expect(result?.type).toBe('heading');
    expect(result?.content).toBe('Title');
    expect(result?.attributes?.level).toBe('1');
  });

  it('should handle h2', () => {
    const handler = new HeadingHandler();
    const ctx = createMockContext();
    const result = handler.handle({ type: 'heading', depth: 2, text: 'Subtitle' }, ctx);
    expect(result?.attributes?.level).toBe('2');
  });

  it('should resolve slots in heading text', () => {
    const handler = new HeadingHandler();
    const ctx = createMockContext({
      processSlots: (s) => s.replace('[[NAME]]', '[resolved:NAME]')
    });
    const result = handler.handle({ type: 'heading', depth: 1, text: 'Hello [[NAME]]' }, ctx);
    expect(result?.content).toContain('[resolved:NAME]');
  });
});
