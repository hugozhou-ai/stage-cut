import type { SurfaceComponentProps } from "@stagecut/react-player";
import { type CSSProperties, useState } from "react";
import { GalleryIcon, type GalleryIconName } from "../icons";
import { easeInOutCubic, easeOutCubic, mix, text } from "./math";

type PaletteRow = {
  detail?: string;
  icon: GalleryIconName;
  group: string;
  id: string;
  label: string;
  tint: string;
};

const rows: PaletteRow[] = [
  {
    detail: "Outline launch milestones",
    icon: "brain",
    group: "Sessions",
    id: "launch-planning",
    label: "Launch Planning",
    tint: "#6d7ff5",
  },
  {
    detail: "Organize stakeholder feedback",
    icon: "code",
    group: "Sessions",
    id: "campaign-review",
    label: "Campaign Review",
    tint: "#6d7ff5",
  },
  { group: "Files", icon: "folder", id: "campaign", label: "Spring Campaign", tint: "#6d7ff5" },
  { group: "Files", icon: "file-image", id: "hero", label: "hero-image.jpg", tint: "#6d7ff5" },
  { group: "Issues", icon: "circle-check", id: "issue", label: "Finalize launch page", tint: "#6d7ff5" },
  {
    detail: "Schedule recurring reviews",
    icon: "timer",
    group: "Apps",
    id: "automation",
    label: "Review Schedule",
    tint: "#6d7ff5",
  },
  {
    detail: "Manage reusable brand assets",
    icon: "pen",
    group: "Apps",
    id: "prototype",
    label: "Brand Kit",
    tint: "#6d7ff5",
  },
  {
    detail: "Create campaign visuals",
    icon: "sparkles",
    group: "Apps",
    id: "canvas",
    label: "Visual Canvas",
    tint: "#6d7ff5",
  },
  {
    detail: "Weekly market highlights",
    icon: "newspaper",
    group: "Apps",
    id: "radar",
    label: "Market Briefs",
    tint: "#6d7ff5",
  },
];

const prompt = "Create a polished launch visual for the spring campaign";

function Palette({
  onAction,
  phase,
  progress,
  selectedReference,
}: {
  onAction?: (action: string, value?: string) => void;
  phase: string;
  progress: number;
  selectedReference?: string;
}) {
  const selected = phase === "select" || phase === "complete" || selectedReference === "canvas";
  const scrollProgress = phase === "palette" ? easeInOutCubic(progress) : selected ? 1 : 0;
  let previousGroup = "";
  return (
    <section className="reference-palette">
      <header>
        <button className="active" type="button">
          All
        </button>
        <button type="button">Sessions</button>
        <button type="button">Files</button>
        <button type="button">Issues</button>
        <button type="button">Apps</button>
        <kbd>esc</kbd>
      </header>
      <div className="palette-viewport">
        <div className="palette-content" style={{ transform: `translateY(${-mix(0, 315, scrollProgress)}px)` }}>
          {rows.map((row) => {
            const showGroup = row.group !== previousGroup;
            previousGroup = row.group;
            return (
              <div className="palette-row-wrap" key={row.id}>
                {showGroup ? <h4>{row.group}</h4> : null}
                <button
                  aria-pressed={selectedReference === row.id || (selected && row.id === "canvas")}
                  className={`palette-row ${selectedReference === row.id || (selected && row.id === "canvas") ? "selected" : ""}`}
                  onClick={() => onAction?.("reference", row.id)}
                  type="button"
                >
                  <i style={{ "--icon-tint": row.tint } as CSSProperties}>
                    <GalleryIcon name={row.icon} size={18} />
                  </i>
                  <div>
                    <strong>{row.label}</strong>
                    {row.detail ? <small>{row.detail}</small> : null}
                  </div>
                  {row.id === "issue" ? <em>To run</em> : null}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <footer>
        <span>
          <GalleryIcon name="arrow-up-down" size={12} /> Navigate
        </span>
        <span>
          <GalleryIcon name="corner-down-left" size={12} /> Select
        </span>
        <b>Search references</b>
      </footer>
      {phase === "palette" && progress > 0.58 ? (
        <div className="palette-cursor" style={{ left: mix(620, 540, progress), top: mix(135, 245, progress) }}>
          <GalleryIcon name="pointer" size={28} />
        </div>
      ) : null}
    </section>
  );
}

function SuccessCanvas({ progress }: { progress: number }) {
  const reveal = easeOutCubic(progress);
  return (
    <div className="success-canvas" style={{ opacity: reveal }}>
      <div className="success-orbit orbit-one" />
      <div className="success-orbit orbit-two" />
      {Array.from({ length: 28 }, (_, index) => {
        const angle = index * 2.399;
        const radius = mix(30, 310, reveal) * (0.4 + (index % 7) / 10);
        return (
          <i
            // biome-ignore lint/suspicious/noArrayIndexKey: deterministic decorative particles
            key={index}
            style={{
              left: `calc(50% + ${Math.cos(angle) * radius}px)`,
              opacity: reveal * (0.35 + (index % 4) / 5),
              top: `calc(50% + ${Math.sin(angle) * radius}px)`,
            }}
          />
        );
      })}
      <div className="generated-art" style={{ transform: `translate(-50%, -50%) scale(${mix(0.72, 1, reveal)})` }}>
        <span>VISUAL CANVAS</span>
        <h3>
          SPRING
          <br />
          FORWARD
        </h3>
        <div className="art-tiles">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="success-caption">
        <i>
          <GalleryIcon name="check" size={16} />
        </i>
        <div>
          <strong>Visual created</strong>
          <small>Saved to Spring Campaign / Assets</small>
        </div>
      </div>
    </div>
  );
}

export function ApplicationDialogSurface({
  context,
  input,
  onAction,
  selectedReference,
}: SurfaceComponentProps & {
  onAction?: (action: string, value?: string) => void;
  selectedReference?: string;
}) {
  const phase = text(input, "phase", "enter");
  const progress = context.progress;
  const dialogEnter = phase === "enter" ? easeOutCubic(progress) : 1;
  const paletteVisible = phase === "palette" || phase === "select";
  const paletteEnter = phase === "palette" ? easeOutCubic(Math.min(1, progress * 2)) : paletteVisible ? 1 : 0;
  const typed =
    phase === "enter" ? 0 : phase === "mention" ? Math.round(prompt.length * easeOutCubic(progress)) : prompt.length;
  const [editedPrompt, setEditedPrompt] = useState<string>();

  return (
    <div className="case-surface application-dialog-surface">
      <div className="app-wallpaper">
        <i />
        <i />
        <i />
      </div>
      {phase === "complete" ? (
        <SuccessCanvas progress={progress} />
      ) : (
        <>
          {!paletteVisible ? (
            <div className="dialog-hero">
              <i>
                <GalleryIcon name="sparkles" size={40} />
              </i>
              <h2>What would you like to create?</h2>
              <p>Describe the result, then connect files, sessions, issues, or apps.</p>
            </div>
          ) : null}
          <section
            className="application-dialog"
            style={{
              opacity: dialogEnter,
              transform: `translate(-50%, -50%) translateY(${mix(28, 0, dialogEnter)}px) scale(${mix(0.9, 1, dialogEnter)})`,
            }}
          >
            <div className="dialog-input">
              <textarea
                aria-label="Creation prompt"
                className="dialog-prompt"
                onChange={(event) => {
                  setEditedPrompt(event.currentTarget.value);
                  onAction?.("edit-prompt", event.currentTarget.value);
                }}
                readOnly={onAction === undefined}
                rows={2}
                spellCheck={false}
                value={editedPrompt ?? prompt.slice(0, typed)}
              />
              <div className="dialog-toolbar">
                <button aria-label="Add reference" onClick={() => onAction?.("open-references")} type="button">
                  <GalleryIcon name="plus" size={18} />
                </button>
                <button aria-label="Mention" onClick={() => onAction?.("open-references")} type="button">
                  <GalleryIcon name="at-sign" size={18} />
                </button>
                <span />
                <button className="model" type="button">
                  Creative mode <GalleryIcon name="chevron-down" size={14} />
                </button>
                <button aria-label="Create visual" className="send" onClick={() => onAction?.("create")} type="button">
                  <GalleryIcon name="arrow-up-right" size={18} />
                </button>
              </div>
            </div>
            <footer>
              <span>
                <GalleryIcon name="folder" size={13} /> Spring Campaign
              </span>
              <span>
                <GalleryIcon name="pen" size={13} /> Brand Kit
              </span>
              <b>Visual Canvas</b>
            </footer>
          </section>
          {paletteVisible ? (
            <div
              className="palette-stage"
              style={{
                opacity: paletteEnter,
                transform: `translate(-50%, ${mix(-43, -50, paletteEnter)}%) scale(${mix(0.96, 1, paletteEnter)})`,
              }}
            >
              <Palette
                {...(onAction === undefined ? {} : { onAction })}
                phase={phase}
                progress={progress}
                {...(selectedReference === undefined ? {} : { selectedReference })}
              />
            </div>
          ) : null}
        </>
      )}
      <div className="dialog-stepper">
        {["Prompt", "Reference", "Select app", "Create"].map((label, index) => {
          const phaseIndex = ["enter", "mention", "palette", "select", "complete"].indexOf(phase);
          return (
            <span className={index <= phaseIndex ? "active" : ""} key={label}>
              <i>{index + 1}</i>
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
