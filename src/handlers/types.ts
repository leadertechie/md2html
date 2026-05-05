import { ContentNode } from '../types.js';

/**
 * A token handler knows how to convert a single marked token into a ContentNode.
 * Handlers are registered by token type name in the handler registry.
 */
export interface TokenHandler {
  /** The marked token type this handler processes (e.g. 'heading', 'paragraph') */
  readonly type: string;
  /** Convert a marked token to a ContentNode (or null to skip) */
  handle(token: Record<string, unknown>, ctx: ParseContext): ContentNode | null;
}

/**
 * Context passed to every token handler, giving access to parser services.
 */
export interface ParseContext {
  processImagePath(src: string): string;
  processInlineFormatting(text: string): string;
  processSlots(text: string): string;
  processRawHTML(html: string): string;
  parseTokens(tokens: unknown[], depth: number): ContentNode[];
  preserveRawHTML: boolean;
  errorRecovery: 'throw' | 'warn' | 'silent';
  maxRecursionDepth: number;
  /** Report an unhandled token type so callers can be notified */
  reportUnhandled(type: string, token: Record<string, unknown>): void;
  /**
   * Shared metadata store populated by token handlers (e.g. FrontmatterHandler).
   * After parsing, this object contains all frontmatter key-value pairs.
   */
  metadata: Record<string, unknown>;
}
