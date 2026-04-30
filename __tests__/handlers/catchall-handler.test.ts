import { describe, it, expect, vi } from 'vitest';
import { CatchAllHandler } from '../../src/handlers/catchall-handler';
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

describe('CatchAllHandler', () => {
  it('should report unhandled token types via context', () => {
    const handler = new CatchAllHandler();
    const reportSpy = vi.fn();
    const ctx = createMockContext({ reportUnhandled: reportSpy });

    handler.handle({ type: 'table', raw: '<table>data</table>' }, ctx);
    expect(reportSpy).toHaveBeenCalledWith('table', expect.objectContaining({ type: 'table' }));
  });

  it('should produce a container node with data-unhandled attribute', () => {
    const handler = new CatchAllHandler();
    const ctx = createMockContext();

    const result = handler.handle({ type: 'table', raw: '<table>data</table>' }, ctx);
    expect(result?.type).toBe('container');
    expect(result?.attributes?.['data-unhandled']).toBe('table');
    expect(result?.content).toContain('<table>');
  });

  it('should use text content when raw is not available', () => {
    const handler = new CatchAllHandler();
    const ctx = createMockContext();

    const result = handler.handle({ type: 'unknown_type', text: 'some text' }, ctx);
    expect(result?.content).toBe('some text');
  });

  it('should produce fallback text when neither raw nor text is available', () => {
    const handler = new CatchAllHandler();
    const ctx = createMockContext();

    const result = handler.handle({ type: 'mystery' }, ctx);
    expect(result?.content).toContain('[unhandled: mystery]');
  });
});
