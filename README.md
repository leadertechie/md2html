# @leadertechie/md2html

A configuration-driven markdown to HTML pipeline that parses markdown to an AST (ContentNode), then renders to HTML strings or Lit templates.

## Features

- **Parse markdown to AST** - Converts markdown to a structured JSON AST (ContentNode[])
- **Render to HTML string** - Convert AST to plain HTML strings
- **Render to Lit templates** - Convert AST to Lit TemplateResult for web components
- **Configuration-driven** - No hardcoded paths or content structure
- **SSR-ready** - Works in both Node.js and browser environments
- **Image path handling** - Configurable prefix and base URL for images

## Installation

```bash
npm install @leadertechie/md2html
```

## Usage

### Basic Usage

```typescript
import { MarkdownPipeline } from '@leadertechie/md2html';

const pipeline = new MarkdownPipeline();

const markdown = `# Hello World

This is a paragraph with **bold** and *italic* text.

- Item 1
- Item 2

![Alt text](image.jpg)
`;

// Parse markdown to AST
const ast = pipeline.parse(markdown);

// Render AST to HTML string
const html = pipeline.render(ast);
```

### Configuration

```typescript
import { MarkdownPipeline } from '@leadertechie/md2html';

const pipeline = new MarkdownPipeline({
  imagePathPrefix: 'images/',
  imageBaseUrl: 'https://cdn.example.com',
  parseOptions: {
    gfm: true,
    breaks: false,
    pedantic: false
  }
});
```

### API

| Method | Description |
|--------|-------------|
| `parse(markdown)` | Parse markdown string to AST |
| `render(nodes)` | Render AST to HTML string |
| `renderMarkdown(markdown)` | Parse and render in one call |
| `renderPage(title, nodes)` | Render AST to full HTML page |

## License

MIT
