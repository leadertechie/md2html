import { MarkdownParser } from './parser.js';
import { HTMLRenderer } from './renderer.js';
import { ContentNode, MarkdownContent, PipelineConfig, StyleConfig } from './types.js';

export class MarkdownPipeline {
  private parser: MarkdownParser;
  private renderer: HTMLRenderer;
  private config: Required<PipelineConfig>;

  constructor(config: PipelineConfig = {}) {
    this.config = {
      imagePathPrefix: config.imagePathPrefix || '',
      imageBaseUrl: config.imageBaseUrl || '',
      parseOptions: {
        gfm: config.parseOptions?.gfm ?? true,
        breaks: config.parseOptions?.breaks ?? false,
        pedantic: config.parseOptions?.pedantic ?? false
      },
      styleOptions: {
        classPrefix: config.styleOptions?.classPrefix || '',
        customCSS: config.styleOptions?.customCSS || '',
        addHeadingIds: config.styleOptions?.addHeadingIds ?? false
      }
    };

    this.parser = new MarkdownParser({
      imagePathPrefix: this.config.imagePathPrefix,
      imageBaseUrl: this.config.imageBaseUrl
    });
    this.renderer = new HTMLRenderer(this.config.styleOptions);
  }

  parse(markdown: string): ContentNode[] {
    return this.parser.parseToNodes(markdown, this.config.parseOptions);
  }

  parseWithMetadata(markdown: string): MarkdownContent {
    return this.parser.parse(markdown, this.config.parseOptions);
  }

  render(nodes: ContentNode[]): string {
    return this.renderer.renderNodes(nodes);
  }

  renderMarkdown(markdown: string): string {
    const nodes = this.parse(markdown);
    return this.render(nodes);
  }

  renderPage(title: string, nodes: ContentNode[], options?: {
    lang?: string;
    charset?: string;
  }): string {
    const html = this.render(nodes);
    return `<!DOCTYPE html>
<html lang="${options?.lang || 'en'}">
<head>
  <meta charset="${options?.charset || 'UTF-8'}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body>
  ${html}
</body>
</html>`;
  }

  getConfig(): Readonly<Required<PipelineConfig>> {
    return { ...this.config };
  }

  getCustomCSS(): string {
    return this.renderer.getCustomCSS();
  }
}
