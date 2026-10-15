import type { ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { useDelayRender } from "remotion";

export interface StagecutResourceProps<T> {
  /** Stable identity of the source. Change this to load a different resource. */
  id: string;
  load: (signal: AbortSignal) => Promise<T>;
  dispose?: (value: T) => void;
  children: (value: T) => ReactNode;
}

function Resource<T>({ id, load, dispose, children }: StagecutResourceProps<T>) {
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [state, setState] = useState<{ value: T } | null>(null);
  // A resource is identified by id, independently of per-frame callback identities.
  const source = useRef({ load, dispose });
  const gate = useRef<number | null>(null);
  const release = useRef(() => {
    if (gate.current !== null) {
      continueRender(gate.current);
      gate.current = null;
    }
  });
  useLayoutEffect(() => {
    gate.current = delayRender(`Stagecut resource: ${id}`);
    const abort = new AbortController();
    let loaded: { value: T } | null = null;
    Promise.resolve()
      .then(() => source.current.load(abort.signal))
      .then((value) => {
        if (abort.signal.aborted) {
          source.current.dispose?.(value);
          return;
        }
        loaded = { value };
        setState(loaded);
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[stagecut-resource] ${JSON.stringify({ event: "load-error", id, message })}`);
        cancelRender(new Error(`Stagecut resource "${id}": ${message}`));
      });
    return () => {
      abort.abort();
      if (loaded) source.current.dispose?.(loaded.value);
      release.current();
    };
  }, [cancelRender, delayRender, id]);
  // Release after consumers have mounted and run their layout effects (e.g. GPU upload).
  useLayoutEffect(() => {
    if (state) release.current();
  }, [state]);
  return state ? children(state.value) : null;
}

/** Resource readiness shared by browser preview and offline rendering. */
export function StagecutResource<T>(props: StagecutResourceProps<T>) {
  return <Resource key={props.id} {...props} />;
}
