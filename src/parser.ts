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
   * Allowed HTML attributes per tag for preserveRawHTML mode.
   * Key "*" applies to all tags. Key "tag" applies to specific tags.
   * Supports "data-*" wildcard prefix matching.
   */
  allowedAttributes?: Record<string, string[]>;
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
    this.allowedAttributes = options?.allowedAttributes ?? {};
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
    if (!this.allowedHTMLTags.has('script')) {
      html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
      html = html.replace(/<\/?script[^>]*>/gi, '');
    }
    if (!this.allowedHTMLTags.has('style')) {
      html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
      html = html.replace(/<\/?style[^>]*>/gi, '');
    }

    // Filter attributes on all remaining HTML tags
    const hasAttrRules = Object.keys(this.allowedAttributes).length > 0;
    if (hasAttrRules) {
      html = html.replace(/<[^>]+>/g, (match) => this.filterTagAttributes(match));
    }

    return html;
  }


  /**
   * Build the ParseContext that is passed to every token handler.
   * This is the bridge between the parser's private services and the handlers.
   */
  private createContext(): ParseContext {
    const self = this;
    const metadata: Record<string, unknown> = {};
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
      },
      metadata
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
        console.warn(msg);
      }
      return [];
    }

    const nodes: ContentNode[] = [];
    // Use shared context at root level (depth 0), create fresh for recursive calls
    const ctx = sharedCtx || this.createContext();

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

  /**
   * Pre-process markdown: convert `:::tag#id.class` container syntax
   * into HTML comment markers that marked will preserve as html tokens,
   * but won't affect markdown parsing of the inner content.
   *
   * Example:
   *   :::section#header
   *   # Heading inside container
   *   Some text
   *   :::
   *
   * Becomes:
   *   <!-- md-container:section#header -->
   *   # Heading inside container
   *   Some text
   *   <!-- /md-container -->
   */
  private preprocessContainerBlocks(markdown: string): string {
    // Match opening fence: :::tagname#id.class (at start of line)
    // Valid patterns: :::div, :::section#header, :::div.container, :::section#header.main
    return markdown.replace(/^:::(?:(\w+(?:[.#][\w-]+)*)\s*)?$/gm, (match, specifier) => {
      if (!specifier) {
        // Closing fence :::
        return '<!-- /md-container -->';
      }
      // Normalize: if no tag name given, default to "div"
      const normalized = specifier.match(/^\w/) ? specifier : `div${specifier}`;
      return `<!-- md-container:${normalized} -->`;
    });
  }

  /**
   * Post-process marked tokens to collapse container block markers
   * into structured containerBlock tokens with proper nesting.
   *
   * This handles nesting depth up to maxRecursionDepth.
   */
  private postprocessTokens(tokens: unknown[]): unknown[] {
    const result: unknown[] = [];
    const stack: { specifier: string; tokens: unknown[] }[] = [];
    let current = result;

    for (const token of tokens) {
      const t = token as Record<string, unknown>;

      // Detect container opening comment
      if (t.type === 'html') {
        const raw = (t.raw as string).trim();
        const openMatch = raw.match(/^<!--\s*md-container:\s*(\S+)\s*-->$/);
        const closeMatch = raw.match(/^<!--\s*\/md-container\s*-->$/);


        if (openMatch) {
          // Start a new container
          const newContainer: { specifier: string; tokens: unknown[] } = {
            specifier: openMatch[1],
            tokens: []
          };
          stack.push(newContainer);
          continue;
        }

        if (closeMatch) {
          if (stack.length === 0) {
            // Unmatched closing fence — ignore
            continue;
          }
          const container = stack.pop()!;
          // Recursively process inner tokens for any nested containers
          const processedInner = this.postprocessTokens(container.tokens);
          const containerToken = {
            type: 'containerBlock',
            specifier: container.specifier,
            tokens: processedInner
          };

          if (stack.length > 0) {
            stack[stack.length - 1].tokens.push(containerToken);
          } else {
            result.push(containerToken);
          }
          continue;
        }
      }

      // Not a container marker — add to current context
      if (stack.length > 0) {
        stack[stack.length - 1].tokens.push(token);
      } else {
        result.push(token);
      }
    }

    return result;
  }

  parse(markdown: string, options?: ParseOptions): MarkdownContent {
    const parseOptions = {
      gfm: options?.gfm ?? true,
      breaks: options?.breaks ?? false,
      pedantic: options?.pedantic ?? false
    };

    try {
      // Step 1: Pre-process ::: container syntax into HTML comment markers
      const processed = this.preprocessContainerBlocks(markdown);

      // Step 2: Lex with marked (content between markers is parsed as normal markdown)
      const rawTokens = marked.lexer(processed, parseOptions as Parameters<typeof marked.lexer>[1]);

      // Step 3: Post-process to collapse comment markers into containerBlock tokens
      const tokens = this.postprocessTokens(rawTokens);

      // Create a shared context at root level so frontmatter metadata accumulates
      const ctx = this.createContext();
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
