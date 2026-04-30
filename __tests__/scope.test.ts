import { describe, it, expect } from 'vitest';
import { HTMLRenderer } from '../src/renderer';
import { MarkdownPipeline } from '../src/pipeline';
import type { ContentNode } from '../src/types';

describe('Scope Anchors (emitScopeAnchors)', () => {
  describe('HTMLRenderer with emitScopeAnchors', () => {
    it('should emit data-md-scope on heading when enabled', () => {
      const renderer = new HTMLRenderer({ classPrefix: 'md-', emitScopeAnchors: true });
      const node: ContentNode = { type: 'heading', content: 'Title', attributes: { level: '1' } };
      const html = renderer.renderNode(node);
      expect(html).toContain('data-md-scope="heading"');
      expect(html).toContain('<h1');
    });

    it('should emit data-md-scope on paragraph when enabled', () => {
      const renderer = new HTMLRenderer({ classPrefix: 'md-', emitScopeAnchors: true });
      const node: ContentNode = { type: 'paragraph', content: 'Hello world' };
      const html = renderer.renderNode(node);
      expect(html).toContain('data-md-scope="paragraph"');
      expect(html).toContain('<p');
    });

    it('should emit data-md-scope on list when enabled', () => {
      const renderer = new HTMLRenderer({ classPrefix: 'md-', emitScopeAnchors: true });
      const node: ContentNode = {
        type: 'list',
        ordered: false,
        children: [
          { type: 'list-item', content: 'Item 1' },
          { type: 'list-item', content: 'Item 2' }
        ]
      };
      const html = renderer.renderNode(node);
      expect(html).toContain('data-md-scope="list"');
      expect(html).toContain('<ul');
    });

    it('should emit data-md-scope on list-item when enabled', () => {
      const renderer = new HTMLRenderer({ classPrefix: 'md-', emitScopeAnchors: true });
      const node: ContentNode = { type: 'list-item', content: 'Item' };
      const html = renderer.renderNode(node);
      expect(html).toContain('data-md-scope="list-item"');
      expect(html).toContain('<li');
    });

    it('should emit data-md-scope on image when enabled', () => {
      const renderer = new HTMLRenderer({ classPrefix: 'md-', emitScopeAnchors: true });
      const node: ContentNode = { type: 'image', src: 'test.jpg', alt: 'Test' };
      const html = renderer.renderNode(node);
      expect(html).toContain('data-md-scope="image"');
      expect(html).toContain('<img');
    });

    it('should emit data-md-scope on code block when enabled', () => {
      const renderer = new HTMLRenderer({ classPrefix: 'md-', emitScopeAnchors: true });
      const node: ContentNode = { type: 'code', content: 'const x = 1;', attributes: { lang: 'javascript' } };
      const html = renderer.renderNode(node);
      expect(html).toContain('data-md-scope="code"');
      expect(html).toContain('<pre');
    });

    it('should emit data-md-scope on strong when enabled', () => {
      const renderer = new HTMLRenderer({ classPrefix: 'md-', emitScopeAnchors: true });
      const node: ContentNode = { type: 'strong', content: 'bold text' };
      const html = renderer.renderNode(node);
      expect(html).toContain('data-md-scope="strong"');
      expect(html).toContain('<strong');
    });

    it('should emit data-md-scope on emphasis when enabled', () => {
      const renderer = new HTMLRenderer({ classPrefix: 'md-', emitScopeAnchors: true });
      const node: ContentNode = { type: 'emphasis', content: 'italic text' };
      const html = renderer.renderNode(node);
      expect(html).toContain('data-md-scope="emphasis"');
      expect(html).toContain('<em');
    });

    it('should emit data-md-scope on container when enabled', () => {
      const renderer = new HTMLRenderer({ classPrefix: 'md-', emitScopeAnchors: true });
      const node: ContentNode = { type: 'container', children: [{ type: 'text', content: 'content' }] };
      const html = renderer.renderNode(node);
      expect(html).toContain('data-md-scope="container"');
      expect(html).toContain('<div');
    });

    it('should wrap nodes in data-md-scope="root" div when enabled', () => {
      const renderer = new HTMLRenderer({ classPrefix: 'md-', emitScopeAnchors: true });
      const nodes: ContentNode[] = [
        { type: 'heading', content: 'Title', attributes: { level: '1' } },
        { type: 'paragraph', content: 'Content' }
      ];
      const html = renderer.renderNodes(nodes);
      expect(html).toContain('data-md-scope="root"');
      expect(html).toContain('<div data-md-scope="root">');
      expect(html).toContain('</div>');
    });

    it('should NOT emit data-md-scope when emitScopeAnchors is false (default)', () => {
      const renderer = new HTMLRenderer({ classPrefix: 'md-' });
      const node: ContentNode = { type: 'heading', content: 'Title', attributes: { level: '1' } };
      const html = renderer.renderNode(node);
      expect(html).not.toContain('data-md-scope');
    });

    it('should NOT emit data-md-scope when emitScopeAnchors is not set', () => {
      const renderer = new HTMLRenderer();
      const node: ContentNode = { type: 'heading', content: 'Title', attributes: { level: '1' } };
      const html = renderer.renderNode(node);
      expect(html).not.toContain('data-md-scope');
    });
  });

  describe('MarkdownPipeline with emitScopeAnchors', () => {
    it('should emit scope anchors through pipeline', () => {
      const pipeline = new MarkdownPipeline({
        styleOptions: { classPrefix: 'md-', emitScopeAnchors: true }
      });
      const html = pipeline.renderMarkdown('# Hello\n\nWorld');
      expect(html).toContain('data-md-scope="root"');
      expect(html).toContain('data-md-scope="heading"');
      expect(html).toContain('data-md-scope="paragraph"');
    });

    it('should still emit flat classes alongside scope anchors', () => {
      const pipeline = new MarkdownPipeline({
        styleOptions: { classPrefix: 'md-', emitScopeAnchors: true }
      });
      const html = pipeline.renderMarkdown('# Hello');
      expect(html).toContain('data-md-scope="heading"');
      expect(html).toContain('class="md-h1"');
    });
  });
});
