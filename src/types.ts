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
  | 'emphasis';

export interface ContentNode {
  type: ContentNodeType;
  content?: string;
  children?: ContentNode[];
  attributes?: Record<string, unknown>;
  className?: string;
  src?: string;
  alt?: string;
  ordered?: boolean;
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

export interface PipelineConfig {
  imagePathPrefix?: string;
  imageBaseUrl?: string;
  parseOptions?: ParseOptions;
  styleOptions?: StyleConfig;
}
