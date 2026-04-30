# @leadertechie/md2html

A configuration-driven markdown to HTML pipeline that parses markdown to an AST (ContentNode), then renders to HTML strings or Lit templates.

## Features

- **Parse markdown to AST** - Converts markdown to a structured JSON AST (ContentNode[])
- **Render to HTML string** - Convert AST to plain HTML strings
- **Render to Lit templates** - Convert AST to Lit TemplateResult for web components
- **Configuration-driven** - No hardcoded paths or content structure
- **SSR-ready** - Works in both Node.js and browser environments
- **Image path handling** - Configurable prefix and base URL for images
- **Strategy pattern token handlers** - Extensible handler registry with per-token-type strategies
- **Catch-all fallback** - Unhandled token types are wrapped in container nodes with `data-unhandled` attributes
- **CSS `@scope` anchors** - Emit `data-md-scope` attributes for CSS `@scope` targeting
- **Raw HTML passthrough** - Preserve allowed HTML tags (div, span, img, etc.) with script stripping by default
- **Slot hooks** - Resolve `[[SLOT_NAME]]` placeholders via callback for personalization
- **Graceful error recovery** - Configurable `'throw' | 'warn' | 'silent'` error handling modes

## Installation

```bash
npm install @leadertechie/md2html lit
```

> Note: `lit` is a peer dependency and required for rendering Lit templates.

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
    addHeadingIds: true,
    emitScopeAnchors: true   // v2: emit data-md-scope attributes
  },
  preserveRawHTML: true,     // v2: pass through allowed HTML tags
  errorRecovery: 'warn',     // v2: graceful error handling
  onSlot: (name) => `[${name}]`  // v2: resolve [[SLOT_NAME]] placeholders
});
```

### Style Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `classPrefix` | string | `''` | Prefix for CSS classes on elements |
| `customCSS` | string | `''` | Custom CSS string to inject (use `pipeline.getCustomCSS()` to retrieve) |
| `addHeadingIds` | boolean | `false` | Add ID attributes to headings based on their content for anchor links |
| `emitScopeAnchors` | boolean | `false` | Emit `data-md-scope` attributes for CSS `@scope` targeting (v2) |

When `classPrefix` or `addHeadingIds` is set, CSS classes will be added to elements:
- Headings get level-specific classes: `md-h1`, `md-h2`, `md-h3`, etc.
- Other elements: `paragraph`, `list`, `list-item`, `image`, `code`, `container`, `blockquote`

Example output with `classPrefix: 'md-'` and `addHeadingIds: true`:
```html
<h1 id="hello-world" class="md-h1">Hello World</h1>
<h2 id="subheading" class="md-h2">Subheading</h2>
<p class="md-paragraph">This is a paragraph.</p>
<ul class="md-list">
  <li class="md-list-item">Item 1</li>
</ul>
```

### CSS `@scope` Anchors (v2)

When `emitScopeAnchors: true`, every rendered element gets a `data-md-scope` attribute:

```html
<div data-md-scope="root">
  <h2 data-md-scope="heading" class="md-heading">Title</h2>
  <p data-md-scope="paragraph" class="md-paragraph">Content</p>
</div>
```

This enables CSS `@scope` targeting in your stylesheets:

```css
@layer components {
  @scope ([data-md-scope="root"]) {
    :scope { max-width: 700px; }
    [data-md-scope="heading"] { font-size: clamp(1.5rem, 4vw, 2.5rem); }
  }
}
```

### Raw HTML Passthrough (v2)

When `preserveRawHTML: true`, allowed HTML tags pass through the parser:

```typescript
const pipeline = new MarkdownPipeline({ preserveRawHTML: true });
const html = pipeline.renderMarkdown('Hello <div class="test">World</div>');
// Output preserves the <div> with its attributes
```

**Default allowed tags:** `img`, `style`, `div`, `span`, `section`, `article`, `aside`, `header`, `footer`, `nav`, `main`, `figure`, `figcaption`, `details`, `summary`, `mark`, `time`, `video`, `audio`, `source`, `iframe`, `embed`

**Script tags** are stripped by default for security. Opt-in with `allowedHTMLTags: ['script']`.

### Slot Hooks (v2)

Resolve `[[SLOT_NAME]]` placeholders for personalization:

```typescript
const pipeline = new MarkdownPipeline({
  onSlot: (name) => {
    const values = { USER_NAME: 'Alice', COMPANY: 'Acme' };
    return values[name] || `[[${name}]]`;
  }
});
const html = pipeline.renderMarkdown('Hello [[USER_NAME]] from [[COMPANY]]!');
// Output: Hello Alice from Acme!
```

Custom slot patterns are supported via `slotPattern`:

```typescript
const pipeline = new MarkdownPipeline({
  slotPattern: /\{\{(.*?)\}\}/g,
  onSlot: (name) => values[name] || `{{${name}}}`
});
```

### Error Recovery (v2)

Three error recovery modes for production resilience:

```typescript
// 'throw' (default) — backward compatible, throws on parse errors
const strict = new MarkdownPipeline({ errorRecovery: 'throw' });

// 'warn' — logs warning, returns partial content as fallback text
const tolerant = new MarkdownPipeline({ errorRecovery: 'warn' });

// 'silent' — silently returns fallback content
const silent = new MarkdownPipeline({ errorRecovery: 'silent' });
```

Additional safety with `maxRecursionDepth` (default: 100) to prevent stack overflow on deeply nested content.

### API

| Method | Description |
|--------|-------------|
| `parse(markdown)` | Parse markdown string to AST |
| `render(nodes)` | Render AST to HTML string |
| `renderMarkdown(markdown)` | Parse and render in one call |
| `renderPage(title, nodes, options?)` | Render AST to full HTML page |
| `getCustomCSS()` | Get custom CSS string from style config |
| `getConfig()` | Get current pipeline configuration |

## Architecture (v2)

### Strategy Pattern Token Handlers

The parser uses a **strategy pattern** with a `TokenHandlerRegistry`. Each marked token type has its own handler class:

```
src/handlers/
├── types.ts              # TokenHandler interface + ParseContext
├── registry.ts           # TokenHandlerRegistry with catch-all fallback
├── heading-handler.ts    # h1-h6
├── paragraph-handler.ts  # <p> with inline image/HTML support
├── list-handler.ts       # <ul>/<ol>
├── image-handler.ts      # <img>
├── code-handler.ts       # <pre><code>
├── hr-handler.ts         # <hr>
├── blockquote-handler.ts # <blockquote>
├── html-handler.ts       # raw HTML passthrough
└── catchall-handler.ts   # fallback for unregistered types
```

**Extending the parser** — register custom handlers without modifying internals:

```typescript
import { MarkdownParser, TokenHandler } from '@leadertechie/md2html';

const parser = new MarkdownParser();

// Override heading rendering
const customHeading: TokenHandler = {
  type: 'heading',
  handle: (token, ctx) => ({
    type: 'container',
    attributes: { tag: 'div', 'data-custom': 'true' },
    children: [{
      type: 'heading',
      content: ctx.processSlots(token.text as string),
      attributes: { level: String(token.depth) }
    }]
  })
};
parser.handlers.register(customHeading);

// Remove a handler to skip token types
parser.handlers.unregister('heading');

// Replace the catch-all for unregistered token types
parser.handlers.setCatchAll({
  type: '*',
  handle: (token) => ({
    type: 'text',
    content: `[fallback: ${token.type}]`
  })
});
```

**Catch-all handler** — When a token type has no dedicated handler (e.g., `table`, `def`), the `CatchAllHandler` wraps it in a `<div data-unhandled="type">` container so content is never silently lost. The `onUnhandledToken` callback notifies callers:

```typescript
const parser = new MarkdownParser({
  onUnhandledToken: (type, token) => {
    console.warn(`[md2html] Unhandled token type: ${type}`);
  }
});
```

## License

MIT
