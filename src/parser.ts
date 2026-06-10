import { marked } from 'marked';
import type { LoggerInterface } from "@leadertechie/telemetry";
import { ContentNode, MarkdownContent, ParseOptions, defaultAllowedHTMLTags } from './types.js';
import { TokenHandlerRegistry, ParseContext } from './handlers/index.js';
import { getDefaultLogger } from './telemetry-init.js';
import { createParseContext, ParserServices } from './context-factory.js';
import { CompositePreprocessor, createDefaultPreprocessor } from './preprocessor.js';
import { CompositeTokenPostprocessor, createDefaultPostprocessor } from './token-postprocessor.js';
import sanitizeHtml from 'sanitize-html';

export interface ParserOptions {
  /** Optional telemetry logger */
  logger?: import("@leadertechie/telemetry").LoggerInterface;
  imagePathPrefix?: string;
  imageBaseUrl?: string;
  preserveRawHTML?: boolean;
  slotPattern?: RegExp;
  onSlot?: (name: string) => string;
  errorRecovery?: 'throw' | 'warn' | 'silent';
  maxRecursionDepth?: number;
  allowedHTMLTags?: string[];
  /**
   * Allowed HTML attributes per tag for preserveRawHTML mode.
   * Key "*" applies to all tags. Key "tag" applies to specific tags.
   * Supports "data-*" wildcard prefix matching.
   */
  allowedAttributes?: Record<string, string[]>;
  allowedScriptTypes?: string[];
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
  private allowedAttributes: Record<string, string[]>;
  private allowedScriptTypes: Set<string>;
  private handlerRegistry: TokenHandlerRegistry;
  private onUnhandledToken?: (type: string, token: Record<string, unknown>) => void;
  private log: LoggerInterface;
  private preprocessor: CompositePreprocessor;
  private postprocessor: CompositeTokenPostprocessor;

  constructor(options?: ParserOptions) {
    this.imagePathPrefix = options?.imagePathPrefix || '';
    this.imageBaseUrl = options?.imageBaseUrl || '';
    this.preserveRawHTML = options?.preserveRawHTML ?? false;
    this.slotPattern = options?.slotPattern ?? DEFAULT_SLOT_PATTERN;
    this.onSlot = options?.onSlot;
    this.log = options?.logger ?? getDefaultLogger('md2html');
    this.errorRecovery = options?.errorRecovery ?? 'throw';
    this.maxRecursionDepth = options?.maxRecursionDepth ?? 100;
    this.allowedHTMLTags = new Set([
      ...defaultAllowedHTMLTags,
      ...(options?.allowedHTMLTags ?? [])
    ]);
    this.allowedAttributes = options?.allowedAttributes ?? {};
    this.allowedScriptTypes = new Set(options?.allowedScriptTypes ?? []);
    this.handlerRegistry = new TokenHandlerRegistry();
    this.onUnhandledToken = options?.onUnhandledToken;
    this.preprocessor = createDefaultPreprocessor();
    this.postprocessor = createDefaultPostprocessor();
  }


  /** Access the handler registry for customization. */
  get handlers(): TokenHandlerRegistry {
    return this.handlerRegistry;
  }

  /** Access the preprocessor chain for customization. */
  get preprocessors(): CompositePreprocessor {
    return this.preprocessor;
  }

  /** Access the token postprocessor chain for customization. */
  get postprocessors(): CompositeTokenPostprocessor {
    return this.postprocessor;
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

  /**
   * Check if an attribute name is allowed for a given tag.
   * Supports "data-*" wildcard prefix matching.
   */
  private isAttributeAllowed(tagName: string, attrName: string): boolean {
    const globalAllowed = this.allowedAttributes['*'];
    if (globalAllowed && this.matchesAttributeList(attrName, globalAllowed)) {
      return true;
    }
    const tagAllowed = this.allowedAttributes[tagName];
    if (tagAllowed && this.matchesAttributeList(attrName, tagAllowed)) {
      return true;
    }
    return false;
  }

  /**
   * Check if an attribute name matches a list of allowed patterns.
   * Supports "data-*" wildcard prefix matching.
   */
  private matchesAttributeList(attrName: string, allowed: string[]): boolean {
    const lower = attrName.toLowerCase();
    for (const pattern of allowed) {
      if (pattern.endsWith('-*')) {
        const prefix = pattern.slice(0, -1).toLowerCase();
        if (lower.startsWith(prefix)) return true;
      } else if (pattern.toLowerCase() === lower) {
        return true;
      }
    }
    return false;
  }

  /**
   * Filter attributes on an HTML tag, keeping only allowed ones.
   */
  private filterTagAttributes(tag: string): string {
    // Match opening tag: <tagname ...attrs...>
    const tagMatch = tag.match(/^<\/?(\w+)/);
    if (!tagMatch) return tag;
    const tagName = tagMatch[1].toLowerCase();

    // If no attribute rules defined, return as-is
    const hasRules = Object.keys(this.allowedAttributes).length > 0;
    if (!hasRules) return tag;

    // Extract all attributes from the tag
    const attrRegex = /(\S+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
    const selfClosing = tag.endsWith('/>');

    // Get the tag opening part (e.g., <div or </div)
    const tagOpen = tagMatch[0];
    const remaining = tag.slice(tagOpen.length);

    // Rebuild the tag with only allowed attributes
    let filtered = tagOpen;
    let match: RegExpExecArray | null;
    while ((match = attrRegex.exec(remaining)) !== null) {
      const attrName = match[1];
      const attrValue = match[2] ?? match[3] ?? match[4] ?? '';
      if (this.isAttributeAllowed(tagName, attrName)) {
        filtered += ` ${attrName}="${attrValue.replace(/"/g, '"')}"`;
      }
    }

    // Close the tag
    if (selfClosing) {
      filtered += ' /';
    }
    filtered += '>';

    return filtered;
  }

  private processRawHTML(html: string): string {
    // Preserve scripts with allowed types before sanitization.
    const preservedScripts: Array<{ placeholder: string; original: string }> = [];
    if (this.allowedScriptTypes.size > 0) {
      const allowedTypes = Array.from(this.allowedScriptTypes).join('|');
      const scriptRegex = new RegExp(
        `<script\\s+type="(${allowedTypes})"\\s*[^>]*>[\\s\\S]*?</script>`,
        'gi'
      );
      html = html.replace(scriptRegex, (match: string) => {
        const placeholder = `__SCRIPT_${preservedScripts.length}__`;
        preservedScripts.push({ placeholder, original: match });
        return placeholder;
      });
    }

    // Tags that are inherently unsafe in raw HTML passthrough.
    const dangerousTags = new Set(["script", "style", "iframe", "object", "embed", "form", "input", "button"]);
    const allowedTags = Array.from(this.allowedHTMLTags)
      .filter(t => !dangerousTags.has(t.toLowerCase()));

    if (allowedTags.length === 0) {
      return html.replace(/<[^>]*>/g, '');
    }

    // Build allowedAttributes map for sanitize-html.
    const globalAttrs = this.allowedAttributes['*'] || [];
    const allowedAttrs: Record<string, string[]> = {};
    // Pass global wildcard directly to sanitize-html (it supports '*' natively)
    if (globalAttrs.length > 0) {
      allowedAttrs['*'] = globalAttrs;
    }
    for (const [tag, attrs] of Object.entries(this.allowedAttributes)) {
      if (tag === '*') continue;
      const lowerTag = tag.toLowerCase();
      if (dangerousTags.has(lowerTag)) continue;
      allowedAttrs[lowerTag] = [...globalAttrs, ...attrs];
    }

    // sanitize-html is pure JS, works in Node.js, CF Workers, and browsers —
    // no jsdom or nodejs_compat needed.

    // Restore preserved scripts after sanitization
    let result = sanitizeHtml(html, {

      allowedTags,
      allowedAttributes: allowedAttrs,
      allowedSchemes: ['http', 'https', 'mailto'],
      allowProtocolRelative: false,
      // system-critical attributes always pass through
      exclusiveFilter: undefined,
    }) as string;

    // Restore preserved scripts
    for (const { placeholder, original } of preservedScripts) {
      result = result.replace(placeholder, original);
    }

    return result;
  }


  /**
   * Build a ParserServices object that bridges the parser's private methods
   * to the ParseContext factory. This keeps context creation decoupled.
   */
  private buildServices(): ParserServices {
    return {
      preserveRawHTML: this.preserveRawHTML,
      errorRecovery: this.errorRecovery,
      maxRecursionDepth: this.maxRecursionDepth,
      processImagePath: (src: string) => this.processImagePath(src),
      processInlineFormatting: (text: string) => this.processInlineFormatting(text),
      processSlots: (text: string) => this.processSlots(text),
      processRawHTML: (html: string) => this.processRawHTML(html),
      parseTokens: (tokens: unknown[], depth: number) => this.parseTokens(tokens, depth),
      onUnhandledToken: this.onUnhandledToken
    };
  }

  /**
   * Process an array of marked tokens into ContentNodes.
   * When depth === 0 (root), creates a shared context that accumulates metadata.
   * For recursive calls (depth > 0), creates a fresh context for each level.
   */
  private parseTokens(tokens: unknown[], depth: number = 0, sharedCtx?: ParseContext): ContentNode[] {
    if (depth > this.maxRecursionDepth) {
      const msg = `[md2html] Max recursion depth (${this.maxRecursionDepth}) exceeded, truncating`;
      if (this.errorRecovery === 'warn') {
        this.log.warn(msg);
      }
      return [];
    }

    const nodes: ContentNode[] = [];
    // Use shared context at root level (depth 0), create fresh for recursive calls
    const ctx = sharedCtx || createParseContext(this.buildServices());

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
      // Step 1: Pre-process markdown (container blocks, etc.)
      const processed = this.preprocessor.process(markdown);

      // Step 2: Lex with marked
      const rawTokens = marked.lexer(processed, parseOptions as Parameters<typeof marked.lexer>[1]);

      // Step 3: Post-process tokens (collapse container markers, etc.)
      const tokens = this.postprocessor.process(rawTokens);

      // Step 4: Create a shared context so frontmatter metadata accumulates
      const ctx = createParseContext(this.buildServices());
      const content = this.parseTokens(tokens, 0, ctx);

      return {
        title: '',
        metadata: { ...ctx.metadata },
        content
      };
    } catch (err) {
      if (this.errorRecovery === 'throw') throw err;

      const msg = `[md2html] Parse error: ${err instanceof Error ? err.message : String(err)}`;
      if (this.errorRecovery === 'warn') {
        this.log.warn(msg);
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
