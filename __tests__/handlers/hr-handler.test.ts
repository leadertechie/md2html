import { describe, it, expect } from 'vitest';
import { HrHandler } from '../../src/handlers/hr-handler';
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

describe('HrHandler', () => {
  it('should handle horizontal rules', () => {
    const handler = new HrHandler();
    const ctx = createMockContext();
    const result = handler.handle({ type: 'hr' }, ctx);
    expect(result?.type).toBe('container');
    expect(result?.attributes?.tag).toBe('hr');
  });
});
