import { marked } from 'marked';
import { ContentNode, MarkdownContent, ParseOptions, defaultAllowedHTMLTags } from './types.js';
import { TokenHandlerRegistry, ParseContext } from './handlers/index.js';

export interface ParserOptions {
  imagePathPrefix?: string;
  imageBaseUrl?: string;
  preserveRawHTML?: boolean;
  slotPattern?: RegExp;
  onSlot?: (name: string) => string;
  errorRecovery?: 'throw' | 'warn' | 'silent';
  maxRecursionDepth?: number;
  allowedHTMLTags?: string[];
  /**
   * Callback invoked when a token type has no dedicated handler.
   * The catch-all handler will still produce a container node for the content,
   * but this callback allows callers to log, warn, or track unhandled types.
   *
   * @param type - The unhandled token type name (e.g. 'table', 'def')
   * @param token - The raw marked token
   */
  onUnhandledToken?: (type: string, token: Record<string, unknown>) => void;
}

const DEFAULT_SLOT_PATTERN = /\[\[(.*?)\]\]/g;

// Re-export handler types for convenience
export { TokenHandlerRegistry } from './handlers/index.js';
export type { TokenHandler, ParseContext } from './handlers/index.js';

// ─── MarkdownParser ───────────────────────────────────────────────────────────

export class MarkdownParser {
  private imagePathPrefix: string;
  private imageBaseUrl: string;
  private preserveRawHTML: boolean;
  private slotPattern: RegExp;
  private onSlot: ((name: string) => string) | undefined;
  private errorRecovery: 'throw' | 'warn' | 'silent';
  private maxRecursionDepth: number;
  private allowedHTMLTags: Set<string>;
  private handlerRegistry: TokenHandlerRegistry;
  private onUnhandledToken?: (type: string, token: Record<string, unknown>) => void;

  constructor(options?: ParserOptions) {
    this.imagePathPrefix = options?.imagePathPrefix || '';
    this.imageBaseUrl = options?.imageBaseUrl || '';
    this.preserveRawHTML = options?.preserveRawHTML ?? false;
    this.slotPattern = options?.slotPattern ?? DEFAULT_SLOT_PATTERN;
    this.onSlot = options?.onSlot;
    this.errorRecovery = options?.errorRecovery ?? 'throw';
    this.maxRecursionDepth = options?.maxRecursionDepth ?? 100;
    this.allowedHTMLTags = new Set([
      ...defaultAllowedHTMLTags,
      ...(options?.allowedHTMLTags ?? [])
    ]);
    this.handlerRegistry = new TokenHandlerRegistry();
    this.onUnhandledToken = options?.onUnhandledToken;
  }

  /** Access the handler registry for customization. */
  get handlers(): TokenHandlerRegistry {
    return this.handlerRegistry;
  }

  private processImagePath(src: string): string {
    if (src.startsWith('http') || src.startsWith('/')) {
      return src;
    }
    let path = this.imagePathPrefix ? `${this.imagePathPrefix}${src}` : src;
    if (this.imageBaseUrl && !path.startsWith('http')) {
      path = `${this.imageBaseUrl}${path}`;
    }
    return path;
  }

  private processInlineFormatting(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  }

  private processSlots(text: string): string {
    if (!this.onSlot) return text;
    return text.replace(this.slotPattern, (match, name: string) => {
      return this.onSlot!(name.trim());
    });
  }

  private processRawHTML(html: string): string {
    if (!this.allowedHTMLTags.has('script')) {
      html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
      html = html.replace(/<\/?script[^>]*>/gi, '');
    }
    if (!this.allowedHTMLTags.has('style')) {
      html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
      html = html.replace(/<\/?style[^>]*>/gi, '');
    }
    return html;
  }

  /**
   * Build the ParseContext that is passed to every token handler.
   * This is the bridge between the parser's private services and the handlers.
   */
  private createContext(): ParseContext {
    const self = this;
    return {
      get preserveRawHTML() { return self.preserveRawHTML; },
      get errorRecovery() { return self.errorRecovery; },
      get maxRecursionDepth() { return self.maxRecursionDepth; },
      processImagePath: (src: string) => self.processImagePath(src),
      processInlineFormatting: (text: string) => self.processInlineFormatting(text),
      processSlots: (text: string) => self.processSlots(text),
      processRawHTML: (html: string) => self.processRawHTML(html),
      parseTokens: (tokens: unknown[], depth: number) => self.parseTokens(tokens, depth),
      reportUnhandled: (type: string, token: Record<string, unknown>) => {
        self.onUnhandledToken?.(type, token);
      }
    };
  }

  private parseTokens(tokens: unknown[], depth: number = 0): ContentNode[] {
    if (depth > this.maxRecursionDepth) {
      const msg = `[md2html] Max recursion depth (${this.maxRecursionDepth}) exceeded, truncating`;
      if (this.errorRecovery === 'warn') {
        console.warn(msg);
      }
      return [];
    }

    const nodes: ContentNode[] = [];
    const ctx = this.createContext();

    for (const token of tokens) {
      const typedToken = token as Record<string, unknown>;
      // The registry automatically falls back to the catch-all handler
      const handler = this.handlerRegistry.get(typedToken.type as string);
      const node = handler.handle(typedToken, ctx);
      if (node) {
        nodes.push(node);
      }
    }

    return nodes;
  }

  parse(markdown: string, options?: ParseOptions): MarkdownContent {
    const parseOptions = {
      gfm: options?.gfm ?? true,
      breaks: options?.breaks ?? false,
      pedantic: options?.pedantic ?? false
    };

    try {
      const tokens = marked.lexer(markdown, parseOptions as Parameters<typeof marked.lexer>[1]);
      const content = this.parseTokens(tokens);

      return {
        title: '',
        content
      };
    } catch (err) {
      if (this.errorRecovery === 'throw') throw err;

      const msg = `[md2html] Parse error: ${err instanceof Error ? err.message : String(err)}`;
      if (this.errorRecovery === 'warn') {
        console.warn(msg);
      }

      return {
        title: '',
        content: [{ type: 'text', content: markdown }]
      };
    }
  }

  parseToNodes(markdown: string, options?: ParseOptions): ContentNode[] {
    return this.parse(markdown, options).content;
  }
}
