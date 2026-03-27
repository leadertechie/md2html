import { ContentNode } from './types';

export class HTMLRenderer {
  renderNode(node: ContentNode): string {
    switch (node.type) {
      case 'heading':
        const level = node.attributes?.level || '2';
        return `<h${level}>${node.content || ''}</h${level}>`;
        
      case 'paragraph':
        if (node.children) {
          return `<p>${node.children.map(child => this.renderNode(child)).join('')}</p>`;
        }
        return `<p>${node.content || ''}</p>`;
        
      case 'list':
        const tag = node.ordered ? 'ol' : 'ul';
        const items = node.children?.map(child => this.renderNode(child)).join('') || '';
        return `<${tag}>${items}</${tag}>`;
        
      case 'list-item':
        return `<li>${node.content || ''}</li>`;
        
      case 'image':
        const src = node.src || node.attributes?.src || '';
        const alt = node.alt || node.attributes?.alt || '';
        return `<img src="${src}" alt="${alt}" class="${node.className || ''}">`;
        
      case 'code':
        return `<pre><code class="language-${node.attributes?.lang || ''}">${node.content || ''}</code></pre>`;
      
      case 'container':
        if (node.attributes?.tag === 'hr') return '<hr>';
        if (node.attributes?.tag === 'blockquote') {
          const children = node.children?.map(child => this.renderNode(child)).join('') || '';
          return `<blockquote>${children}</blockquote>`;
        }
        const containerChildren = node.children?.map(child => this.renderNode(child)).join('') || '';
        return `<div class="${node.className || ''}">${containerChildren}</div>`;
      
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
}
