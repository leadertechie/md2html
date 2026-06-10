export type ContentNodeType = 
  | 'text' 
  | 'heading' 
  | 'paragraph' 
  | 'list' 
  | 'list-item' 
  | 'image' 
  | 'code' 
  | 'container'
  | 'strong'
  | 'emphasis'
  | 'link';

export interface ContentNode {
  type: ContentNodeType;
  content?: string;
  children?: ContentNode[];
  attributes?: Record<string, unknown>;
  className?: string;
  src?: string;
  alt?: string;
  ordered?: boolean;
  /** Raw HTML content for passthrough mode */
  rawHTML?: string;
  /** Scope anchor value for data-md-scope */
  scope?: string;
}

export interface MarkdownContent {
  title: string;
  metadata?: Record<string, unknown>;
  content: ContentNode[];
}

export interface ParseOptions {
  gfm?: boolean;
  breaks?: boolean;
  pedantic?: boolean;
}

export interface StyleConfig {
  classPrefix?: string;
  customCSS?: string;
  addHeadingIds?: boolean;
}

/**
 * v2: Extended StyleConfig with scope anchor support.
 */
export interface StyleConfigV2 extends StyleConfig {
  /** Emit data-md-scope attributes for CSS @scope anchoring (default: false) */
  emitScopeAnchors?: boolean;
}

export interface PipelineConfig {
  imagePathPrefix?: string;
  imageBaseUrl?: string;
  parseOptions?: ParseOptions;
  styleOptions?: StyleConfig | StyleConfigV2;
}

/**
 * v2: Extended PipelineConfig with raw HTML passthrough, slot hooks, and error recovery.
 */
export interface PipelineConfigV2 extends PipelineConfig {
  /** Optional telemetry logger for observability. Pass your own or a default console logger is used. */
  logger?: import("@leadertechie/telemetry").LoggerInterface;
  styleOptions?: StyleConfigV2;
  /** Preserve raw HTML tags in markdown (img, style, div, span, etc.) (default: false) */
  preserveRawHTML?: boolean;
  /** Regex pattern for slot placeholders like [[SLOT_NAME]] (default: /\[\[(.*?)\]\]/g) */
  slotPattern?: RegExp;
  /** Callback to resolve slot values. Called with the slot name, returns replacement string. */
  onSlot?: (name: string) => string;
  /** Error recovery mode (default: 'throw' — backward compatible) */
  errorRecovery?: 'throw' | 'warn' | 'silent';
  /** Max recursion depth to prevent stack overflow (default: 100) */
  maxRecursionDepth?: number;
  /** Additional allowed HTML tags for preserveRawHTML mode */
  allowedHTMLTags?: string[];
  /**
   * Allowed HTML attributes per tag for preserveRawHTML mode.
   * Key "*" applies to all tags. Key "tag" applies to specific tags.
   * Supports "data-*" wildcard prefix matching.
   * Example: { "*": ["id", "class"], "script": ["type", "src"] }
  /**
   * Allowed HTML attributes per tag for preserveRawHTML mode.
   * Key "*" applies to all tags. Key "tag" applies to specific tags.
   */
  allowedAttributes?: Record<string, string[]>;
  /** Script types to allow in preserveRawHTML mode (e.g., ["importmap", "module"]). Empty = strip all scripts. */
  allowedScriptTypes?: string[];
  /** When true, detect HTML documents (<!DOCTYPE or <html>) and render only body content through md2html, re-wrapping with original structure. Prevents sanitize-html from closing structural tags prematurely. */
  wrapHtmlDocument?: boolean;
}


/** Default allowed HTML tags for preserveRawHTML mode */
export const defaultAllowedHTMLTags = [
  'img', 'style', 'div', 'span', 'section', 'article',
  'aside', 'header', 'footer', 'nav', 'main', 'figure',
  'figcaption', 'details', 'summary', 'mark', 'time',
  'video', 'audio', 'source', 'iframe', 'embed'
];

/** Scope hierarchy values for data-md-scope */
export type ScopeValue =
  | 'root'
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'list-item'
  | 'image'
  | 'code'
  | 'strong'
  | 'emphasis'
  | 'link'
  | 'container';

/** Maps ContentNodeType to ScopeValue */
export const nodeTypeToScope: Record<ContentNodeType, ScopeValue> = {
  'text': 'root',
  'heading': 'heading',
  'paragraph': 'paragraph',
  'list': 'list',
  'list-item': 'list-item',
  'image': 'image',
  'code': 'code',
  'container': 'container',
  'strong': 'strong',
  'emphasis': 'emphasis',
  'link': 'link',
};
