/**
 * Markdown Preprocessor
 *
 * Single responsibility: Transform markdown text before it reaches the lexer.
 * Currently handles `:::` container block syntax conversion to HTML comments.
 *
 * This is the first stage in the parsing pipeline.
 *
 * Extensibility: Additional preprocessors can be composed via the
 * CompositePipeline pattern (see composite-pipeline.ts).
 */

export interface Preprocessor {
  /** Name identifier for logging/debugging */
  readonly name: string;
  /** Transform the markdown before lexing */
  process(markdown: string): string;
}

// ─── Container Block Preprocessor ─────────────────────────────────────────────

/**
 * Converts `:::tag#id.class` container syntax into HTML comment markers
 * that marked will preserve as HTML tokens, without affecting markdown parsing
 * of the inner content.
 *
 * Example:
 *   :::section#header
 *   # Heading inside container
 *   Some text
 *   :::
 *
 * Becomes:
 *   <!-- md-container:section#header -->
 *   # Heading inside container
 *   Some text
 *   <!-- /md-container -->
 */
export class ContainerBlockPreprocessor implements Preprocessor {
  readonly name = 'container-blocks';

  process(markdown: string): string {
    return markdown.replace(/^:::(?:(\w+(?:[.#][\w-]+)*)\s*)?$/gm, (_match, specifier) => {
      if (!specifier) {
        // Closing fence :::
        return '<!-- /md-container -->';
      }
      // Normalize: if no tag name given, default to "div"
      const normalized = specifier.match(/^\w/) ? specifier : `div${specifier}`;
      return `<!-- md-container:${normalized} -->`;
    });
  }
}

// ─── Composite Preprocessor (Chain of Responsibility) ─────────────────────────

/**
 * Sequentially applies multiple preprocessors to the markdown.
 * Each preprocessor's output becomes the next one's input.
 *
 * This follows the Chain of Responsibility pattern — you can add
 * new preprocessors without modifying existing code.
 */
export class CompositePreprocessor implements Preprocessor {
  readonly name = 'composite';
  private processors: Preprocessor[] = [];

  constructor(processors?: Preprocessor[]) {
    if (processors) {
      this.processors = [...processors];
    }
  }

  /** Add a preprocessor to the chain. Returns `this` for fluent API. */
  add(processor: Preprocessor): this {
    this.processors.push(processor);
    return this;
  }

  /** Remove a preprocessor by name. */
  remove(name: string): void {
    this.processors = this.processors.filter(p => p.name !== name);
  }

  /** Get the list of registered preprocessors. */
  getProcessors(): ReadonlyArray<Preprocessor> {
    return [...this.processors];
  }

  process(markdown: string): string {
    let result = markdown;
    for (const processor of this.processors) {
      result = processor.process(result);
    }
    return result;
  }
}

// ─── Default Instance ─────────────────────────────────────────────────────────

/** Default preprocessor chain with the built-in container block support. */
export function createDefaultPreprocessor(): CompositePreprocessor {
  return new CompositePreprocessor([
    new ContainerBlockPreprocessor()
  ]);
}
