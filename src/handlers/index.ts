/**
 * Handler barrel — auto-discovers and exports all built-in handlers.
 * To add a new handler, simply create a file in this directory and
 * add its export here. The registry will pick it up automatically.
 */

export type { TokenHandler, ParseContext } from './types.js';
export { TokenHandlerRegistry } from './registry.js';
export { HeadingHandler } from './heading-handler.js';
export { ParagraphHandler } from './paragraph-handler.js';
export { ListHandler } from './list-handler.js';
export { ImageHandler } from './image-handler.js';
export { CodeHandler } from './code-handler.js';
export { HrHandler } from './hr-handler.js';
export { BlockquoteHandler } from './blockquote-handler.js';
export { HtmlHandler } from './html-handler.js';
export { CatchAllHandler } from './catchall-handler.js';
export { FrontmatterHandler } from './frontmatter-handler.js';
export { ContainerBlockHandler } from './container-block-handler.js';

