/**
 * Lit Renderer
 *
 * Renders ContentNode trees to Lit TemplateResult objects using the
 * LitNodeRendererStrategy pattern. This mirrors HTMLRenderer but
 * outputs Lit-compatible template results for use in Lit elements.
 *
 * Uses the same Strategy + Registry pattern as renderer-strategies.ts,
 * eliminating the previous switch-based duplication.
 *
 * To extend with custom node types, register your strategy with:
 *   litRenderer.strategies.register(new MyLitStrategy());
 */

import { TemplateResult, html } from 'lit-html';
import { ContentNode } from './types.js';
import { LitStrategyRegistry } from './lit-strategies.js';
import { HTMLRenderer } from './renderer.js';

export { LitStrategyRegistry } from './lit-strategies.js';
export type { LitNodeRendererStrategy } from './lit-strategies.js';

export class LitRenderer {
  private strategyRegistry: LitStrategyRegistry;
  /** Lazily created HTMLRenderer for string output, sharing the same config */
  private htmlRenderer?: HTMLRenderer;

  constructor() {
    this.strategyRegistry = new LitStrategyRegistry();
  }

  /** Access the strategy registry for customization. */
  get strategies(): LitStrategyRegistry {
    return this.strategyRegistry;
  }

  /**
   * Render a single node to a Lit TemplateResult.
   */
  renderNode(node: ContentNode): TemplateResult {
    const strategy = this.strategyRegistry.get(node.type);
    return strategy.render(node, (child) => this.renderNode(child));
  }

  /**
   * Render an array of nodes to a single Lit TemplateResult.
   */
  renderNodes(nodes: ContentNode[]): TemplateResult {
    if (!nodes || nodes.length === 0) {
      return html``;
    }
    return html`${nodes.map(node => this.renderNode(node))}`;
  }

  /**
   * Render nodes to a plain HTML string.
   * Delegates to HTMLRenderer to avoid duplicating string rendering logic.
   *
   * Note: Uses default HTMLRenderer config (no classPrefix, scope anchors,
   * or heading IDs). For full HTML rendering with those features,
   * use HTMLRenderer directly.
   */
  renderToHTMLString(nodes: ContentNode[]): string {
    if (!nodes || nodes.length === 0) {
      return '';
    }
    if (!this.htmlRenderer) {
      this.htmlRenderer = new HTMLRenderer();
    }
    return this.htmlRenderer.renderNodes(nodes);
  }
}

