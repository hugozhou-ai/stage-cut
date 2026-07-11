import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  ArrowUpRight,
  AtSign,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  CircleCheckBig,
  Code2,
  Command,
  CornerDownLeft,
  FileImage,
  Folder,
  Image,
  Layers3,
  type LucideIcon,
  MessageSquareText,
  MousePointer2,
  Newspaper,
  PanelTop,
  Pause,
  PenTool,
  Play,
  Plus,
  Rocket,
  RotateCcw,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Sparkles,
  TimerReset,
  Workflow,
} from "lucide-react";

const icons = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up-down": ArrowUpDown,
  "arrow-up-right": ArrowUpRight,
  "at-sign": AtSign,
  bot: Bot,
  brain: BrainCircuit,
  check: Check,
  "chevron-down": ChevronDown,
  "circle-check": CircleCheckBig,
  code: Code2,
  command: Command,
  "corner-down-left": CornerDownLeft,
  "file-image": FileImage,
  folder: Folder,
  image: Image,
  layers: Layers3,
  message: MessageSquareText,
  pointer: MousePointer2,
  newspaper: Newspaper,
  panel: PanelTop,
  pause: Pause,
  pen: PenTool,
  play: Play,
  plus: Plus,
  rocket: Rocket,
  restart: RotateCcw,
  shield: ShieldCheck,
  "skip-back": SkipBack,
  "skip-forward": SkipForward,
  sparkles: Sparkles,
  timer: TimerReset,
  workflow: Workflow,
} as const satisfies Record<string, LucideIcon>;

export type GalleryIconName = keyof typeof icons;

export function GalleryIcon({
  className,
  name,
  size = 16,
}: {
  className?: string;
  name: GalleryIconName;
  size?: number;
}) {
  const Icon = icons[name];
  return <Icon aria-hidden="true" className={className} focusable="false" size={size} strokeWidth={1.8} />;
}
