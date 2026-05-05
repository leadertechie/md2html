import { ContentNode } from './types.js';

/**
 * Strategy interface for rendering a specific ContentNode type to HTML.
 * This is the renderer-side equivalent of TokenHandler — each node type
 * gets its own strategy, eliminating the large switch statement.
 *
 * To add support for a new node type:
 * 1. Create a class implementing NodeRendererStrategy
 * 2. Register it with the RendererStrategyRegistry
 */
export interface NodeRendererStrategy {
  /** The node type this strategy handles */
  readonly type: string;
  /** Render a node of this type to an HTML string */
  render(node: ContentNode, renderChild: (child: ContentNode) => string, ctx: RenderContext): string;
}

/**
 * Context passed to every render strategy, providing access to
 * shared rendering services and configuration.
 */
export interface RenderContext {
  classPrefix: string;
  addHeadingIds: boolean;
  emitScopeAnchors: boolean;
  customCSS: string;
  getClass(baseClass: string, nodeClass?: string): string;
  getScopeAttr(node: ContentNode): string;
  generateHeadingId(content?: string): string;
  getContainerClass(tag: string): string;
  hasClassConfig(): boolean;
}

// ─── Heading Strategy ───────────────────────────────────────────────────

export class HeadingRendererStrategy implements NodeRendererStrategy {
  readonly type = 'heading';

  render(node: ContentNode, _renderChild: (child: ContentNode) => string, ctx: RenderContext): string {
    const level = (node.attributes?.level as string) || '2';
    const headingId = ctx.addHeadingIds 
      ? ` id="${ctx.generateHeadingId(node.content)}"` 
      : '';
    const scopeAttr = ctx.getScopeAttr(node);

    if (!ctx.hasClassConfig()) {
      return `<h${level}${headingId}${scopeAttr}>${node.content || ''}</h${level}>`;
    }

    const prefix = ctx.classPrefix;
    const levelClass = level === '1' ? 'h1' : level === '2' ? 'h2' : level === '3' ? 'h3' : level === '4' ? 'h4' : level === '5' ? 'h5' : 'h6';
    const headingClass = prefix ? `${prefix}${levelClass}` : levelClass;
    return `<h${level}${headingId}${scopeAttr} class="${headingClass}">${node.content || ''}</h${level}>`;
  }
}

// ─── Paragraph Strategy ─────────────────────────────────────────────────

export class ParagraphRendererStrategy implements NodeRendererStrategy {
  readonly type = 'paragraph';

  render(node: ContentNode, renderChild: (child: ContentNode) => string, ctx: RenderContext): string {
    const scopeAttr = ctx.getScopeAttr(node);
    if (node.children) {
      const childrenHtml = node.children.map(renderChild).join('');
      return ctx.hasClassConfig() && ctx.classPrefix
        ? `<p class="${ctx.classPrefix}paragraph"${scopeAttr}>${childrenHtml}</p>`
        : `<p${scopeAttr}>${childrenHtml}</p>`;
    }
    return ctx.hasClassConfig() && ctx.classPrefix
      ? `<p class="${ctx.classPrefix}paragraph"${scopeAttr}>${node.content || ''}</p>`
      : `<p${scopeAttr}>${node.content || ''}</p>`;
  }
}

// ─── List Strategy ──────────────────────────────────────────────────────

export class ListRendererStrategy implements NodeRendererStrategy {
  readonly type = 'list';

  render(node: ContentNode, renderChild: (child: ContentNode) => string, ctx: RenderContext): string {
    const tag = node.ordered ? 'ol' : 'ul';
    const items = node.children?.map(renderChild).join('') || '';
    const scopeAttr = ctx.getScopeAttr(node);
    return ctx.hasClassConfig() && ctx.classPrefix
      ? `<${tag} class="${ctx.classPrefix}list"${scopeAttr}>${items}</${tag}>`
      : `<${tag}${scopeAttr}>${items}</${tag}>`;
  }
}

// ─── List Item Strategy ─────────────────────────────────────────────────

export class ListItemRendererStrategy implements NodeRendererStrategy {
  readonly type = 'list-item';

  render(node: ContentNode, _renderChild: (child: ContentNode) => string, ctx: RenderContext): string {
    const scopeAttr = ctx.getScopeAttr(node);
    return ctx.hasClassConfig() && ctx.classPrefix
      ? `<li class="${ctx.classPrefix}list-item"${scopeAttr}>${node.content || ''}</li>`
      : `<li${scopeAttr}>${node.content || ''}</li>`;
  }
}

// ─── Image Strategy ─────────────────────────────────────────────────────

export class ImageRendererStrategy implements NodeRendererStrategy {
  readonly type = 'image';

  render(node: ContentNode, _renderChild: (child: ContentNode) => string, ctx: RenderContext): string {
    const src = node.src || (node.attributes?.src as string) || '';
    const alt = node.alt || (node.attributes?.alt as string) || '';
    const scopeAttr = ctx.getScopeAttr(node);
    let classStr = '';
    if (ctx.hasClassConfig()) {
      const prefix = ctx.classPrefix;
      classStr = prefix ? `${prefix}image` : 'image';
      if (node.className) classStr += ` ${node.className}`;
      return `<img src="${src}" alt="${alt}" class="${classStr}"${scopeAttr}>`;
    }
    if (node.className) {
      return `<img src="${src}" alt="${alt}" class="${node.className}"${scopeAttr}>`;
    }
    return `<img src="${src}" alt="${alt}"${scopeAttr}>`;
  }
}

// ─── Code Strategy ──────────────────────────────────────────────────────

export class CodeRendererStrategy implements NodeRendererStrategy {
  readonly type = 'code';

  render(node: ContentNode, _renderChild: (child: ContentNode) => string, ctx: RenderContext): string {
    const scopeAttr = ctx.getScopeAttr(node);
    const lang = (node.attributes?.lang as string) || '';
    if (ctx.hasClassConfig()) {
      const prefix = ctx.classPrefix;
      const codeClass = prefix ? `${prefix}code` : 'code';
      return `<pre${scopeAttr}><code class="${codeClass} language-${lang}">${node.content || ''}</code></pre>`;
    }
    return `<pre${scopeAttr}><code class="language-${lang}">${node.content || ''}</code></pre>`;
  }
}

// ─── Container Strategy ─────────────────────────────────────────────────

export class ContainerRendererStrategy implements NodeRendererStrategy {
  readonly type = 'container';

  render(node: ContentNode, renderChild: (child: ContentNode) => string, ctx: RenderContext): string {
    // If node has rawHTML, emit it directly (passthrough mode)
    if (node.rawHTML) {
      return node.rawHTML;
    }

    const tag = (node.attributes?.tag as string) || 'div';
    const children = node.children?.map(renderChild).join('') || '';
    const id = node.attributes?.id as string;
    const idAttr = id ? ` id="${id}"` : '';
    const scopeAttr = ctx.getScopeAttr(node);

    // Self-closing tags
    if (tag === 'hr') return '<hr>';

    if (ctx.hasClassConfig()) {
      const containerClass = ctx.getContainerClass(tag);
      const prefix = ctx.classPrefix;
      // If we have a classPrefix, use prefixed tag name as class
      if (prefix) {
        const classes = [prefix + (containerClass || 'container')];
        if (node.className) classes.push(node.className);
        return `<${tag} class="${classes.join(' ')}"${idAttr}${scopeAttr}>${children}</${tag}>`;
      }
      // No prefix, use the default container class
      const classes = [containerClass || 'container'];
      if (node.className) classes.push(node.className);
      return `<${tag} class="${classes.join(' ')}"${idAttr}${scopeAttr}>${children}</${tag}>`;
    }

    // No class config at all
    if (node.className) {
      return `<${tag} class="${node.className}"${idAttr}${scopeAttr}>${children}</${tag}>`;
    }
    return `<${tag}${idAttr}${scopeAttr}>${children}</${tag}>`;
  }
}

// ─── Strong Strategy ────────────────────────────────────────────────────

export class StrongRendererStrategy implements NodeRendererStrategy {
  readonly type = 'strong';

  render(node: ContentNode, _renderChild: (child: ContentNode) => string, ctx: RenderContext): string {
    return `<strong${ctx.getScopeAttr(node)}>${node.content || ''}</strong>`;
  }
}

// ─── Emphasis Strategy ──────────────────────────────────────────────────

export class EmphasisRendererStrategy implements NodeRendererStrategy {
  readonly type = 'emphasis';

  render(node: ContentNode, _renderChild: (child: ContentNode) => string, ctx: RenderContext): string {
    return `<em${ctx.getScopeAttr(node)}>${node.content || ''}</em>`;
  }
}

// ─── Link Strategy ──────────────────────────────────────────────────────

export class LinkRendererStrategy implements NodeRendererStrategy {
  readonly type = 'link';

  render(node: ContentNode, _renderChild: (child: ContentNode) => string, ctx: RenderContext): string {
    const href = node.attributes?.href || '';
    return `<a href="${href}"${ctx.getScopeAttr(node)}>${node.content || ''}</a>`;
  }
}

// ─── Text Strategy (fallback) ───────────────────────────────────────────

export class TextRendererStrategy implements NodeRendererStrategy {
  readonly type = 'text';

  render(node: ContentNode, _renderChild: (child: ContentNode) => string, _ctx: RenderContext): string {
    return node.content || '';
  }
}

// ─── Registry ───────────────────────────────────────────────────────────

/**
 * Registry of renderer strategies. Maps ContentNode types to their
 * rendering strategy. This is the renderer-side equivalent of
 * TokenHandlerRegistry.
 *
 * The registry uses a two-tier lookup:
 * 1. Check for a dedicated strategy by node type
 * 2. Fall back to the catch-all strategy (registered as '*')
 */
export class RendererStrategyRegistry {
  private strategies = new Map<string, NodeRendererStrategy>();
  private fallback: NodeRendererStrategy;

  constructor() {
    // Register all built-in strategies
    this.register(new HeadingRendererStrategy());
    this.register(new ParagraphRendererStrategy());
    this.register(new ListRendererStrategy());
    this.register(new ListItemRendererStrategy());
    this.register(new ImageRendererStrategy());
    this.register(new CodeRendererStrategy());
    this.register(new ContainerRendererStrategy());
    this.register(new StrongRendererStrategy());
    this.register(new EmphasisRendererStrategy());
    this.register(new LinkRendererStrategy());
    this.register(new TextRendererStrategy());

    // Fallback renders the content as plain text
    this.fallback = new TextRendererStrategy();
  }

  /** Register a strategy for a node type. Overrides any existing strategy. */
  register(strategy: NodeRendererStrategy): void {
    this.strategies.set(strategy.type, strategy);
  }

  /** Unregister a strategy by node type. */
  unregister(type: string): void {
    this.strategies.delete(type);
  }

  /** Get a strategy for the given node type, falling back to catch-all. */
  get(type: string): NodeRendererStrategy {
    return this.strategies.get(type) ?? this.fallback;
  }

  /** Check if a dedicated strategy exists for the given node type. */
  has(type: string): boolean {
    return this.strategies.has(type);
  }

  /** Get all registered dedicated strategy types. */
  get types(): string[] {
    return Array.from(this.strategies.keys());
  }

  /** Replace the fallback strategy. */
  setFallback(strategy: NodeRendererStrategy): void {
    this.fallback = strategy;
  }
}
