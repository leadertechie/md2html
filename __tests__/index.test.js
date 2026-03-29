import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownParser } from '../src/parser';
import { HTMLRenderer } from '../src/renderer';
import { MarkdownPipeline } from '../src/pipeline';
describe('MarkdownParser', () => {
    let parser;
    beforeEach(() => {
        parser = new MarkdownParser();
    });
    describe('parse', () => {
        it('should parse heading', () => {
            const result = parser.parse('# Hello World');
            expect(result.content).toHaveLength(1);
            expect(result.content[0].type).toBe('heading');
            expect(result.content[0].content).toBe('Hello World');
        });
        it('should parse multiple headings', () => {
            const result = parser.parse('# Heading 1\n## Heading 2\n### Heading 3');
            expect(result.content).toHaveLength(3);
            expect(result.content[0].type).toBe('heading');
        });
        it('should parse paragraph', () => {
            const result = parser.parse('This is a paragraph');
            expect(result.content).toHaveLength(1);
            expect(result.content[0].type).toBe('paragraph');
        });
        it('should parse list items', () => {
            const result = parser.parse('- Item 1\n- Item 2\n- Item 3');
            expect(result.content).toHaveLength(1);
            expect(result.content[0].type).toBe('list');
            expect(result.content[0].children).toHaveLength(3);
        });
        it('should parse image in paragraph', () => {
            const result = parser.parse('![Alt text](image.jpg)');
            expect(result.content).toHaveLength(1);
            expect(result.content[0].type).toBe('paragraph');
            expect(result.content[0].children?.[0].type).toBe('image');
        });
        it('should parse code block', () => {
            const result = parser.parse('```javascript\nconst x = 1;\n```');
            expect(result.content).toHaveLength(1);
            expect(result.content[0].type).toBe('code');
        });
        it('should handle image path prefix', () => {
            const parserWithPrefix = new MarkdownParser({ imagePathPrefix: 'images/' });
            const result = parserWithPrefix.parse('![Alt](photo.jpg)');
            expect(result.content[0].children?.[0].src).toBe('images/photo.jpg');
        });
        it('should handle imageBaseUrl', () => {
            const parserWithBaseUrl = new MarkdownParser({ imageBaseUrl: 'https://cdn.example.com/' });
            const result = parserWithBaseUrl.parse('![Alt](photo.jpg)');
            expect(result.content[0].children?.[0].src).toBe('https://cdn.example.com/photo.jpg');
        });
    });
});
describe('HTMLRenderer', () => {
    let renderer;
    beforeEach(() => {
        renderer = new HTMLRenderer();
    });
    describe('renderNode', () => {
        it('should render heading', () => {
            const node = { type: 'heading', content: 'Hello', attributes: { level: '1' } };
            const html = renderer.renderNode(node);
            expect(html).toBe('<h1>Hello</h1>');
        });
        it('should render paragraph', () => {
            const node = { type: 'paragraph', content: 'Hello world' };
            const html = renderer.renderNode(node);
            expect(html).toBe('<p>Hello world</p>');
        });
        it('should render image', () => {
            const node = { type: 'image', src: 'image.jpg', alt: 'Alt text' };
            const html = renderer.renderNode(node);
            expect(html).toBe('<img src="image.jpg" alt="Alt text">');
        });
    });
    describe('renderNodes', () => {
        it('should render multiple nodes', () => {
            const nodes = [
                { type: 'heading', content: 'Title', attributes: { level: '1' } },
                { type: 'paragraph', content: 'Content' }
            ];
            const html = renderer.renderNodes(nodes);
            expect(html).toContain('<h1>Title</h1>');
            expect(html).toContain('<p>Content</p>');
        });
        it('should handle empty array', () => {
            const html = renderer.renderNodes([]);
            expect(html).toBe('');
        });
    });
});
describe('MarkdownPipeline', () => {
    let pipeline;
    beforeEach(() => {
        pipeline = new MarkdownPipeline();
    });
    describe('parse', () => {
        it('should parse markdown to nodes', () => {
            const nodes = pipeline.parse('# Hello');
            expect(nodes).toHaveLength(1);
            expect(nodes[0].type).toBe('heading');
        });
    });
    describe('renderMarkdown', () => {
        it('should parse and render in one call', () => {
            const html = pipeline.renderMarkdown('# Hello World\n\nThis is a paragraph.');
            expect(html).toContain('<h1>Hello World</h1>');
            expect(html).toContain('<p>This is a paragraph.</p>');
        });
    });
    describe('renderPage', () => {
        it('should render full HTML page', () => {
            const nodes = [
                { type: 'heading', content: 'Title', attributes: { level: '1' } }
            ];
            const page = pipeline.renderPage('My Page', nodes);
            expect(page).toContain('<!DOCTYPE html>');
            expect(page).toContain('<title>My Page</title>');
        });
    });
    describe('configuration', () => {
        it('should use imagePathPrefix config', () => {
            const pipelineWithConfig = new MarkdownPipeline({ imagePathPrefix: 'images/' });
            const nodes = pipelineWithConfig.parse('![img](test.jpg)');
            expect(nodes[0].children?.[0].src).toBe('images/test.jpg');
        });
    });
});
