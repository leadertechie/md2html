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
  styleOptions?: StyleConfig;
}

/**
 * v2: Extended PipelineConfig with raw HTML passthrough, slot hooks, and error recovery.
 */
export interface PipelineConfigV2 extends PipelineConfig {
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
