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

The pipeline is built from modular stages, each with a clear design pattern and single responsibility:

```
Markdown String
      │
      ▼
┌──────────────────────────┐
│ 1. Preprocessor Chain    │  Chain of Responsibility
│    (preprocessor.ts)     │  Transforms raw markdown before lexing
│    • ContainerBlock      │  (e.g., ::: containers → HTML comments)
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 2. marked.lexer()        │  Third-party lexer
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 3. Token Postprocessor   │  Chain of Responsibility
│    (token-postprocessor  │  Restructures flat tokens → nested tree
│    .ts)                  │  (e.g., comments → containerBlock)
│    • ContainerBlock      │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 4. Token Handlers        │  Strategy Pattern
│    (handlers/)           │  Each marked token type has a dedicated
│    • TokenHandlerRegistry│  handler, registered by type name.
│    • CatchAllHandler     │  Extensible at runtime via registry.
└──────────┬───────────────┘
           │
           ▼
      ContentNode[]
      (AST)
           │
           ▼
┌──────────────────────────┐
│ 5. Renderer              │  Strategy Pattern
│    (renderer-strategies  │  Each ContentNode type has its own
│    .ts / lit-strategies  │  render strategy — choose between:
│    .ts)                  │  • HTMLRenderer (plain HTML strings)
│    • NodeRendererStrategy│  • LitRenderer (Lit TemplateResult)
│    • LitNodeRendererStrat│
└──────────────────────────┘
```

### 1. Preprocessing (`preprocessor.ts`)

The `CompositePreprocessor` chains `Preprocessor` transforms that run on raw markdown **before** lexing. Built-in:

- **`ContainerBlockPreprocessor`** — converts `:::tag#id.class` fences to `<!-- md-container:... -->` HTML comment markers, so `marked` preserves them without affecting inner markdown parsing

The chain is extensible:

```typescript
import { MarkdownParser, Preprocessor } from '@leadertechie/md2html';

class EmojiPreprocessor implements Preprocessor {
  readonly name = 'emoji';
  process(markdown: string): string {
    return markdown.replace(':smile:', '😊');
  }
}

const parser = new MarkdownParser();
parser.preprocessors.add(new EmojiPreprocessor());
```

### 2. Token Postprocessing (`token-postprocessor.ts`)

The `CompositeTokenPostprocessor` chains `TokenPostprocessor` transforms that run on the flat token array **after** lexing. Built-in:

- **`ContainerBlockPostprocessor`** — collapses `<!-- md-container:... -->` / `<!-- /md-container -->` markers into nested `containerBlock` tokens with proper parent-child structure (handles arbitrary nesting depth)

Custom postprocessors:

```typescript
parser.postprocessors.add({
  name: 'filter-unwanted',
  process: (tokens) => tokens.filter(t => (t as any).type !== 'html')
});
```

### 3. Token Handling — Strategy Pattern (`handlers/`)

Each marked token type has its own `TokenHandler` class, registered in the `TokenHandlerRegistry`:

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
├── link-handler.ts       # <a>
├── frontmatter-handler.ts# YAML frontmatter metadata
├── container-block-      # ::: container blocks
│   handler.ts
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

### 4. Rendering — Strategy Pattern (`renderer-strategies.ts`, `lit-strategies.ts`)

The AST renderers use the same Strategy + Registry pattern as the token handlers:

- **`HTMLRenderer`** — produces plain HTML strings. Uses `NodeRendererStrategy` / `RendererStrategyRegistry` for each node type. Supports `classPrefix`, `addHeadingIds`, and `emitScopeAnchors` styling.
- **`LitRenderer`** — produces Lit `TemplateResult` objects. Uses `LitNodeRendererStrategy` / `LitStrategyRegistry`. Perfect for Lit web components.

Both registries are publicly accessible for customization:

```typescript
import { HTMLRenderer, NodeRendererStrategy } from '@leadertechie/md2html';

const renderer = new HTMLRenderer({ classPrefix: 'my-' });

// Register a custom strategy
renderer.strategies.register({
  type: 'custom',
  render: (node, renderChild, ctx) => `<my-el>${node.content}</my-el>`
});
```

The `LitRenderer.renderToHTMLString()` delegates to `HTMLRenderer` to avoid duplicating string rendering logic.

### 5. Context Factory (`context-factory.ts`)

The `createParseContext()` pure function separates context construction from the parser class. It bridges parser services (image processing, slot resolution, HTML sanitization) to token handlers via the `ParserServices` interface. This makes the context testable in isolation and decouples handler logic from parser internals.

### Source Map

```
src/
├── parser.ts              # Orchestrator: coordinates pre/post-processing + token handling
├── preprocessor.ts        # Chain of Responsibility: markdown transforms before lexing
├── token-postprocessor.ts # Chain of Responsibility: token transforms after lexing
├── context-factory.ts     # Factory: creates ParseContext for token handlers
├── handlers/              # Strategy: per-token-type ContentNode producers
│   ├── types.ts
│   ├── registry.ts
│   ├── heading-handler.ts
│   ├── paragraph-handler.ts
│   ├── list-handler.ts
│   ├── image-handler.ts
│   ├── code-handler.ts
│   ├── hr-handler.ts
│   ├── blockquote-handler.ts
│   ├── html-handler.ts
│   ├── link-handler.ts
│   ├── frontmatter-handler.ts
│   ├── container-block-handler.ts
│   └── catchall-handler.ts
├── renderer.ts            # HTMLRenderer: transforms ContentNodes to plain HTML
├── renderer-strategies.ts # Strategy: per-node-type HTML string renderers
├── lit-renderer.ts        # LitRenderer: transforms ContentNodes to Lit TemplateResult
├── lit-strategies.ts      # Strategy: per-node-type Lit TemplateResult renderers
├── visitor.ts             # Visitor: tree traversal utilities
├── factory.ts             # NodeFactory: ContentNode builder API
├── pipeline.ts            # Facade: high-level MarkdownPipeline API
├── types.ts               # Core types: ContentNode, MarkdownContent, configs
└── telemetry-init.ts      # Shared logger initialization
```

## License

MIT
