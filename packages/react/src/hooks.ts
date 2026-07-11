import type { CompiledStagecutVideo } from "@stage-cut/core";
import { useMemo, useSyncExternalStore } from "react";
import { createStagecutPlayerController, type StagecutPlayerService } from "./StagecutPlayerService";
import type { StagecutPlayerPlaybackState, StagecutPlayerState } from "./types";

export function useStagecutPlayerController(video: CompiledStagecutVideo): StagecutPlayerService {
  return useMemo(() => createStagecutPlayerController(video), [video]);
}

function arePlayerStatesEqual(current: StagecutPlayerState, next: StagecutPlayerState): boolean {
  return (
    current.activeSceneId === next.activeSceneId &&
    current.currentFrame === next.currentFrame &&
    current.durationInFrames === next.durationInFrames &&
    current.isReady === next.isReady &&
    current.lastError === next.lastError &&
    current.status === next.status
  );
}

function createPlayerStateSnapshotReader(controller: StagecutPlayerService): () => StagecutPlayerState {
  let snapshot = controller.getState();

  return () => {
    const nextSnapshot = controller.getState();
    if (arePlayerStatesEqual(snapshot, nextSnapshot)) {
      return snapshot;
    }

    snapshot = nextSnapshot;
    return snapshot;
  };
}

function arePlaybackStatesEqual(current: StagecutPlayerPlaybackState, next: StagecutPlayerPlaybackState): boolean {
  return (
    current.durationInFrames === next.durationInFrames &&
    current.isReady === next.isReady &&
    current.lastError === next.lastError &&
    current.status === next.status
  );
}

function createPlaybackStateSnapshotReader(controller: StagecutPlayerService): () => StagecutPlayerPlaybackState {
  let snapshot = controller.getPlaybackState();

  return () => {
    const nextSnapshot = controller.getPlaybackState();
    if (arePlaybackStatesEqual(snapshot, nextSnapshot)) {
      return snapshot;
    }

    snapshot = nextSnapshot;
    return snapshot;
  };
}

export function useStagecutPlayerState(controller: StagecutPlayerService): StagecutPlayerState {
  const getSnapshot = useMemo(() => createPlayerStateSnapshotReader(controller), [controller]);

  return useSyncExternalStore(controller.subscribe.bind(controller), getSnapshot, getSnapshot);
}

export function useStagecutPlayerPlaybackState(controller: StagecutPlayerService): StagecutPlayerPlaybackState {
  const getSnapshot = useMemo(() => createPlaybackStateSnapshotReader(controller), [controller]);

  return useSyncExternalStore(controller.subscribePlayback.bind(controller), getSnapshot, getSnapshot);
}
