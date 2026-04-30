import { ContentNode, StyleConfig, StyleConfigV2, nodeTypeToScope } from './types.js';

export class HTMLRenderer {
  private config: Required<StyleConfigV2>;

  constructor(config: StyleConfigV2 = {}) {
    this.config = {
      classPrefix: config.classPrefix || '',
      customCSS: config.customCSS || '',
      addHeadingIds: config.addHeadingIds ?? false,
      emitScopeAnchors: config.emitScopeAnchors ?? false
    };
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

  private renderWithClass(tag: string, content: string, baseClass?: string, nodeClass?: string, extraAttrs?: string): string {
    const classAttr = this.hasClassConfig() && baseClass 
      ? ` class="${this.getClass(baseClass, nodeClass)}"` 
      : '';
    return `<${tag}${classAttr}${extraAttrs || ''}>${content}</${tag}>`;
  }

  renderNode(node: ContentNode): string {
    const scopeAttr = this.getScopeAttr(node);

    switch (node.type) {
      case 'heading':
        const level = node.attributes?.level || '2';
        const headingId = this.config.addHeadingIds 
          ? ` id="${this.generateHeadingId(node.content)}"` 
          : '';
        let headingClass = '';
        if (this.hasClassConfig()) {
          const prefix = this.config.classPrefix;
          const levelClass = level === '1' ? 'h1' : level === '2' ? 'h2' : level === '3' ? 'h3' : level === '4' ? 'h4' : level === '5' ? 'h5' : 'h6';
          headingClass = prefix ? `${prefix}${levelClass}` : levelClass;
        }
        if (!headingClass) {
          return `<h${level}${headingId}${scopeAttr}>${node.content || ''}</h${level}>`;
        }
        return `<h${level}${headingId}${scopeAttr} class="${headingClass}">${node.content || ''}</h${level}>`;
        
      case 'paragraph':
        if (node.children) {
          const childrenHtml = node.children.map(child => this.renderNode(child)).join('');
          return this.renderWithClass('p', childrenHtml, 'paragraph', undefined, scopeAttr);
        }
        return this.renderWithClass('p', node.content || '', 'paragraph', undefined, scopeAttr);
        
      case 'list':
        const tag = node.ordered ? 'ol' : 'ul';
        const items = node.children?.map(child => this.renderNode(child)).join('') || '';
        return this.renderWithClass(tag, items, 'list', undefined, scopeAttr);
        
      case 'list-item':
        return this.renderWithClass('li', node.content || '', 'list-item', undefined, scopeAttr);
        
      case 'image':
        const src = node.src || node.attributes?.src || '';
        const alt = node.alt || node.attributes?.alt || '';
        const classStr = this.getClass('image', node.className || undefined);
        return `<img src="${src}" alt="${alt}"${classStr ? ` class="${classStr}"` : ''}${scopeAttr}>`;
        
      case 'code':
        const codeClass = this.hasClassConfig() 
          ? ` class="${this.getClass('code')} language-${node.attributes?.lang || ''}"` 
          : ` class="language-${node.attributes?.lang || ''}"`;
        return `<pre${scopeAttr}><code${codeClass}>${node.content || ''}</code></pre>`;
      
      case 'container':
        if (node.attributes?.tag === 'hr') return '<hr>';
        if (node.attributes?.tag === 'blockquote') {
          const children = node.children?.map(child => this.renderNode(child)).join('') || '';
          return this.renderWithClass('blockquote', children, 'blockquote', undefined, scopeAttr);
        }
        // If node has rawHTML, emit it directly
        if (node.rawHTML) {
          return node.rawHTML;
        }
        const containerChildren = node.children?.map(child => this.renderNode(child)).join('') || '';
        return this.renderWithClass('div', containerChildren, 'container', node.className || undefined, scopeAttr);
      
      case 'strong':
        return `<strong${scopeAttr}>${node.content || ''}</strong>`;
      
      case 'emphasis':
        return `<em${scopeAttr}>${node.content || ''}</em>`;
      
      case 'link':
        const href = node.attributes?.href || '';
        return `<a href="${href}"${scopeAttr}>${node.content || ''}</a>`;
      
      case 'text':
      default:
        return node.content || '';
    }
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
