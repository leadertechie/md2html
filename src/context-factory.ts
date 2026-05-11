/**
 * ParseContext Factory
 *
 * Single responsibility: Creates ParseContext instances that bridge
 * the parser's private services to token handlers.
 *
 * Separates context construction logic from the parser itself,
 * making it easier to test and extend.
 */

import type { ParseContext } from './handlers/types.js';
import { ContentNode } from './types.js';

/**
 * Services needed by the ParseContext factory.
 * This is the interface the parser exposes to context creation.
 */
export interface ParserServices {
  preserveRawHTML: boolean;
  errorRecovery: 'throw' | 'warn' | 'silent';
  maxRecursionDepth: number;
  processImagePath(src: string): string;
  processInlineFormatting(text: string): string;
  processSlots(text: string): string;
  processRawHTML(html: string): string;
  parseTokens(tokens: unknown[], depth: number): ContentNode[];
  onUnhandledToken?: (type: string, token: Record<string, unknown>) => void;
}

/**
 * Create a ParseContext from parser services.
 *
 * Each call creates a fresh context with its own metadata store,
 * allowing for clean separation between recursive parse calls.
 *
 * The getters use closures to lazily access the parser's current state,
 * so the context always reflects the latest configuration.
 */
export function createParseContext(services: ParserServices): ParseContext {
  const metadata: Record<string, unknown> = {};
  return {
    get preserveRawHTML() { return services.preserveRawHTML; },
    get errorRecovery() { return services.errorRecovery; },
    get maxRecursionDepth() { return services.maxRecursionDepth; },
    processImagePath: (src: string) => services.processImagePath(src),
    processInlineFormatting: (text: string) => services.processInlineFormatting(text),
    processSlots: (text: string) => services.processSlots(text),
    processRawHTML: (html: string) => services.processRawHTML(html),
    parseTokens: (tokens: unknown[], depth: number) => services.parseTokens(tokens, depth),
    reportUnhandled: (type: string, token: Record<string, unknown>) => {
      services.onUnhandledToken?.(type, token);
    },
    metadata
  };
}
