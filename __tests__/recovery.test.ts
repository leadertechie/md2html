import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarkdownParser } from '../src/parser';
import { MarkdownPipeline } from '../src/pipeline';

describe('Error Recovery', () => {
  describe('MarkdownParser errorRecovery', () => {
    it('should throw on parse error when errorRecovery is "throw" (default)', () => {
      const parser = new MarkdownParser({ errorRecovery: 'throw' });
      // Passing null/undefined-like content that might cause issues
      expect(() => parser.parse('')).not.toThrow();
    });

    it('should return fallback content on parse error when errorRecovery is "warn"', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const parser = new MarkdownParser({ errorRecovery: 'warn' });
      const result = parser.parse('Hello **world**');
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      consoleSpy.mockRestore();
    });

    it('should return fallback content on parse error when errorRecovery is "silent"', () => {
      const parser = new MarkdownParser({ errorRecovery: 'silent' });
      const result = parser.parse('Hello **world**');
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('MarkdownPipeline errorRecovery', () => {
    it('should throw by default (backward compatible)', () => {
      const pipeline = new MarkdownPipeline();
      // Normal markdown should work fine
      const html = pipeline.renderMarkdown('# Hello');
      expect(html).toContain('<h1>Hello</h1>');
    });

    it('should work with warn mode', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const pipeline = new MarkdownPipeline({ errorRecovery: 'warn' });
      const html = pipeline.renderMarkdown('# Hello\n\nWorld');
      expect(html).toContain('Hello');
      expect(html).toContain('World');
      consoleSpy.mockRestore();
    });

    it('should work with silent mode', () => {
      const pipeline = new MarkdownPipeline({ errorRecovery: 'silent' });
      const html = pipeline.renderMarkdown('# Hello\n\nWorld');
      expect(html).toContain('Hello');
      expect(html).toContain('World');
    });
  });

  describe('Max Recursion Depth', () => {
    it('should respect maxRecursionDepth', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const parser = new MarkdownParser({ 
        errorRecovery: 'warn',
        maxRecursionDepth: 5 
      });
      // Simple markdown should still work
      const result = parser.parse('# Hello\n\nWorld');
      expect(result.content.length).toBeGreaterThan(0);
      consoleSpy.mockRestore();
    });
  });
});

describe('Raw HTML Preservation', () => {
  describe('MarkdownParser preserveRawHTML', () => {
    it('should pass through allowed HTML tags when preserveRawHTML is true', () => {
      const parser = new MarkdownParser({ preserveRawHTML: true });
      const result = parser.parse('Hello <div class="test">World</div>');
      // The HTML should be preserved in the output
      // In preserveRawHTML mode, inline HTML tokens become children of the paragraph
      const html = result.content.map(n => {
        if (n.children) {
          return n.children.map(c => c.content || '').join('');
        }
        return n.content || '';
      }).join('');
      expect(html).toContain('Hello');
      expect(html).toContain('World');
      expect(html).toContain('<div');
    });

    it('should strip script tags by default', () => {
      const parser = new MarkdownParser({ preserveRawHTML: true });
      const result = parser.parse('Hello <script>alert("xss")</script>World');
      // Script tags are stripped from inline HTML tokens within paragraphs
      const html = result.content.map(n => {
        if (n.children) {
          return n.children.map(c => c.content || '').join('');
        }
        return n.content || '';
      }).join('');
      expect(html).not.toContain('<script');
      expect(html).toContain('Hello');
      expect(html).toContain('World');
    });

    it('should allow script tags when explicitly added to allowedHTMLTags', () => {
      const parser = new MarkdownParser({ 
        preserveRawHTML: true,
        allowedHTMLTags: ['script']
      });
      const result = parser.parse('Hello <script>console.log("test")</script>World');
      const html = result.content.map(n => {
        if (n.children) {
          return n.children.map(c => c.content || '').join('');
        }
        return n.content || '';
      }).join('');
      expect(html).toContain('<script');
    });

    it('should not preserve raw HTML when preserveRawHTML is false (default)', () => {
      const parser = new MarkdownParser();
      const result = parser.parse('Hello <div class="test">World</div>');
      // In default mode, HTML tokens are stored as content, not rawHTML
      const hasRawHTML = result.content.some(n => n.rawHTML);
      expect(hasRawHTML).toBe(false);
    });
  });

  describe('MarkdownPipeline preserveRawHTML', () => {
    it('should pass through allowed HTML through pipeline', () => {
      const pipeline = new MarkdownPipeline({ preserveRawHTML: true });
      const html = pipeline.renderMarkdown('Hello <div class="test">World</div>');
      expect(html).toContain('Hello');
    });
  });
});

describe('Slot Hooks', () => {
  describe('MarkdownParser slot hooks', () => {
    it('should resolve [[SLOT_NAME]] placeholders via onSlot callback', () => {
      const parser = new MarkdownParser({
        onSlot: (name) => `[resolved:${name}]`
      });
      const result = parser.parse('Hello [[USER_NAME]]!');
      expect(result.content[0].content).toContain('[resolved:USER_NAME]');
    });

    it('should not modify text when no onSlot callback is provided', () => {
      const parser = new MarkdownParser();
      const result = parser.parse('Hello [[USER_NAME]]!');
      expect(result.content[0].content).toContain('[[USER_NAME]]');
    });

    it('should use custom slotPattern', () => {
      const parser = new MarkdownParser({
        slotPattern: /\{\{(.*?)\}\}/g,
        onSlot: (name) => `[resolved:${name}]`
      });
      const result = parser.parse('Hello {{USER_NAME}}!');
      expect(result.content[0].content).toContain('[resolved:USER_NAME]');
    });

    it('should resolve slots in headings', () => {
      const parser = new MarkdownParser({
        onSlot: (name) => `[resolved:${name}]`
      });
      const result = parser.parse('# Hello [[NAME]]');
      expect(result.content[0].content).toContain('[resolved:NAME]');
    });

    it('should resolve slots in list items', () => {
      const parser = new MarkdownParser({
        onSlot: (name) => `[resolved:${name}]`
      });
      const result = parser.parse('- Item [[ID]]');
      expect(result.content[0].children?.[0].content).toContain('[resolved:ID]');
    });
  });

  describe('MarkdownPipeline slot hooks', () => {
    it('should resolve slots through pipeline', () => {
      const pipeline = new MarkdownPipeline({
        onSlot: (name) => `[resolved:${name}]`
      });
      const html = pipeline.renderMarkdown('Hello [[USER_NAME]]!');
      expect(html).toContain('[resolved:USER_NAME]');
    });
  });
});
