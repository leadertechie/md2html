import { describe, it, expect } from 'vitest';
import { ListHandler } from '../../src/handlers/list-handler';
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

describe('ListHandler', () => {
  it('should handle unordered lists', () => {
    const handler = new ListHandler();
    const ctx = createMockContext();
    const result = handler.handle({
      type: 'list',
      ordered: false,
      items: [
        { type: 'list_item', text: 'Item 1' },
        { type: 'list_item', text: 'Item 2' }
      ]
    }, ctx);
    expect(result?.type).toBe('list');
    expect(result?.ordered).toBe(false);
    expect(result?.children?.length).toBe(2);
    expect(result?.children?.[0].content).toBe('Item 1');
  });

  it('should handle ordered lists', () => {
    const handler = new ListHandler();
    const ctx = createMockContext();
    const result = handler.handle({
      type: 'list',
      ordered: true,
      items: [
        { type: 'list_item', text: 'First' }
      ]
    }, ctx);
    expect(result?.ordered).toBe(true);
  });

  it('should resolve slots in list items', () => {
    const handler = new ListHandler();
    const ctx = createMockContext({
      processSlots: (s) => s.replace('[[ID]]', '[resolved:ID]')
    });
    const result = handler.handle({
      type: 'list',
      ordered: false,
      items: [
        { type: 'list_item', text: 'Item [[ID]]' }
      ]
    }, ctx);
    expect(result?.children?.[0].content).toContain('[resolved:ID]');
  });
});
