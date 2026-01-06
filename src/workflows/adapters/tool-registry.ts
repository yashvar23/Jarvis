/**
 * Adapter: PieceToolRegistry over Zoya' ToolRegistry. The signatures align
 * almost 1:1; this file projects field names and unwraps the description for
 * the listing API.
 */

import type {
  PieceToolDescription,
  PieceToolRegistry,
} from "../zoya-pieces/types";
import type { ToolRegistry } from "../../actions/tools/registry";

export class ZoyaToolRegistryAdapter implements PieceToolRegistry {
  constructor(private readonly registry: ToolRegistry) {}

  has(name: string): boolean {
    return this.registry.has(name);
  }

  async execute(name: string, params: Record<string, unknown>): Promise<unknown> {
    return this.registry.execute(name, params);
  }

  describe(name: string): PieceToolDescription | null {
    const tool = this.registry.get(name);
    if (!tool) return null;
    return {
      name: tool.name,
      description: tool.description,
      category: tool.category,
      parameters: tool.parameters,
    };
  }

  listNames(category?: string): string[] {
    return this.registry.list(category).map((t) => t.name);
  }
}
