import type { StagecutParseResult, StagecutProjectDefinition } from "./types";
import { parseStagecutProject, StagecutValidationError } from "./validation";

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) {
      deepFreeze(nested);
    }
  }
  return value;
}

export function defineStagecutProject<const T extends StagecutProjectDefinition>(definition: T): Readonly<T> {
  return deepFreeze(parseStagecutProject(definition)) as Readonly<T>;
}

export function safeParseStagecutProject(input: unknown): StagecutParseResult {
  try {
    return { data: deepFreeze(parseStagecutProject(input)), success: true };
  } catch (error) {
    if (error instanceof StagecutValidationError) {
      return { error, success: false };
    }
    throw error;
  }
}

export function serializeStagecutProject(project: StagecutProjectDefinition): string {
  const parsed = parseStagecutProject(project);
  return `${JSON.stringify(parsed, null, 2)}\n`;
}

export { parseStagecutProject } from "./validation";
