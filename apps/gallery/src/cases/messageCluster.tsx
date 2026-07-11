import type { SurfaceComponentProps } from "@stagecut/react-player";
import type { CSSProperties } from "react";
import { GalleryIcon, type GalleryIconName } from "../icons";
import { easeInOutCubic, easeOutCubic, mix, text } from "./math";

type MessageCard = {
  accent: string;
  body: string;
  icon: GalleryIconName;
  source: string;
  time: string;
  title: string;
};

const cards: MessageCard[] = [
  {
    accent: "#6d7ff5",
    body: "Defined the campaign goals and prioritized the launch milestones.",
    icon: "brain",
    source: "Launch brief",
    time: "09:41",
    title: "Product",
  },
  {
    accent: "#6d7ff5",
    body: "Completed the visual direction and prepared the latest review set.",
    icon: "code",
    source: "Design review",
    time: "09:43",
    title: "Design",
  },
  {
    accent: "#6d7ff5",
    body: "The landing page and supporting materials are ready for review.",
    icon: "image",
    source: "Website",
    time: "09:44",
    title: "Web",
  },
  {
    accent: "#6d7ff5",
    body: "Confirmed owners, dates, and dependencies across the rollout.",
    icon: "workflow",
    source: "Launch plan",
    time: "09:46",
    title: "Operations",
  },
  {
    accent: "#6d7ff5",
    body: "Completed final checks across supported devices and regions.",
    icon: "shield",
    source: "Quality review",
    time: "09:48",
    title: "Quality",
  },
  {
    accent: "#6d7ff5",
    body: "Prepared the announcement copy and scheduled the campaign.",
    icon: "rocket",
    source: "Campaign schedule",
    time: "09:50",
    title: "Marketing",
  },
];

const scatter = [
  { delay: 0.12, rotate: -4, scale: 0.78, x: 250, y: 185 },
  { delay: 0.12, rotate: 4, scale: 0.78, x: 650, y: 185 },
  { delay: 0.24, rotate: 3, scale: 0.72, x: 290, y: 400 },
  { delay: 0.24, rotate: -3, scale: 0.72, x: 610, y: 400 },
  { delay: 0, rotate: -3, scale: 0.88, x: 360, y: 445 },
  { delay: 0, rotate: 3, scale: 0.88, x: 540, y: 445 },
];

const grid = [
  { x: 280, y: 225 },
  { x: 620, y: 225 },
  { x: 280, y: 400 },
  { x: 620, y: 400 },
  { x: 280, y: 575 },
  { x: 620, y: 575 },
];

const grouped = [
  { x: 280, y: 210 },
  { x: 620, y: 210 },
  { x: 280, y: 350 },
  { x: 620, y: 350 },
  { x: 280, y: 490 },
  { x: 620, y: 490 },
];

function Card({
  card,
  index,
  onSelect,
  phase,
  progress,
  selected,
}: {
  card: MessageCard;
  index: number;
  onSelect?: () => void;
  phase: string;
  progress: number;
  selected: boolean;
}) {
  const from = scatter[index] as (typeof scatter)[number];
  const entrance = phase === "scatter" ? easeOutCubic(progress * 1.8 - from.delay) : 1;
  const alignProgress = phase === "align" ? easeInOutCubic(progress) : phase === "scatter" ? 0 : 1;
  const groupedProgress = phase === "group" ? easeInOutCubic(progress) : phase === "menu" ? 1 : 0;
  const menuExit = phase === "menu" ? 1 - easeInOutCubic((progress - 0.72) / 0.28) : 1;
  const to = grid[index] as (typeof grid)[number];
  const group = grouped[index] as (typeof grouped)[number];
  const x = mix(mix(from.x, to.x, alignProgress), group.x, groupedProgress);
  const y = mix(mix(from.y, to.y, alignProgress), group.y, groupedProgress);
  const layoutScale = mix(from.scale, 0.82, alignProgress);
  const scale = mix(layoutScale * 0.9, layoutScale, entrance) * mix(1, 0.88, groupedProgress);
  const opacity = phase === "scatter" ? entrance : phase === "menu" ? (1 - easeOutCubic(progress)) * menuExit : 1;

  return (
    <button
      aria-label={`Inspect ${card.title} update`}
      aria-pressed={selected}
      className={`message-card ${selected ? "selected" : ""}`}
      onClick={onSelect}
      style={
        {
          "--card-accent": card.accent,
          height: mix(204, 132, groupedProgress),
          left: x,
          opacity,
          top: y,
          transform: `translate(-50%, -50%) rotate(${mix(from.rotate, 0, alignProgress)}deg) scale(${scale * (selected ? 1.08 : 1)})`,
          width: 360,
        } as CSSProperties
      }
      type="button"
    >
      <div className="message-avatar">
        <GalleryIcon name={card.icon} size={18} />
      </div>
      <div className="message-copy">
        <header>
          <strong>{card.title}</strong>
          <time>{card.time}</time>
        </header>
        <p style={{ opacity: 1 - groupedProgress }}>{card.body}</p>
        <footer style={{ opacity: 1 - groupedProgress }}>
          <GalleryIcon name="arrow-up-right" size={11} />
          {card.source}
        </footer>
      </div>
    </button>
  );
}

export function MessageClusterSurface({
  context,
  input,
  onAction,
  selectedCard,
}: SurfaceComponentProps & {
  onAction?: (action: string, value?: string) => void;
  selectedCard?: string;
}) {
  const phase = text(input, "phase", "scatter");
  const progress = context.progress;
  const menuExit = phase === "menu" ? 1 - easeInOutCubic((progress - 0.72) / 0.28) : 1;
  const grouping = phase === "group" ? easeInOutCubic(progress) : phase === "menu" ? menuExit : 0;
  const menuProgress = phase === "menu" ? easeOutCubic(progress) : 0;

  return (
    <div className="case-surface message-cluster-surface">
      <div className="cluster-grid" />
      <main className="cluster-canvas">
        <div className="message-group-panel group-left" style={{ opacity: grouping }}>
          <header>
            <span>Planning & creative</span>
            <b>3</b>
          </header>
        </div>
        <div className="message-group-panel group-right" style={{ opacity: grouping }}>
          <header>
            <span>Delivery & launch</span>
            <b>3</b>
          </header>
        </div>
        {cards.map((card, index) => (
          <Card
            card={card}
            index={index}
            key={card.title}
            onSelect={() => onAction?.("card", card.title)}
            phase={phase}
            progress={progress}
            selected={selectedCard === card.title}
          />
        ))}
        <div
          className="cluster-menu"
          style={{ opacity: menuProgress * menuExit, transform: `translateY(${mix(14, 0, menuProgress)}px)` }}
        >
          <button onClick={() => onAction?.("mark-read")} type="button">
            <i>
              <GalleryIcon name="check" size={14} />
            </i>{" "}
            Mark all as read
          </button>
          <button onClick={() => onAction?.("group")} type="button">
            <i>
              <GalleryIcon name="workflow" size={14} />
            </i>{" "}
            Group by project
          </button>
          <button onClick={() => onAction?.("overview")} type="button">
            <i>
              <GalleryIcon name="arrow-up-right" size={14} />
            </i>{" "}
            Open project overview
          </button>
        </div>
      </main>
    </div>
  );
}
