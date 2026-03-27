import { marked } from 'marked';
import { ContentNode, MarkdownContent, ParseOptions } from './types';

export class MarkdownParser {
  private imagePathPrefix: string;
  private imageBaseUrl: string;

  constructor(options?: { imagePathPrefix?: string; imageBaseUrl?: string }) {
    this.imagePathPrefix = options?.imagePathPrefix || '';
    this.imageBaseUrl = options?.imageBaseUrl || '';
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

  private parseTokens(tokens: unknown[]): ContentNode[] {
    const nodes: ContentNode[] = [];
    
    for (const token of tokens) {
      const node = this.parseToken(token as Record<string, unknown>);
      if (node) {
        nodes.push(node);
      }
    }
    
    return nodes;
  }

  private parseToken(token: Record<string, unknown>): ContentNode | null {
    switch (token.type) {
      case 'heading':
        return {
          type: 'heading',
          content: token.text as string,
          attributes: { level: String(token.depth) }
        };
        
      case 'paragraph':
        const tokens = (token.tokens as Array<Record<string, unknown>>) || [];
        const hasInlineImage = tokens.some(t => t.type === 'image');
        
        if (hasInlineImage) {
          const children = tokens.map(t => {
            if (t.type === 'image') {
              return {
                type: 'image' as const,
                src: this.processImagePath(t.href as string),
                alt: t.text as string || ''
              };
            }
            return {
              type: 'text' as const,
              content: this.processInlineFormatting(t.text as string || '')
            };
          });
          return {
            type: 'paragraph',
            children
          };
        }
        
        return {
          type: 'paragraph',
          content: this.processInlineFormatting(token.text as string)
        };
        
      case 'list':
        return {
          type: 'list',
          ordered: token.ordered as boolean,
          children: (token.items as Array<Record<string, unknown>>).map((item) => ({
            type: 'list-item',
            content: this.processInlineFormatting(item.text as string)
          }))
        };
        
      case 'image':
        return {
          type: 'image',
          src: this.processImagePath(token.href as string),
          alt: token.title as string || ''
        };

      case 'code':
        return {
          type: 'code',
          content: token.text as string,
          attributes: { lang: token.lang as string || '' }
        };
      
      case 'hr':
        return { type: 'container', attributes: { tag: 'hr' } };
      
      case 'blockquote':
        return {
          type: 'container',
          attributes: { tag: 'blockquote' },
          children: this.parseTokens((token as Record<string, unknown>).tokens as unknown[] || [])
        };
      
      case 'html':
        return { type: 'container', content: token.raw as string };
        
      default:
        return null;
    }
  }

  parse(markdown: string, options?: ParseOptions): MarkdownContent {
    const parseOptions = {
      gfm: options?.gfm ?? true,
      breaks: options?.breaks ?? false,
      pedantic: options?.pedantic ?? false
    };
    
    const tokens = marked.lexer(markdown, parseOptions as Parameters<typeof marked.lexer>[1]);
    const content = this.parseTokens(tokens);
    
    return {
      title: '',
      content
    };
  }

  parseToNodes(markdown: string, options?: ParseOptions): ContentNode[] {
    return this.parse(markdown, options).content;
  }
}
