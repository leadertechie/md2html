import { ContentNode } from './types.js';

/**
 * ContentNode factory — a builder API for creating ContentNode instances
 * consistently across the codebase. Eliminates scattered object literals
 * and provides type-safe construction with sensible defaults.
 *
 * Usage:
 *   NodeFactory.heading('Hello', { level: '1' })
 *   NodeFactory.paragraph('Some text')
 *   NodeFactory.container({ tag: 'section', id: 'main' }, [children...])
 */
export class NodeFactory {
  static heading(content: string, attributes?: Record<string, unknown>): ContentNode {
    return {
      type: 'heading',
      content,
      attributes: { level: attributes?.level || '2', ...attributes }
    };
  }

  static paragraph(
    contentOrChildren: string | ContentNode[],
    children?: ContentNode[]
  ): ContentNode {
    if (typeof contentOrChildren === 'string') {
      return { type: 'paragraph', content: contentOrChildren };
    }
    return { type: 'paragraph', children: contentOrChildren ?? children };
  }

  static list(
    items: ContentNode[],
    ordered?: boolean,
    attributes?: Record<string, unknown>
  ): ContentNode {
    return {
      type: 'list',
      ordered: ordered ?? false,
      children: items,
      ...(attributes ? { attributes } : {})
    };
  }

  static listItem(content: string): ContentNode {
    return { type: 'list-item', content };
  }

  static image(src: string, alt?: string, className?: string): ContentNode {
    return { type: 'image', src, alt: alt || '', ...(className ? { className } : {}) };
  }

  static code(content: string, lang?: string): ContentNode {
    return {
      type: 'code',
      content,
      attributes: { lang: lang || '' }
    };
  }

  static container(
    children?: ContentNode[],
    config?: {
      tag?: string;
      id?: string;
      className?: string;
      rawHTML?: string;
      scope?: string;
    }
  ): ContentNode {
    const node: ContentNode = { type: 'container' };
    if (children && children.length > 0) node.children = children;
    if (config?.rawHTML) node.rawHTML = config.rawHTML;
    if (config?.scope) node.scope = config.scope;

    const attrs: Record<string, unknown> = {};
    if (config?.tag) attrs.tag = config.tag;
    if (config?.id) attrs.id = config.id;
    if (Object.keys(attrs).length > 0) node.attributes = attrs;
    if (config?.className) node.className = config.className;

    return node;
  }

  static text(content: string): ContentNode {
    return { type: 'text', content };
  }

  static strong(content: string): ContentNode {
    return { type: 'strong', content };
  }

  static emphasis(content: string): ContentNode {
    return { type: 'emphasis', content };
  }

  static link(href: string, content: string): ContentNode {
    return { type: 'link', content, attributes: { href } };
  }
}
