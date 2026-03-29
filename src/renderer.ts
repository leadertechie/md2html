import { ContentNode, StyleConfig } from './types.js';

export class HTMLRenderer {
  private config: Required<StyleConfig>;

  constructor(config: StyleConfig = {}) {
    this.config = {
      classPrefix: config.classPrefix || '',
      customCSS: config.customCSS || '',
      addHeadingIds: config.addHeadingIds ?? false
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

  private renderWithClass(tag: string, content: string, baseClass?: string, nodeClass?: string, extraAttrs?: string): string {
    const classAttr = this.hasClassConfig() && baseClass 
      ? ` class="${this.getClass(baseClass, nodeClass)}"` 
      : '';
    return `<${tag}${classAttr}${extraAttrs || ''}>${content}</${tag}>`;
  }

  renderNode(node: ContentNode): string {
    switch (node.type) {
      case 'heading':
        const level = node.attributes?.level || '2';
        const headingId = this.config.addHeadingIds 
          ? ` id="${this.generateHeadingId(node.content)}"` 
          : '';
        if (!this.hasClassConfig()) {
          return `<h${level}${headingId}>${node.content || ''}</h${level}>`;
        }
        return `<h${level}${headingId} class="${this.getClass('heading')}">${node.content || ''}</h${level}>`;
        
      case 'paragraph':
        if (node.children) {
          const childrenHtml = node.children.map(child => this.renderNode(child)).join('');
          return this.renderWithClass('p', childrenHtml, 'paragraph');
        }
        return this.renderWithClass('p', node.content || '', 'paragraph');
        
      case 'list':
        const tag = node.ordered ? 'ol' : 'ul';
        const items = node.children?.map(child => this.renderNode(child)).join('') || '';
        return this.renderWithClass(tag, items, 'list');
        
      case 'list-item':
        return this.renderWithClass('li', node.content || '', 'list-item');
        
      case 'image':
        const src = node.src || node.attributes?.src || '';
        const alt = node.alt || node.attributes?.alt || '';
        const classStr = this.getClass('image', node.className || undefined);
        return `<img src="${src}" alt="${alt}"${classStr ? ` class="${classStr}"` : ''}>`;
        
      case 'code':
        const codeClass = this.hasClassConfig() 
          ? ` class="${this.getClass('code')} language-${node.attributes?.lang || ''}"` 
          : ` class="language-${node.attributes?.lang || ''}"`;
        return `<pre><code${codeClass}>${node.content || ''}</code></pre>`;
      
      case 'container':
        if (node.attributes?.tag === 'hr') return '<hr>';
        if (node.attributes?.tag === 'blockquote') {
          const children = node.children?.map(child => this.renderNode(child)).join('') || '';
          return this.renderWithClass('blockquote', children, 'blockquote');
        }
        const containerChildren = node.children?.map(child => this.renderNode(child)).join('') || '';
        return this.renderWithClass('div', containerChildren, 'container', node.className || undefined);
      
      case 'strong':
        return `<strong>${node.content || ''}</strong>`;
      
      case 'emphasis':
        return `<em>${node.content || ''}</em>`;
      
      case 'text':
      default:
        return node.content || '';
    }
  }

  renderNodes(nodes: ContentNode[]): string {
    if (!nodes || nodes.length === 0) {
      return '';
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
