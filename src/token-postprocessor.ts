/**
 * Token Postprocessor
 *
 * Single responsibility: Transform the flat array of marked tokens into
 * a structured tree. Currently handles collapsing HTML comment markers
 * (from container block preprocessing) into structured `containerBlock` tokens.
 *
 * This is the third stage in the parsing pipeline (after lexing).
 */

export interface TokenPostprocessor {
  /** Name identifier for logging/debugging */
  readonly name: string;
  /** Transform an array of tokens into an array of (possibly restructured) tokens */
  process(tokens: unknown[]): unknown[];
}

// ─── Container Block Postprocessor ────────────────────────────────────────────

/**
 * Collapses `<!-- md-container:... -->` and `<!-- /md-container -->` comment
 * markers into nested `containerBlock` tokens with proper parent-child structure.
 *
 * Handles nesting depth up to any reasonable limit (depends on stack memory).
 */
export class ContainerBlockPostprocessor implements TokenPostprocessor {
  readonly name = 'container-blocks';

  process(tokens: unknown[]): unknown[] {
    const result: unknown[] = [];
    const stack: { specifier: string; tokens: unknown[] }[] = [];

    for (const token of tokens) {
      const t = token as Record<string, unknown>;

      // Only inspect 'html' type tokens for container markers
      if (t.type === 'html') {
        const raw = (t.raw as string).trim();
        const openMatch = raw.match(/^<!--\s*md-container:\s*(\S+)\s*-->$/);
        const closeMatch = raw.match(/^<!--\s*\/md-container\s*-->$/);

        if (openMatch) {
          // Start a new container
          stack.push({
            specifier: openMatch[1],
            tokens: []
          });
          continue;
        }

        if (closeMatch) {
          if (stack.length === 0) {
            // Unmatched closing fence — skip
            continue;
          }
          const container = stack.pop()!;
          // Recursively process inner tokens for any nested containers
          const processedInner = this.process(container.tokens);
          const containerToken = {
            type: 'containerBlock',
            specifier: container.specifier,
            tokens: processedInner
          };

          if (stack.length > 0) {
            stack[stack.length - 1].tokens.push(containerToken);
          } else {
            result.push(containerToken);
          }
          continue;
        }
      }

      // Not a container marker — add to current context
      if (stack.length > 0) {
        stack[stack.length - 1].tokens.push(token);
      } else {
        result.push(token);
      }
    }

    return result;
  }
}

// ─── Composite Token Postprocessor (Chain of Responsibility) ──────────────────

/**
 * Sequentially applies multiple postprocessors to the token array.
 */
export class CompositeTokenPostprocessor implements TokenPostprocessor {
  readonly name = 'composite';
  private processors: TokenPostprocessor[] = [];

  constructor(processors?: TokenPostprocessor[]) {
    if (processors) {
      this.processors = [...processors];
    }
  }

  /** Add a postprocessor to the chain. Returns `this` for fluent API. */
  add(processor: TokenPostprocessor): this {
    this.processors.push(processor);
    return this;
  }

  /** Remove a postprocessor by name. */
  remove(name: string): void {
    this.processors = this.processors.filter(p => p.name !== name);
  }

  /** Get the list of registered postprocessors. */
  getProcessors(): ReadonlyArray<TokenPostprocessor> {
    return [...this.processors];
  }

  process(tokens: unknown[]): unknown[] {
    let result = tokens;
    for (const processor of this.processors) {
      result = processor.process(result);
    }
    return result;
  }
}

// ─── Default Instance ─────────────────────────────────────────────────────────

/** Default postprocessor chain with the built-in container block support. */
export function createDefaultPostprocessor(): CompositeTokenPostprocessor {
  return new CompositeTokenPostprocessor([
    new ContainerBlockPostprocessor()
  ]);
}
