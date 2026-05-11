/**
 * Lit Renderer Strategies
 *
 * Each ContentNode type gets its own Lit strategy for rendering to a
 * TemplateResult. This mirrors the NodeRendererStrategy pattern from
 * renderer-strategies.ts, but outputs Lit TemplateResult objects instead
 * of plain HTML strings.
 *
 * New node types can be supported by:
 * 1. Creating a class implementing LitNodeRendererStrategy
 * 2. Registering it with the LitStrategyRegistry
 */

import { TemplateResult, html } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { ContentNode } from './types.js';

// ─── Strategy Interface ───────────────────────────────────────────────────────

export interface LitNodeRendererStrategy {
  /** The ContentNode type this strategy handles */
  readonly type: string;
  /** Render a node to a Lit TemplateResult */
  render(node: ContentNode, renderChild: (child: ContentNode) => TemplateResult): TemplateResult;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

/**
 * Registry of Lit renderer strategies.
 *
 * Two-tier lookup:
 * 1. Dedicated strategy by node type
 * 2. Fallback to a catch-all strategy (default: renders empty)
 */
export class LitStrategyRegistry {
  private strategies = new Map<string, LitNodeRendererStrategy>();
  private fallback: LitNodeRendererStrategy;

  constructor() {
    // Register all built-in strategies
    this.register(new LitHeadingStrategy());
    this.register(new LitParagraphStrategy());
    this.register(new LitListStrategy());
    this.register(new LitListItemStrategy());
    this.register(new LitImageStrategy());
    this.register(new LitCodeStrategy());
    this.register(new LitContainerStrategy());
    this.register(new LitStrongStrategy());
    this.register(new LitEmphasisStrategy());
    this.register(new LitLinkStrategy());
    this.register(new LitTextStrategy());

    this.fallback = new LitFallbackStrategy();
  }

  register(strategy: LitNodeRendererStrategy): void {
    this.strategies.set(strategy.type, strategy);
  }

  unregister(type: string): void {
    this.strategies.delete(type);
  }

  get(type: string): LitNodeRendererStrategy {
    return this.strategies.get(type) ?? this.fallback;
  }

  has(type: string): boolean {
    return this.strategies.has(type);
  }

  get types(): string[] {
    return Array.from(this.strategies.keys());
  }

  setFallback(strategy: LitNodeRendererStrategy): void {
    this.fallback = strategy;
  }
}

// ─── Heading Strategy ─────────────────────────────────────────────────────────

export class LitHeadingStrategy implements LitNodeRendererStrategy {
  readonly type = 'heading';

  render(node: ContentNode, _renderChild: (child: ContentNode) => TemplateResult): TemplateResult {
    const level = (node.attributes?.level as string) || '2';
    switch (level) {
      case '1': return html`<h1>${unsafeHTML(node.content || '')}</h1>`;
      case '2': return html`<h2>${unsafeHTML(node.content || '')}</h2>`;
      case '3': return html`<h3>${unsafeHTML(node.content || '')}</h3>`;
      default:  return html`<h2>${unsafeHTML(node.content || '')}</h2>`;
    }
  }
}

// ─── Paragraph Strategy ───────────────────────────────────────────────────────

export class LitParagraphStrategy implements LitNodeRendererStrategy {
  readonly type = 'paragraph';

  render(node: ContentNode, renderChild: (child: ContentNode) => TemplateResult): TemplateResult {
    if (node.children) {
      return html`<p>${node.children.map(child => renderChild(child))}</p>`;
    }
    return html`<p>${unsafeHTML(node.content || '')}</p>`;
  }
}

// ─── List Strategy ────────────────────────────────────────────────────────────

export class LitListStrategy implements LitNodeRendererStrategy {
  readonly type = 'list';

  render(node: ContentNode, renderChild: (child: ContentNode) => TemplateResult): TemplateResult {
    return html`<ul>${node.children?.map(child => renderChild(child))}</ul>`;
  }
}

// ─── List Item Strategy ───────────────────────────────────────────────────────

export class LitListItemStrategy implements LitNodeRendererStrategy {
  readonly type = 'list-item';

  render(node: ContentNode, _renderChild: (child: ContentNode) => TemplateResult): TemplateResult {
    return html`<li>${unsafeHTML(node.content || '')}</li>`;
  }
}

// ─── Image Strategy ───────────────────────────────────────────────────────────

export class LitImageStrategy implements LitNodeRendererStrategy {
  readonly type = 'image';

  render(node: ContentNode, _renderChild: (child: ContentNode) => TemplateResult): TemplateResult {
    const src = node.src || (node.attributes?.src as string) || '';
    const alt = node.alt || (node.attributes?.alt as string) || '';
    const className = node.className || 'inline-image';
    return html`<img src="${src}" alt="${alt}" class="${className}" style="max-width:100%;height:auto;">`;
  }
}

// ─── Code Strategy ────────────────────────────────────────────────────────────

export class LitCodeStrategy implements LitNodeRendererStrategy {
  readonly type = 'code';

  render(node: ContentNode, _renderChild: (child: ContentNode) => TemplateResult): TemplateResult {
    const lang = (node.attributes?.lang as string) || '';
    return html`<pre><code class="language-${lang}">${node.content || ''}</code></pre>`;
  }
}

// ─── Container Strategy ───────────────────────────────────────────────────────

export class LitContainerStrategy implements LitNodeRendererStrategy {
  readonly type = 'container';

  render(node: ContentNode, renderChild: (child: ContentNode) => TemplateResult): TemplateResult {
    const className = node.className || '';
    const style = (node.attributes?.style as string) || '';
    return html`<div class="${className}" style="${style}">
      ${node.children?.map(child => renderChild(child))}
    </div>`;
  }
}

// ─── Strong Strategy ──────────────────────────────────────────────────────────

export class LitStrongStrategy implements LitNodeRendererStrategy {
  readonly type = 'strong';

  render(node: ContentNode, _renderChild: (child: ContentNode) => TemplateResult): TemplateResult {
    return html`<strong>${unsafeHTML(node.content || '')}</strong>`;
  }
}

// ─── Emphasis Strategy ────────────────────────────────────────────────────────

export class LitEmphasisStrategy implements LitNodeRendererStrategy {
  readonly type = 'emphasis';

  render(node: ContentNode, _renderChild: (child: ContentNode) => TemplateResult): TemplateResult {
    return html`<em>${unsafeHTML(node.content || '')}</em>`;
  }
}

// ─── Link Strategy ────────────────────────────────────────────────────────────

export class LitLinkStrategy implements LitNodeRendererStrategy {
  readonly type = 'link';

  render(node: ContentNode, _renderChild: (child: ContentNode) => TemplateResult): TemplateResult {
    const href = node.attributes?.href || '';
    return html`<a href="${href}">${unsafeHTML(node.content || '')}</a>`;
  }
}

// ─── Text Strategy ────────────────────────────────────────────────────────────

export class LitTextStrategy implements LitNodeRendererStrategy {
  readonly type = 'text';

  render(node: ContentNode, _renderChild: (child: ContentNode) => TemplateResult): TemplateResult {
    return html`${node.content || ''}`;
  }
}

// ─── Fallback Strategy ────────────────────────────────────────────────────────

export class LitFallbackStrategy implements LitNodeRendererStrategy {
  readonly type = '*';

  render(_node: ContentNode, _renderChild: (child: ContentNode) => TemplateResult): TemplateResult {
    return html``;
  }
}
