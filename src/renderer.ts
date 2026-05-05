import { ContentNode, StyleConfigV2, nodeTypeToScope } from './types.js';
import { RendererStrategyRegistry, RenderContext } from './renderer-strategies.js';

export { RendererStrategyRegistry } from './renderer-strategies.js';
export type { NodeRendererStrategy, RenderContext } from './renderer-strategies.js';

export class HTMLRenderer {
  private config: Required<StyleConfigV2>;
  private strategyRegistry: RendererStrategyRegistry;

  constructor(config: StyleConfigV2 = {}) {
    this.config = {
      classPrefix: config.classPrefix || '',
      customCSS: config.customCSS || '',
      addHeadingIds: config.addHeadingIds ?? false,
      emitScopeAnchors: config.emitScopeAnchors ?? false
    };
    this.strategyRegistry = new RendererStrategyRegistry();
  }

  /** Access the strategy registry for customization. */
  get strategies(): RendererStrategyRegistry {
    return this.strategyRegistry;
  }

  private hasClassConfig(): boolean {
    return this.config.classPrefix !== '' || this.config.addHeadingIds;
  }

  private getClass(baseClass: string, nodeClass?: string): string {
    if (!this.hasClassConfig()) {
      return nodeClass || '';
    }
    const prefix = this.config.classPrefix;
    const classes = [prefix ? `${prefix}${baseClass}` : baseClass];
    if (nodeClass) classes.push(nodeClass);
    return classes.join(' ');
  }

  private generateHeadingId(content?: string): string {
    if (!content) return '';
    return content
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /**
   * Get the scope attribute string for a node type.
   * Returns empty string if emitScopeAnchors is disabled.
   */
  private getScopeAttr(node: ContentNode): string {
    if (!this.config.emitScopeAnchors) return '';
    const scopeValue = node.scope || nodeTypeToScope[node.type] || 'container';
    return ` data-md-scope="${scopeValue}"`;
  }

  /**
   * Get the CSS class for a container's tag-based rendering.
   * Returns just the tag name since renderWithClass applies the prefix.
   */
  private getContainerClass(tag: string): string {
    if (!this.hasClassConfig()) return '';
    return tag;
  }

  private buildRenderContext(): RenderContext {
    const self = this;
    return {
      get classPrefix() { return self.config.classPrefix; },
      get addHeadingIds() { return self.config.addHeadingIds; },
      get emitScopeAnchors() { return self.config.emitScopeAnchors; },
      get customCSS() { return self.config.customCSS; },
      hasClassConfig: () => self.hasClassConfig(),
      getClass: (baseClass: string, nodeClass?: string) => self.getClass(baseClass, nodeClass),
      getScopeAttr: (node: ContentNode) => self.getScopeAttr(node),
      generateHeadingId: (content?: string) => self.generateHeadingId(content),
      getContainerClass: (tag: string) => self.getContainerClass(tag)
    };
  }

  renderNode(node: ContentNode): string {
    const ctx = this.buildRenderContext();
    const strategy = this.strategyRegistry.get(node.type);
    return strategy.render(node, (child) => this.renderNode(child), ctx);
  }

  renderNodes(nodes: ContentNode[]): string {
    if (!nodes || nodes.length === 0) {
      return '';
    }
    // Wrap in scope root if emitScopeAnchors is enabled
    if (this.config.emitScopeAnchors) {
      const inner = nodes.map(node => this.renderNode(node)).join('\n');
      return `<div data-md-scope="root">\n${inner}\n</div>`;
    }
    return nodes.map(node => this.renderNode(node)).join('\n');
  }

  renderToHTMLString(nodes: ContentNode[]): string {
    return this.renderNodes(nodes);
  }

  render(markdown: string): string {
    return markdown;
  }

  getCustomCSS(): string {
    return this.config.customCSS;
  }
}
