import { MarkdownParser } from './parser.js';
import { HTMLRenderer } from './renderer.js';
import { ContentNode, MarkdownContent, PipelineConfigV2 } from './types.js';
import { getDefaultLogger } from './telemetry-init.js';
import type { LoggerInterface } from '@leadertechie/telemetry';

type NormalizedPipelineConfig = Required<Omit<PipelineConfigV2, 'onSlot' | 'slotPattern' | 'logger'>> & {
  onSlot?: (name: string) => string;
  slotPattern: RegExp;
  logger?: LoggerInterface;
};

export class MarkdownPipeline {
  private parser: MarkdownParser;
  private renderer: HTMLRenderer;
  private config: NormalizedPipelineConfig;
  private log: LoggerInterface;

  constructor(config: PipelineConfigV2 = {}) {
    this.log = config.logger ?? getDefaultLogger('md2html');

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
        addHeadingIds: config.styleOptions?.addHeadingIds ?? false,
        emitScopeAnchors: config.styleOptions?.emitScopeAnchors ?? false
      },
      preserveRawHTML: config.preserveRawHTML ?? false,
      slotPattern: config.slotPattern ?? /\[\[(.*?)\]\]/g,
      onSlot: config.onSlot,
      errorRecovery: config.errorRecovery ?? 'throw',
      maxRecursionDepth: config.maxRecursionDepth ?? 100,
      allowedHTMLTags: config.allowedHTMLTags ?? [],
      allowedScriptTypes: (config as any).allowedScriptTypes ?? [],
      allowedAttributes: config.allowedAttributes ?? {}
    };

    this.parser = new MarkdownParser({
      imagePathPrefix: this.config.imagePathPrefix,
      imageBaseUrl: this.config.imageBaseUrl,
      preserveRawHTML: this.config.preserveRawHTML,
      slotPattern: this.config.slotPattern,
      onSlot: this.config.onSlot,
      errorRecovery: this.config.errorRecovery,
      maxRecursionDepth: this.config.maxRecursionDepth,
      allowedHTMLTags: this.config.allowedHTMLTags,
        allowedScriptTypes: (this.config as any).allowedScriptTypes ?? [],
      allowedAttributes: this.config.allowedAttributes
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
    try {
      const nodes = this.parse(markdown);
      return this.render(nodes);
    } catch (err: any) {
      this.log.error('Markdown render failed', err, {
        length: markdown.length,
        recovery: this.config.errorRecovery,
      });
      throw err;
    }
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

  getConfig(): Readonly<PipelineConfigV2> {
    return { ...this.config };
  }

  getCustomCSS(): string {
    return this.renderer.getCustomCSS();
  }
}
