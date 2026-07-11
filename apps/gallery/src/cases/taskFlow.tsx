import type { SurfaceComponentProps } from "@stagecut/react";
import type { CSSProperties } from "react";
import { GalleryIcon, type GalleryIconName } from "../icons";
import { easeOutCubic, mix, number, text } from "./math";

type Agent = {
  accent: string;
  icon: GalleryIconName;
  label: string;
  message: string;
  role: string;
  x: number;
};

const agents: Agent[] = [
  {
    accent: "#6d7ff5",
    icon: "brain",
    label: "Research",
    message: "Audience insights are ready.",
    role: "Market insights",
    x: 260,
  },
  {
    accent: "#6d7ff5",
    icon: "code",
    label: "Planning",
    message: "The rollout plan is ready.",
    role: "Project strategy",
    x: 570,
  },
  {
    accent: "#6d7ff5",
    icon: "image",
    label: "Design",
    message: "The visual direction is ready.",
    role: "Creative direction",
    x: 870,
  },
  {
    accent: "#6d7ff5",
    icon: "workflow",
    label: "Launch",
    message: "The milestones are aligned.",
    role: "Go-to-market",
    x: 1180,
  },
];

const prompt = "Plan a polished product launch";
const source = { x: 720, y: 280 };
const branchY = 500;

function pathFor(agent: Agent): string {
  const direction = agent.x < source.x ? -1 : 1;
  const spread = Math.abs(agent.x - source.x);
  const firstControlX = source.x + direction * Math.min(42, spread * 0.2);
  return `M ${source.x} ${source.y + 48} C ${firstControlX} 410, ${agent.x} ${410 + spread * 0.08}, ${agent.x} ${branchY}`;
}

function pointOnPath(agent: Agent, progress: number): { x: number; y: number } {
  const value = easeOutCubic(progress);
  const inverse = 1 - value;
  const direction = agent.x < source.x ? -1 : 1;
  const spread = Math.abs(agent.x - source.x);
  const firstControl = { x: source.x + direction * Math.min(42, spread * 0.2), y: 410 };
  const secondControl = { x: agent.x, y: 410 + spread * 0.08 };
  return {
    x:
      inverse ** 3 * source.x +
      3 * inverse ** 2 * value * firstControl.x +
      3 * inverse * value ** 2 * secondControl.x +
      value ** 3 * agent.x,
    y:
      inverse ** 3 * (source.y + 48) +
      3 * inverse ** 2 * value * firstControl.y +
      3 * inverse * value ** 2 * secondControl.y +
      value ** 3 * branchY,
  };
}

function AgentNode({
  agent,
  messagePlacement,
  onSelect,
  reveal,
  selected,
  showMessage,
}: {
  agent: Agent;
  messagePlacement: "below" | "left" | "right";
  onSelect?: () => void;
  reveal: number;
  selected: boolean;
  showMessage: boolean;
}) {
  const progress = easeOutCubic(reveal);
  const messageOffset = showMessage ? 0 : 10;
  const messageTransform =
    messagePlacement === "below" ? `translate(-50%, ${messageOffset}px)` : `translateY(${messageOffset}px)`;
  return (
    <button
      aria-label={`Inspect ${agent.label} workstream`}
      aria-pressed={selected}
      className={`task-agent ${selected ? "selected" : ""}`}
      disabled={reveal <= 0}
      onClick={onSelect}
      style={
        {
          "--agent-accent": agent.accent,
          left: agent.x,
          opacity: progress,
          transform: `translate(-50%, ${mix(28, 0, progress)}px) scale(${mix(0.74, 1, progress)})`,
        } as CSSProperties
      }
      type="button"
    >
      <div className="task-agent-orbit">
        <span>
          <GalleryIcon name={agent.icon} size={28} />
        </span>
      </div>
      <strong>{agent.label}</strong>
      <small>{agent.role}</small>
      <div
        className={`task-message task-message-${messagePlacement}`}
        style={{ opacity: showMessage ? 1 : 0, transform: messageTransform }}
      >
        {agent.message}
      </div>
    </button>
  );
}

export function TaskFlowSurface({
  context,
  input,
  onAction,
  selectedAgent,
}: SurfaceComponentProps & {
  onAction?: (action: string, value?: string) => void;
  selectedAgent?: string;
}) {
  const phase = text(input, "phase", "typing");
  const activeAgent = number(input, "activeAgent", -1);
  const visibleAgents = number(input, "visibleAgents", 0);
  const progress = context.progress;
  const typedCharacters = phase === "typing" ? Math.round(prompt.length * easeOutCubic(progress)) : prompt.length;
  const lineProgress = phase === "typing" ? 0 : phase === "branches" ? easeOutCubic(progress) : 1;

  return (
    <div className="case-surface task-flow-surface">
      <div className="task-aurora" />
      <div className="case-kicker">CROSS-FUNCTIONAL PROJECT FLOW</div>
      <div className="task-prompt">
        <span>{prompt.slice(0, typedCharacters)}</span>
        <i className="typing-caret" />
        <b>
          <GalleryIcon name="command" size={20} />
        </b>
      </div>
      <div className="task-source-dot">
        <i />
      </div>
      <svg aria-hidden="true" className="task-connectors" viewBox="0 0 1440 900">
        <defs>
          <filter height="160%" id="line-glow" width="160%" x="-30%" y="-30%">
            <feGaussianBlur result="blur" stdDeviation="4" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {agents.map((agent, index) => (
            <linearGradient id={`agent-line-${index}`} key={agent.label} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#b8bcc8" />
              <stop offset="1" stopColor={agent.accent} />
            </linearGradient>
          ))}
        </defs>
        {agents.map((agent, index) => {
          const isTraveling = phase === "dispatch" && index === activeAgent;
          const completed = phase === "agents" || phase === "messages" || index < activeAgent;
          const travel = isTraveling ? easeOutCubic(progress) : completed ? 1 : 0;
          const flowPoint = pointOnPath(agent, travel);
          return (
            <g filter="url(#line-glow)" key={agent.label}>
              <path
                d={pathFor(agent)}
                fill="none"
                pathLength={1}
                stroke={`url(#agent-line-${index})`}
                strokeDasharray="1"
                strokeDashoffset={1 - lineProgress}
                strokeLinecap="round"
                strokeWidth="2"
              />
              {travel > 0 ? <circle cx={flowPoint.x} cy={flowPoint.y} fill={agent.accent} r="8" /> : null}
              <circle
                cx={agent.x}
                cy={branchY}
                fill={agent.accent}
                opacity={completed || isTraveling ? 1 : 0.18}
                r="5"
              />
            </g>
          );
        })}
      </svg>
      {agents.map((agent, index) => {
        const entering = phase === "agents" && index === visibleAgents - 1;
        const isVisible = index < visibleAgents;
        return (
          <AgentNode
            agent={agent}
            key={agent.label}
            messagePlacement={index === 0 ? "left" : index === agents.length - 1 ? "right" : "below"}
            onSelect={() => onAction?.("agent", agent.label)}
            reveal={isVisible ? (entering ? progress : 1) : 0}
            selected={selectedAgent === agent.label}
            showMessage={phase === "messages" && index < Math.ceil(progress * agents.length)}
          />
        );
      })}
    </div>
  );
}
