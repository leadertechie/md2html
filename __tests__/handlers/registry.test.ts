import { describe, it, expect } from 'vitest';
import { TokenHandlerRegistry, TokenHandler } from '../../src/handlers';
import { CatchAllHandler } from '../../src/handlers/catchall-handler';

describe('TokenHandlerRegistry', () => {
  it('should have all built-in handlers registered', () => {
    const registry = new TokenHandlerRegistry();
    expect(registry.has('heading')).toBe(true);
    expect(registry.has('paragraph')).toBe(true);
    expect(registry.has('list')).toBe(true);
    expect(registry.has('image')).toBe(true);
    expect(registry.has('code')).toBe(true);
    expect(registry.has('hr')).toBe(true);
    expect(registry.has('blockquote')).toBe(true);
    expect(registry.has('html')).toBe(true);
  });

  it('should allow registering a custom handler', () => {
    const registry = new TokenHandlerRegistry();
    const customHandler: TokenHandler = {
      type: 'custom',
      handle: () => ({ type: 'text', content: 'custom' })
    };
    registry.register(customHandler);
    expect(registry.has('custom')).toBe(true);
    expect(registry.get('custom')).toBe(customHandler);
  });

  it('should allow overriding an existing handler', () => {
    const registry = new TokenHandlerRegistry();
    const overrideHandler: TokenHandler = {
      type: 'heading',
      handle: () => ({ type: 'text', content: 'overridden' })
    };
    registry.register(overrideHandler);
    expect(registry.get('heading')).toBe(overrideHandler);
  });

  it('should allow unregistering a handler', () => {
    const registry = new TokenHandlerRegistry();
    registry.unregister('heading');
    expect(registry.has('heading')).toBe(false);
  });

  it('should list all registered types', () => {
    const registry = new TokenHandlerRegistry();
    const types = registry.types;
    expect(types).toContain('heading');
    expect(types).toContain('paragraph');
    expect(types).toContain('list');
  });

  it('should fall back to catch-all handler for unregistered types', () => {
    const registry = new TokenHandlerRegistry();
    const handler = registry.get('table');
    expect(handler).toBeInstanceOf(CatchAllHandler);
  });

  it('should allow replacing the catch-all handler', () => {
    const registry = new TokenHandlerRegistry();
    const customCatchAll: TokenHandler = {
      type: '*',
      handle: () => ({ type: 'text', content: 'custom catch-all' })
    };
    registry.setCatchAll(customCatchAll);
    expect(registry.getCatchAll()).toBe(customCatchAll);
    const handler = registry.get('unknown_type');
    expect(handler).toBe(customCatchAll);
  });
});
