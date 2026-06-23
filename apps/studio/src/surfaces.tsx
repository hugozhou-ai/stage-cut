import type { FrameRenderContext, SurfaceComponentMap } from "@stagecut/react";

type WorkspaceShellProps = {
  caption?: string;
  status?: string;
} & FrameRenderContext;

type AgentDialogProps = {
  prompt?: string;
  response?: string;
} & FrameRenderContext;

type FileReviewProps = {
  files?: string;
  verdict?: string;
} & FrameRenderContext;

export function WorkspaceShellSurface({ caption, progress, status }: WorkspaceShellProps) {
  return (
    <div className="surface surface-workspace">
      <div className="workspace-topbar">
        <span />
        <span />
        <span />
        <strong>Stagecut Studio</strong>
      </div>
      <div className="workspace-grid">
        <div className="workspace-panel primary">
          <p>{caption}</p>
          <h2>DOM surfaces become video frames.</h2>
        </div>
        <div className="workspace-panel secondary">
          <small>Status</small>
          <strong>{status}</strong>
          <div className="progress-track">
            <span style={{ width: `${Math.max(14, progress * 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AgentDialogSurface({ progress, prompt, response }: AgentDialogProps) {
  return (
    <div className="surface surface-agent">
      <div className="agent-card" style={{ transform: `translateY(${(1 - progress) * 14}px)` }}>
        <span className="surface-label">Agent handoff</span>
        <h2>{prompt}</h2>
        <p>{response}</p>
        <div className="agent-steps">
          <span>Project JSON</span>
          <span>Surfaces</span>
          <span>Preview</span>
          <span>Prompt</span>
        </div>
      </div>
    </div>
  );
}

export function FileReviewSurface({ files, localFrame, verdict }: FileReviewProps) {
  return (
    <div className="surface surface-review">
      <div className="review-window">
        <div className="review-header">
          <strong>Implementation handoff</strong>
          <span>frame {localFrame}</span>
        </div>
        <div className="review-body">
          <div>
            <small>Generated structure</small>
            <h2>{files}</h2>
          </div>
          <div className="review-verdict">{verdict}</div>
        </div>
      </div>
    </div>
  );
}

export const surfaceComponents = {
  "agent-dialog": AgentDialogSurface,
  "file-review": FileReviewSurface,
  "workspace-shell": WorkspaceShellSurface,
} satisfies SurfaceComponentMap;
