import type { StagecutProjectDefinition } from "@stagecut/core";
import type { SurfaceComponentMap, SurfaceRegistryForProject } from "./types";

export function defineSurfaceRegistry<const TProject extends StagecutProjectDefinition>(
  project: TProject,
  registry: SurfaceRegistryForProject<TProject>,
): SurfaceRegistryForProject<TProject> {
  const expectedIds = new Set(project.surfaces.map((surface) => surface.id));
  const actualIds = Object.keys(registry);
  const missingIds = [...expectedIds].filter((id) => !(id in registry));
  const extraIds = actualIds.filter((id) => !expectedIds.has(id));
  if (missingIds.length > 0 || extraIds.length > 0) {
    throw new Error(
      `Stagecut surface registry does not match project surfaces: ${JSON.stringify({ extraIds, missingIds })}`,
    );
  }
  return Object.freeze({ ...registry });
}

export function assertVideoSurfaceRegistry(videoSurfaceIds: readonly string[], registry: SurfaceComponentMap): void {
  const missingIds = videoSurfaceIds.filter((id) => !(id in registry));
  if (missingIds.length > 0) {
    throw new Error(`Stagecut player is missing registered surfaces: ${JSON.stringify({ missingIds })}`);
  }
}
