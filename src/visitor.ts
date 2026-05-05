import { ContentNode } from './types.js';

/**
 * Visitor interface for traversing/walking a ContentNode AST.
 *
 * Implement this interface to inspect, collect, or transform nodes.
 * Each method returns a ContentNode or null — returning null removes the node.
 *
 * Use cases:
 *  - Collect all images for preloading
 *  - Transform link URLs
 *  - Validate AST structure
 *  - Extract headings for ToC
 *  - Inject attributes
 */
export interface NodeVisitor {
  /** Called when entering a node, before visiting its children. */
  enter?(node: ContentNode, parent: ContentNode | null, depth: number): ContentNode | null;
  /** Called after visiting all children of the node. */
  exit?(node: ContentNode, parent: ContentNode | null, depth: number): ContentNode | null;
}

/**
 * Walk a ContentNode tree, applying a visitor at each node.
 * Returns a new tree (immutable) — does not mutate the original.
 */
export function walkTree(root: ContentNode, visitor: NodeVisitor): ContentNode {
  return walkNode(root, null, 0, visitor);
}

function walkNode(
  node: ContentNode,
  parent: ContentNode | null,
  depth: number,
  visitor: NodeVisitor
): ContentNode {
  // Enter phase
  let processed = visitor.enter ? visitor.enter(node, parent, depth) : node;
  if (processed === null) return null as unknown as ContentNode;

  // Recursively walk children
  if (processed.children && processed.children.length > 0) {
    processed = {
      ...processed,
      children: processed.children
        .map(child => walkNode(child, processed, depth + 1, visitor))
        .filter(Boolean) as ContentNode[]
    };
  }

  // Exit phase
  processed = visitor.exit ? visitor.exit(processed, parent, depth) : processed;
  if (processed === null) return null as unknown as ContentNode;

  return processed;
}

/**
 * Walk a ContentNode tree and collect results from the visitor.
 * The collector function is called for each node and returns a value or null.
 */
export function collectFromTree<T>(
  root: ContentNode,
  collector: (node: ContentNode, parent: ContentNode | null, depth: number) => T | null
): T[] {
  const results: T[] = [];
  collectNode(root, null, 0, collector, results);
  return results;
}

function collectNode<T>(
  node: ContentNode,
  parent: ContentNode | null,
  depth: number,
  collector: (node: ContentNode, parent: ContentNode | null, depth: number) => T | null,
  results: T[]
): void {
  const result = collector(node, parent, depth);
  if (result !== null) {
    results.push(result);
  }
  if (node.children) {
    for (const child of node.children) {
      collectNode(child, node, depth + 1, collector, results);
    }
  }
}

/**
 * Built-in visitor: collect all nodes of a specific type.
 */
export function collectByType(root: ContentNode, type: string): ContentNode[] {
  return collectFromTree(root, (node) => 
    node.type === type ? node : null
  );
}

/**
 * Built-in visitor: collect all headings with their levels.
 */
export function collectHeadings(root: ContentNode): Array<{ level: string; text: string; id?: string }> {
  return collectFromTree(root, (node) => {
    if (node.type === 'heading') {
      return {
        level: (node.attributes?.level as string) || '2',
        text: node.content || '',
        id: node.attributes?.id as string | undefined
      };
    }
    return null;
  });
}

/**
 * Built-in visitor: collect all images with their src/alt.
 */
export function collectImages(root: ContentNode): Array<{ src: string; alt: string }> {
  return collectFromTree(root, (node) => {
    if (node.type === 'image') {
      return { src: node.src || '', alt: node.alt || '' };
    }
    return null;
  });
}
