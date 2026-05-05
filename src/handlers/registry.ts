import type { TokenHandler } from './types.js';
import { HeadingHandler } from './heading-handler.js';
import { ParagraphHandler } from './paragraph-handler.js';
import { ListHandler } from './list-handler.js';
import { ImageHandler } from './image-handler.js';
import { CodeHandler } from './code-handler.js';
import { HrHandler } from './hr-handler.js';
import { BlockquoteHandler } from './blockquote-handler.js';
import { HtmlHandler } from './html-handler.js';
import { CatchAllHandler } from './catchall-handler.js';
import { FrontmatterHandler } from './frontmatter-handler.js';

/**
 * Registry of token handlers. Handlers can be added/overridden externally
 * to extend the parser without modifying its internals.
 *
 * The registry uses a two-tier lookup:
 * 1. First, check for a dedicated handler by token type name
 * 2. If none found, fall back to the catch-all handler (registered as '*')
 *
 * The catch-all handler ensures no content is silently lost — unhandled
 * token types are wrapped in a container node with `data-unhandled` attribute.
 */
export class TokenHandlerRegistry {
  private handlers = new Map<string, TokenHandler>();
  private catchAll: TokenHandler;

  constructor() {
    // Register all built-in handlers
    this.register(new HeadingHandler());
    this.register(new ParagraphHandler());
    this.register(new ListHandler());
    this.register(new ImageHandler());
    this.register(new CodeHandler());
    this.register(new HrHandler());
    this.register(new BlockquoteHandler());
    this.register(new HtmlHandler());
    this.register(new FrontmatterHandler());

    // Catch-all handler for any unregistered token types
    this.catchAll = new CatchAllHandler();
  }

  /** Register a handler. Overrides any existing handler for the same token type. */
  register(handler: TokenHandler): void {
    this.handlers.set(handler.type, handler);
  }

  /** Unregister a handler by token type. */
  unregister(type: string): void {
    this.handlers.delete(type);
  }

  /**
   * Get a handler for the given token type.
   * Falls back to the catch-all handler if no dedicated handler is registered.
   */
  get(type: string): TokenHandler {
    return this.handlers.get(type) ?? this.catchAll;
  }

  /** Check if a dedicated handler exists for the given token type (excludes catch-all). */
  has(type: string): boolean {
    return this.handlers.has(type);
  }

  /** Get all registered dedicated handler types. */
  get types(): string[] {
    return Array.from(this.handlers.keys());
  }

  /** Replace the catch-all handler with a custom implementation. */
  setCatchAll(handler: TokenHandler): void {
    this.catchAll = handler;
  }

  /** Get the current catch-all handler. */
  getCatchAll(): TokenHandler {
    return this.catchAll;
  }
}
