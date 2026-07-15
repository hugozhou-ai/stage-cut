import type { JsonObject } from "@stage-cut/core";
import type { SurfaceComponentProps } from "@stage-cut/react-player";
import {
  Check,
  Clock3,
  Download,
  FileJson,
  FileSpreadsheet,
  ImagePlus,
  Link2,
  Maximize2,
  Monitor,
  MousePointer2,
  PaintBucket,
  Scan,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  ZoomIn,
} from "lucide-react";
import type { ReactNode } from "react";
import beadGridCoverUrl from "../assets/bead-grid-og.png";
import { clamp, easeInOutCubic, easeOutCubic, mix } from "./math";

const FONT = "'Lexend Variable', 'PingFang SC', 'Microsoft YaHei', sans-serif";
const INK = "#24211d";
const MUTED = "#756f67";
const CARD = "#fffdf8";
const LINE = "#dcd2c3";
const ORANGE = "#f06434";
const GREEN = "#62ad78";
const PALETTE = [
  "#f7f1e3",
  "#f6d94a",
  "#f59c3d",
  "#ee6a5b",
  "#d94e76",
  "#f2a7bb",
  "#8d67ab",
  "#72a7c4",
  "#45aeb1",
  "#72be91",
  "#4d8c57",
  "#a5b85a",
  "#754c3b",
  "#9a9188",
  "#292827",
];

type Variant = "hook" | "generate" | "size" | "edit" | "zoom" | "materials" | "private" | "outro";

type PromoInput = JsonObject & { variant?: Variant };

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div style={{ alignItems: "center", color: light ? "#fff" : INK, display: "flex", fontFamily: FONT, gap: 14 }}>
      <div style={{ display: "grid", gap: 4, gridTemplateColumns: "repeat(2, 20px)", transform: "rotate(2deg)" }}>
        {[ORANGE, "#f6b84a", "#f6b84a", ORANGE].map((color, index) => (
          <div
            key={`${color}-${index < 2 ? "top" : "bottom"}`}
            style={{
              background: color,
              borderRadius: "50%",
              boxShadow: "inset 3px 3px rgba(255,255,255,.3)",
              height: 20,
              width: 20,
            }}
          />
        ))}
      </div>
      <strong style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-.06em" }}>豆格</strong>
      <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: ".16em", opacity: 0.62 }}>BEAD GRID</span>
    </div>
  );
}

function SceneFrame({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div
      style={{
        background: dark
          ? "radial-gradient(circle at 30% 10%, #493126 0%, #211c18 34%, #13110f 76%)"
          : "radial-gradient(circle at 12% 0%, #ffffff 0%, transparent 34%), #f5f0e6",
        color: dark ? "#fff" : INK,
        fontFamily: FONT,
        height: "100%",
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          backgroundImage: "radial-gradient(rgba(80,65,48,.14) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
          inset: 0,
          opacity: dark ? 0.08 : 0.42,
          position: "absolute",
        }}
      />
      {children}
    </div>
  );
}

function Kicker({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div
      style={{
        color: dark ? "#f7a270" : ORANGE,
        fontSize: 22,
        fontWeight: 900,
        letterSpacing: ".19em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function Heading({ children, dark = false, size = 66 }: { children: ReactNode; dark?: boolean; size?: number }) {
  return (
    <h2
      style={{
        color: dark ? "#fff" : INK,
        fontSize: size,
        fontWeight: 900,
        letterSpacing: "-.055em",
        lineHeight: 1.12,
        margin: "18px 0 0",
      }}
    >
      {children}
    </h2>
  );
}

function Caption({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p style={{ color: dark ? "#d7cec5" : MUTED, fontSize: 29, fontWeight: 600, lineHeight: 1.55, margin: "18px 0 0" }}>
      {children}
    </p>
  );
}

function TopCopy({
  children,
  dark = false,
  kicker,
  progress,
  title,
}: {
  children: ReactNode;
  dark?: boolean;
  kicker: string;
  progress: number;
  title: ReactNode;
}) {
  const enter = easeOutCubic(clamp(progress / 0.22));
  return (
    <div
      style={{
        left: 68,
        opacity: enter,
        position: "absolute",
        right: 68,
        top: 120,
        transform: `translateY(${mix(34, 0, enter)}px)`,
        zIndex: 10,
      }}
    >
      <Kicker dark={dark}>{kicker}</Kicker>
      <Heading dark={dark}>{title}</Heading>
      <Caption dark={dark}>{children}</Caption>
    </div>
  );
}

function BottomPill({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div
      style={{
        alignItems: "center",
        background: dark ? "rgba(255,255,255,.1)" : "rgba(255,253,248,.88)",
        border: `1px solid ${dark ? "rgba(255,255,255,.14)" : LINE}`,
        borderRadius: 999,
        bottom: 76,
        boxShadow: "0 18px 50px rgba(58,43,30,.12)",
        color: dark ? "#fff" : INK,
        display: "flex",
        fontSize: 22,
        fontWeight: 800,
        gap: 12,
        left: "50%",
        padding: "16px 26px",
        position: "absolute",
        transform: "translateX(-50%)",
        whiteSpace: "nowrap",
        zIndex: 12,
      }}
    >
      {children}
    </div>
  );
}

function heartColor(x: number, y: number, width: number, height: number): string | null {
  const px = (x / width) * 2 - 1;
  const py = (y / height) * 2 - 0.28;
  const heart = (px * px + py * py - 0.58) ** 3 - px * px * py ** 3 < 0;
  if (!heart) return null;
  if (py < -0.34 && px < 0.08) return "#f2a7bb";
  if (py > 0.35) return "#d94e76";
  return "#ee6a5b";
}

function BeadPattern({
  progress = 1,
  selected = false,
  size = 22,
  zoom = 1,
}: {
  progress?: number;
  selected?: boolean;
  size?: number;
  zoom?: number;
}) {
  const cells = Array.from({ length: size * size }, (_, index) => ({ x: index % size, y: Math.floor(index / size) }));
  return (
    <div
      style={{
        background: "#f8f3e9",
        border: `1px solid ${LINE}`,
        boxShadow: "0 20px 44px rgba(55,42,28,.14)",
        display: "grid",
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        height: 660 * zoom,
        overflow: "hidden",
        position: "relative",
        width: 660 * zoom,
      }}
    >
      {cells.map(({ x, y }) => {
        const color = heartColor(x, y, size, size);
        const order = (y * size + x) / (size * size);
        const visible = color && progress >= order * 0.84;
        const isSelected = selected && x >= 5 && x <= 15 && y >= 7 && y <= 15 && color;
        return (
          <div
            key={`${x}-${y}`}
            style={{
              alignItems: "center",
              borderBottom: "1px solid rgba(85,70,50,.11)",
              borderRight: "1px solid rgba(85,70,50,.11)",
              display: "flex",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {visible && (
              <div
                style={{
                  background: color,
                  borderRadius: "50%",
                  boxShadow: "inset 3px 3px rgba(255,255,255,.28)",
                  height: "80%",
                  transform: `scale(${easeOutCubic(clamp((progress - order * 0.84) * 8))})`,
                  width: "80%",
                }}
              />
            )}
            {isSelected && (
              <div
                style={{
                  background: "rgba(240,100,52,.18)",
                  border: "2px dashed #f06434",
                  inset: 1,
                  position: "absolute",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function WindowChrome({ children, title = "豆格 · 拼豆图纸编辑器" }: { children: ReactNode; title?: string }) {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${LINE}`,
        borderRadius: 28,
        boxShadow: "0 36px 90px rgba(54,41,28,.18)",
        overflow: "hidden",
        width: 944,
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "#faf6ee",
          borderBottom: `1px solid ${LINE}`,
          display: "flex",
          gap: 10,
          height: 66,
          padding: "0 24px",
        }}
      >
        {["#ee6a5b", "#f6b84a", "#72be91"].map((color) => (
          <i key={color} style={{ background: color, borderRadius: "50%", height: 13, width: 13 }} />
        ))}
        <span style={{ color: MUTED, fontSize: 17, fontWeight: 700, marginLeft: 10 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function HookScene({ progress }: { progress: number }) {
  const enter = easeOutCubic(clamp(progress / 0.38));
  const cover = easeOutCubic(clamp((progress - 0.12) / 0.55));
  return (
    <SceneFrame>
      <div style={{ left: 66, position: "absolute", top: 90 }}>
        <Logo />
      </div>
      <div
        style={{
          left: 68,
          opacity: enter,
          position: "absolute",
          right: 68,
          top: 250,
          transform: `translateY(${mix(48, 0, enter)}px)`,
        }}
      >
        <Kicker>FROM PHOTO TO BEADS</Kicker>
        <h1 style={{ fontSize: 88, fontWeight: 900, letterSpacing: "-.065em", lineHeight: 1.04, margin: "24px 0 0" }}>
          一张图片，
          <br />
          <span style={{ color: ORANGE }}>变成可制作的拼豆图纸。</span>
        </h1>
        <Caption>上传、生成、编辑、统计、导出，一站完成。</Caption>
      </div>
      <img
        alt="豆格拼豆作品"
        src={beadGridCoverUrl}
        style={{
          border: `1px solid ${LINE}`,
          borderRadius: 34,
          bottom: 190,
          boxShadow: "0 34px 80px rgba(64,45,24,.2)",
          height: 740,
          left: 68,
          objectFit: "cover",
          objectPosition: "58% center",
          opacity: cover,
          position: "absolute",
          transform: `scale(${mix(0.92, 1, cover)})`,
          width: 944,
        }}
      />
      <BottomPill>
        <Sparkles color={ORANGE} size={28} />
        豆格 Bead Grid
      </BottomPill>
    </SceneFrame>
  );
}

function GenerateScene({ progress }: { progress: number }) {
  const scan = easeInOutCubic(clamp((progress - 0.08) / 0.65));
  const reveal = clamp((progress - 0.2) / 0.55);
  return (
    <SceneFrame>
      <TopCopy
        kicker="01 · 上传生成"
        progress={progress}
        title={
          <>
            图片进来，<span style={{ color: ORANGE }}>图纸就绪。</span>
          </>
        }
      >
        自动取色、自动匹配，整个过程只在浏览器本地完成。
      </TopCopy>
      <div style={{ bottom: 190, left: 68, position: "absolute" }}>
        <WindowChrome>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: 910, padding: 34 }}>
            <div style={{ borderRight: `1px solid ${LINE}`, padding: "46px 34px 0 12px" }}>
              <div
                style={{
                  alignItems: "center",
                  background: "#fff5ef",
                  border: "2px dashed #efb29a",
                  borderRadius: 22,
                  display: "flex",
                  flexDirection: "column",
                  height: 600,
                  justifyContent: "center",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <img
                  alt="待转换的拼豆照片"
                  src={beadGridCoverUrl}
                  style={{
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "69% center",
                    opacity: 0.94,
                    width: "100%",
                  }}
                />
                <div
                  style={{
                    alignItems: "center",
                    background: "rgba(255,255,255,.92)",
                    borderRadius: 14,
                    display: "flex",
                    fontSize: 19,
                    fontWeight: 800,
                    gap: 10,
                    left: 28,
                    padding: "13px 18px",
                    position: "absolute",
                    top: 28,
                  }}
                >
                  <ImagePlus color={ORANGE} size={24} />
                  heart.png
                </div>
                <div
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,.9), transparent)",
                    height: 8,
                    left: 0,
                    position: "absolute",
                    right: 0,
                    top: `${8 + scan * 84}%`,
                  }}
                />
              </div>
              <div style={{ color: GREEN, fontSize: 19, fontWeight: 800, marginTop: 28, textAlign: "center" }}>
                ✓ 图片仅在本机处理
              </div>
            </div>
            <div
              style={{
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                paddingLeft: 30,
              }}
            >
              <div style={{ transform: "scale(.57)" }}>
                <BeadPattern progress={reveal} />
              </div>
              <div
                style={{
                  alignItems: "center",
                  background: ORANGE,
                  borderRadius: 12,
                  color: "#fff",
                  display: "flex",
                  fontSize: 20,
                  fontWeight: 900,
                  gap: 9,
                  marginTop: -105,
                  padding: "14px 24px",
                }}
              >
                <Sparkles size={22} />
                已生成 32 × 32 图纸
              </div>
            </div>
          </div>
        </WindowChrome>
      </div>
    </SceneFrame>
  );
}

function SizeScene({ progress }: { progress: number }) {
  const change = easeInOutCubic(clamp((progress - 0.28) / 0.34));
  const width = Math.round(mix(32, 48, change));
  const physical = Math.round(width * 0.5);
  return (
    <SceneFrame>
      <TopCopy
        kicker="02 · 尺寸明确"
        progress={progress}
        title={
          <>
            比例锁定，<span style={{ color: ORANGE }}>状态看得见。</span>
          </>
        }
      >
        改宽度时高度同步变化，常用规格和实体尺寸一眼确认。
      </TopCopy>
      <div style={{ bottom: 290, left: 102, position: "absolute" }}>
        <WindowChrome title="生成设置 · 网格尺寸">
          <div style={{ background: "#faf6ee", height: 820, padding: "70px 68px" }}>
            <div
              style={{
                alignItems: "center",
                display: "flex",
                fontSize: 26,
                fontWeight: 900,
                justifyContent: "space-between",
              }}
            >
              <span>网格尺寸</span>
              <span style={{ color: ORANGE }}>
                {width} × {width}
              </span>
            </div>
            <div
              style={{
                alignItems: "end",
                display: "grid",
                gap: 18,
                gridTemplateColumns: "1fr 210px 1fr",
                marginTop: 38,
              }}
            >
              {["宽", "高"].map((label, index) => (
                <div key={label} style={{ gridColumn: index === 0 ? 1 : 3 }}>
                  <span style={{ color: MUTED, fontSize: 18, fontWeight: 700 }}>{label}</span>
                  <div
                    style={{
                      background: "#fff",
                      border: `2px solid ${LINE}`,
                      borderRadius: 14,
                      fontSize: 38,
                      fontWeight: 900,
                      marginTop: 8,
                      padding: 22,
                      textAlign: "center",
                    }}
                  >
                    {width}
                  </div>
                </div>
              ))}
              <div
                style={{
                  alignItems: "center",
                  background: "#fff2eb",
                  border: "2px solid #efb29a",
                  borderRadius: 14,
                  color: ORANGE,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  gridColumn: 2,
                  gridRow: 1,
                  height: 105,
                  justifyContent: "center",
                }}
              >
                <Link2 size={28} />
                <strong style={{ fontSize: 17 }}>比例已锁定 1:1</strong>
              </div>
            </div>
            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(4,1fr)", marginTop: 42 }}>
              {[16, 24, 32, 48].map((size) => (
                <div
                  key={size}
                  style={{
                    background: size === width ? "#fff2eb" : "#fff",
                    border: `2px solid ${size === width ? "#efb29a" : LINE}`,
                    borderRadius: 12,
                    color: size === width ? ORANGE : MUTED,
                    fontSize: 22,
                    fontWeight: 900,
                    padding: "18px 0",
                    textAlign: "center",
                  }}
                >
                  {size}²
                </div>
              ))}
            </div>
            <div style={{ color: MUTED, fontSize: 22, fontWeight: 700, marginTop: 36, textAlign: "center" }}>
              约 {physical} × {physical} cm · 5 mm 拼豆
            </div>
            <div
              style={{
                alignItems: "center",
                background: INK,
                borderRadius: 14,
                color: "#fff",
                display: "flex",
                fontSize: 23,
                fontWeight: 900,
                gap: 10,
                justifyContent: "center",
                marginTop: 34,
                padding: 19,
              }}
            >
              <Check size={25} />
              应用新尺寸
            </div>
          </div>
        </WindowChrome>
      </div>
      <BottomPill>
        <Link2 color={ORANGE} size={27} />
        8–80 格自由设置
      </BottomPill>
    </SceneFrame>
  );
}

function EditScene({ progress }: { progress: number }) {
  const selection = progress > 0.28;
  const filled = progress > 0.72;
  return (
    <SceneFrame dark>
      <TopCopy
        dark
        kicker="03 · 批量编辑"
        progress={progress}
        title={
          <>
            框选一片，<span style={{ color: "#f7a270" }}>一次处理。</span>
          </>
        }
      >
        鼠标拖拽框选；手机长按后沿轨迹连续选中。
      </TopCopy>
      <div style={{ bottom: 220, left: 68, position: "absolute" }}>
        <WindowChrome>
          <div
            style={{
              alignItems: "center",
              background: "#eee7da",
              display: "flex",
              flexDirection: "column",
              height: 940,
              justifyContent: "center",
              position: "relative",
            }}
          >
            {selection && (
              <div
                style={{
                  alignItems: "center",
                  background: "rgba(255,253,248,.97)",
                  border: `1px solid ${LINE}`,
                  borderRadius: 13,
                  boxShadow: "0 12px 30px rgba(40,30,20,.16)",
                  display: "flex",
                  gap: 12,
                  left: 100,
                  padding: "12px 16px",
                  position: "absolute",
                  right: 100,
                  top: 28,
                  zIndex: 4,
                }}
              >
                <strong style={{ color: ORANGE, fontSize: 17 }}>81 颗已选</strong>
                <span
                  style={{
                    alignItems: "center",
                    background: "#f3ede3",
                    borderRadius: 8,
                    display: "flex",
                    fontSize: 15,
                    fontWeight: 800,
                    gap: 6,
                    padding: "10px 13px",
                  }}
                >
                  <PaintBucket size={18} />
                  填为 A09
                </span>
                <span
                  style={{
                    alignItems: "center",
                    background: "#fff0ed",
                    borderRadius: 8,
                    color: "#b33427",
                    display: "flex",
                    fontSize: 15,
                    fontWeight: 800,
                    gap: 6,
                    padding: "10px 13px",
                  }}
                >
                  <Trash2 size={18} />
                  移除
                </span>
                <span
                  style={{
                    alignItems: "center",
                    background: "#f3ede3",
                    borderRadius: 8,
                    display: "flex",
                    fontSize: 15,
                    fontWeight: 800,
                    gap: 6,
                    padding: "10px 13px",
                  }}
                >
                  <Scan size={18} />
                  全选
                </span>
              </div>
            )}
            <div style={{ transform: "scale(.93)" }}>
              <BeadPattern progress={1} selected={selection && !filled} />
            </div>
            {filled && (
              <div
                style={{
                  alignItems: "center",
                  background: "#e7f6ed",
                  border: "1px solid #a8d6b6",
                  borderRadius: 999,
                  bottom: 26,
                  color: "#36774a",
                  display: "flex",
                  fontSize: 18,
                  fontWeight: 900,
                  gap: 8,
                  padding: "12px 20px",
                  position: "absolute",
                }}
              >
                <Check size={20} />
                已批量修改 81 颗豆子
              </div>
            )}
            <MousePointer2
              color={ORANGE}
              fill="#fff"
              size={54}
              style={{
                filter: "drop-shadow(0 5px 8px rgba(0,0,0,.22))",
                left: mix(730, 520, easeInOutCubic(clamp((progress - 0.08) / 0.45))),
                position: "absolute",
                top: mix(760, 580, easeInOutCubic(clamp((progress - 0.08) / 0.45))),
                zIndex: 6,
              }}
            />
          </div>
        </WindowChrome>
      </div>
      <BottomPill dark>
        <MousePointer2 color="#f7a270" size={27} />
        先选中，再决定怎么改
      </BottomPill>
    </SceneFrame>
  );
}

function ZoomScene({ progress }: { progress: number }) {
  const zoom = mix(0.64, 1.08, easeInOutCubic(clamp((progress - 0.18) / 0.58)));
  return (
    <SceneFrame>
      <TopCopy
        kicker="04 · 双端缩放"
        progress={progress}
        title={
          <>
            放大以后，<span style={{ color: ORANGE }}>色号依然清楚。</span>
          </>
        }
      >
        手机双指、电脑 Cmd/Ctrl + 滚轮，只缩放画布，不带动页面。
      </TopCopy>
      <div
        style={{
          alignItems: "center",
          bottom: 190,
          display: "flex",
          height: 1050,
          justifyContent: "center",
          left: 68,
          overflow: "hidden",
          position: "absolute",
          width: 944,
        }}
      >
        <div style={{ transform: `scale(${zoom})` }}>
          <BeadPattern progress={1} size={20} />
        </div>
        <div
          style={{
            alignItems: "center",
            background: "rgba(255,253,248,.96)",
            border: `1px solid ${LINE}`,
            borderRadius: 12,
            bottom: 34,
            boxShadow: "0 12px 30px rgba(45,34,22,.12)",
            display: "flex",
            gap: 12,
            padding: "13px 19px",
            position: "absolute",
            right: 30,
          }}
        >
          <Maximize2 color={ORANGE} size={24} />
          <strong style={{ fontSize: 20 }}>{Math.round(zoom * 100)}%</strong>
          <ZoomIn size={24} />
        </div>
      </div>
      <BottomPill>
        <Smartphone color={ORANGE} size={26} />
        <span>手机</span>
        <span style={{ color: LINE }}>|</span>
        <Monitor color={ORANGE} size={26} />
        <span>电脑</span>
      </BottomPill>
    </SceneFrame>
  );
}

function MaterialsScene({ progress }: { progress: number }) {
  const enter = easeOutCubic(clamp((progress - 0.14) / 0.42));
  const items = [
    { code: "A04", count: 244, name: "珊瑚红", color: "#ee6a5b" },
    { code: "A05", count: 253, name: "莓果粉", color: "#d94e76" },
    { code: "A06", count: 68, name: "樱花粉", color: "#f2a7bb" },
  ];
  return (
    <SceneFrame>
      <TopCopy
        kicker="05 · 备料导出"
        progress={progress}
        title={
          <>
            需要多少豆，<span style={{ color: ORANGE }}>直接算好。</span>
          </>
        }
      >
        实时统计每种色号，一键导出图纸和带备料建议的清单。
      </TopCopy>
      <div
        style={{
          bottom: 240,
          display: "grid",
          gap: 28,
          gridTemplateColumns: "1fr 1fr",
          left: 68,
          opacity: enter,
          position: "absolute",
          transform: `translateY(${mix(54, 0, enter)}px)`,
          width: 944,
        }}
      >
        <div style={{ background: INK, borderRadius: 28, color: "#fff", minHeight: 790, padding: 38 }}>
          <div style={{ color: "#cfc7bd", fontSize: 20, fontWeight: 700 }}>预计用豆</div>
          <strong style={{ color: "#f7a270", display: "block", fontSize: 92, letterSpacing: "-.07em", marginTop: 2 }}>
            565
          </strong>
          <div style={{ color: "#b8b0a6", fontSize: 18 }}>颗 · 3 种颜色</div>
          <div style={{ marginTop: 36 }}>
            {items.map((item) => (
              <div
                key={item.code}
                style={{
                  alignItems: "center",
                  borderTop: "1px solid rgba(255,255,255,.1)",
                  display: "grid",
                  gap: 14,
                  gridTemplateColumns: "42px 1fr auto",
                  padding: "23px 0",
                }}
              >
                <i
                  style={{
                    background: item.color,
                    borderRadius: "50%",
                    boxShadow: "inset 3px 3px rgba(255,255,255,.3)",
                    height: 38,
                    width: 38,
                  }}
                />
                <span>
                  <strong style={{ display: "block", fontSize: 19 }}>{item.code}</strong>
                  <small style={{ color: "#b8b0a6", fontSize: 15 }}>{item.name}</small>
                </span>
                <b style={{ fontSize: 24 }}>{item.count}</b>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {[
            { icon: <Download size={32} />, title: "带色号 PNG", text: "打印照着做" },
            { icon: <FileJson size={32} />, title: "JSON 项目", text: "以后继续编辑" },
            { icon: <FileSpreadsheet size={32} />, title: "材料 CSV", text: "自动加 10% 备料" },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                alignItems: "center",
                background: CARD,
                border: `1px solid ${LINE}`,
                borderRadius: 22,
                boxShadow: "0 16px 42px rgba(52,40,27,.08)",
                display: "grid",
                gap: 18,
                gridTemplateColumns: "64px 1fr",
                minHeight: 162,
                padding: 28,
              }}
            >
              <div style={{ color: ORANGE }}>{item.icon}</div>
              <div>
                <strong style={{ display: "block", fontSize: 25 }}>{item.title}</strong>
                <span style={{ color: MUTED, display: "block", fontSize: 18, marginTop: 7 }}>{item.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SceneFrame>
  );
}

function PrivateScene({ progress }: { progress: number }) {
  const enter = easeOutCubic(clamp(progress / 0.42));
  const features = [
    { icon: <ShieldCheck size={40} />, title: "图片不上云", text: "浏览器本地处理" },
    { icon: <Clock3 size={40} />, title: "自动保存", text: "回来继续编辑" },
    { icon: <FileJson size={40} />, title: "无需登录", text: "打开就能开始" },
  ];
  return (
    <SceneFrame dark>
      <TopCopy
        dark
        kicker="06 · 安心创作"
        progress={progress}
        title={
          <>
            不登录，<span style={{ color: "#f7a270" }}>也不上传原图。</span>
          </>
        }
      >
        作品自动保存在本机，隐私和进度都由你掌控。
      </TopCopy>
      <div
        style={{
          bottom: 280,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          left: 68,
          opacity: enter,
          position: "absolute",
          transform: `translateY(${mix(54, 0, enter)}px)`,
          width: 944,
        }}
      >
        {features.map((feature, index) => (
          <div
            key={feature.title}
            style={{
              alignItems: "center",
              background: "rgba(255,255,255,.07)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 24,
              display: "grid",
              gap: 25,
              gridTemplateColumns: "78px 1fr auto",
              minHeight: 190,
              padding: "30px 38px",
            }}
          >
            <div style={{ color: index === 0 ? "#72be91" : "#f7a270" }}>{feature.icon}</div>
            <div>
              <strong style={{ display: "block", fontSize: 31 }}>{feature.title}</strong>
              <span style={{ color: "#bdb4ac", display: "block", fontSize: 21, marginTop: 8 }}>{feature.text}</span>
            </div>
            <Check color="#72be91" size={30} />
          </div>
        ))}
      </div>
      <BottomPill dark>
        <ShieldCheck color="#72be91" size={28} />
        隐私友好的拼豆工作台
      </BottomPill>
    </SceneFrame>
  );
}

function OutroScene({ progress }: { progress: number }) {
  const enter = easeOutCubic(clamp(progress / 0.48));
  const beads = PALETTE.slice(1, 11);
  return (
    <SceneFrame>
      {beads.map((color, index) => {
        const angle = (index / beads.length) * Math.PI * 2;
        const radius = mix(540, 360, enter);
        return (
          <i
            key={color}
            style={{
              background: color,
              border: "8px solid rgba(255,255,255,.4)",
              borderRadius: "50%",
              boxShadow: "0 12px 24px rgba(50,35,20,.15), inset 7px 7px rgba(255,255,255,.28)",
              height: 76,
              left: 502 + Math.cos(angle) * radius,
              position: "absolute",
              top: 850 + Math.sin(angle) * radius,
              transform: `rotate(${index * 12}deg)`,
              width: 76,
            }}
          />
        );
      })}
      <div
        style={{
          left: 0,
          opacity: enter,
          position: "absolute",
          right: 0,
          textAlign: "center",
          top: 420,
          transform: `scale(${mix(0.82, 1, enter)})`,
        }}
      >
        <div style={{ display: "inline-flex" }}>
          <Logo />
        </div>
        <h2 style={{ fontSize: 80, fontWeight: 900, letterSpacing: "-.06em", lineHeight: 1.08, margin: "62px 60px 0" }}>
          把喜欢的图片，
          <br />
          <span style={{ color: ORANGE }}>变成一颗颗拼豆。</span>
        </h2>
        <p style={{ color: MUTED, fontSize: 30, fontWeight: 650, marginTop: 35 }}>免费 · 本地处理 · 手机电脑都能用</p>
        <div
          style={{
            background: INK,
            borderRadius: 18,
            color: "#fff",
            display: "inline-flex",
            fontSize: 27,
            fontWeight: 800,
            marginTop: 60,
            padding: "22px 32px",
          }}
        >
          hugozhou-ai.github.io/bead-grid/
        </div>
      </div>
      <BottomPill>
        <Sparkles color={ORANGE} size={28} />
        现在就做第一张拼豆图纸
      </BottomPill>
    </SceneFrame>
  );
}

export function BeadPromoSurface({ context, input }: SurfaceComponentProps<PromoInput>) {
  const variant = typeof input.variant === "string" ? input.variant : "hook";
  const props = { progress: context.progress };
  if (variant === "generate") return <GenerateScene {...props} />;
  if (variant === "size") return <SizeScene {...props} />;
  if (variant === "edit") return <EditScene {...props} />;
  if (variant === "zoom") return <ZoomScene {...props} />;
  if (variant === "materials") return <MaterialsScene {...props} />;
  if (variant === "private") return <PrivateScene {...props} />;
  if (variant === "outro") return <OutroScene {...props} />;
  return <HookScene {...props} />;
}
