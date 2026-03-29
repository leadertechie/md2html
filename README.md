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
  },
  styleOptions: {
    classPrefix: 'md-',
    customCSS: 'body { font-family: system-ui; }',
    addHeadingIds: true
  }
});
```

### Style Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `classPrefix` | string | `''` | Prefix for CSS classes on elements (e.g., `'md-'` produces `md-heading`, `md-paragraph`) |
| `customCSS` | string | `''` | Custom CSS string to inject (use `pipeline.getCustomCSS()` to retrieve) |
| `addHeadingIds` | boolean | `false` | Add ID attributes to headings based on their content for anchor links |

When `classPrefix` or `addHeadingIds` is set, CSS classes will be added to elements:
- `heading`, `paragraph`, `list`, `list-item`, `image`, `code`, `container`, `blockquote`

Example output with `classPrefix: 'md-'` and `addHeadingIds: true`:
```html
<h1 id="hello-world" class="md-heading">Hello World</h1>
<p class="md-paragraph">This is a paragraph.</p>
<ul class="md-list">
  <li class="md-list-item">Item 1</li>
</ul>
```

### API

| Method | Description |
|--------|-------------|
| `parse(markdown)` | Parse markdown string to AST |
| `render(nodes)` | Render AST to HTML string |
| `renderMarkdown(markdown)` | Parse and render in one call |
| `renderPage(title, nodes, options?)` | Render AST to full HTML page |
| `getCustomCSS()` | Get custom CSS string from style config |
| `getConfig()` | Get current pipeline configuration |

## License

MIT
