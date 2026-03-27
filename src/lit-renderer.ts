import { TemplateResult, html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { ContentNode } from './types';

export class LitRenderer {
  private renderTextNode(node: ContentNode): TemplateResult {
    if (node.type === 'image') {
      return html`<img src="${node.src}" alt="${node.alt || ''}" class="inline-image" style="max-width:100%;height:auto;">`;
    }
    return html`${unsafeHTML(node.content || '')}`;
  }

  renderNode(node: ContentNode): TemplateResult {
    switch (node.type) {
      case 'heading': {
        const level = node.attributes?.level || '2';
        if (level === '1') return html`<h1>${unsafeHTML(node.content)}</h1>`;
        if (level === '2') return html`<h2>${unsafeHTML(node.content)}</h2>`;
        if (level === '3') return html`<h3>${unsafeHTML(node.content)}</h3>`;
        return html`<h2>${unsafeHTML(node.content)}</h2>`;
      }
        
      case 'paragraph':
        if (node.children) {
          return html`<p>${node.children.map(child => this.renderTextNode(child))}</p>`;
        }
        return html`<p>${unsafeHTML(node.content)}</p>`;
        
      case 'list':
        return html`<ul>${node.children?.map(child => this.renderNode(child))}</ul>`;
        
      case 'list-item':
        return html`<li>${unsafeHTML(node.content)}</li>`;
        
      case 'image':
        return html`<img src="${node.src || node.attributes?.src}" alt="${node.alt || node.attributes?.alt || ''}" class="${node.className || ''}" style="max-width:100%;height:auto;">`;
        
      case 'container':
        return html`<div class="${node.className || ''}" style="${node.attributes?.style || ''}">
          ${node.children?.map(child => this.renderNode(child))}
        </div>`;
      
      case 'code':
        return html`<pre><code class="language-${node.attributes?.lang || ''}">${node.content || ''}</code></pre>`;
      
      case 'text':
        return html`${node.content}`;
      
      default:
        return html``;
    }
  }

  renderNodes(nodes: ContentNode[]): TemplateResult {
    if (!nodes || nodes.length === 0) {
      return html``;
    }
    return html`${nodes.map(node => this.renderNode(node))}`;
  }

  renderToHTMLString(nodes: ContentNode[]): string {
    if (!nodes || nodes.length === 0) {
      return '';
    }
    return nodes.map(node => this.nodeToHTMLString(node)).join('\n');
  }

  private nodeToHTMLString(node: ContentNode): string {
    switch (node.type) {
      case 'heading':
        const level = node.attributes?.level || '2';
        return `<h${level}>${node.content}</h${level}>`;
      case 'paragraph':
        return `<p>${node.content}</p>`;
      case 'list':
        const items = node.children?.map(child => this.nodeToHTMLString(child)).join('') || '';
        return `<ul>${items}</ul>`;
      case 'list-item':
        return `<li>${node.content}</li>`;
      case 'image':
        return `<img src="${node.attributes?.src}" alt="${node.attributes?.alt}" class="${node.className || ''}">`;
      case 'container':
        const childrenHTML = node.children?.map(child => this.nodeToHTMLString(child)).join('') || '';
        return `<div class="${node.className || ''}">${childrenHTML}</div>`;
      case 'text':
        return node.content || '';
      default:
        return '';
    }
  }
}
