<p align="center">
  <a href="https://hugozhou-ai.github.io/stage-cut/">
    <img alt="StageCut logo — 打开在线生产级案例画廊" src="apps/gallery/src/assets/stage-cut.png" width="160" />
  </a>
</p>

# StageCut

[![English Docs](https://img.shields.io/badge/English-Docs-blue)](README.md)

StageCut 是一个确定性的动画引擎，用于构建和播放交互式的 DOM 视频体验。项目以可移植的 JSON 定义；React Surface 组件负责渲染；编译后的场景时间轴确保有界的、可预测的播放性能。

StageCut 仅面向浏览器播放设计，不提供 MP4/WebM 导出、音频管理或可视化编辑器。

<p align="center">
  <strong><a href="https://hugozhou-ai.github.io/stage-cut/">▶ 打开在线生产级案例画廊</a></strong>
  <br />
  <sub>体验基于 StageCut 公开 API 构建的交互式、生产级 DOM 动画。</sub>
</p>

## 特性

- 可序列化的 Project → Stage → Video → Scene → Layer 模型
- 顺序场景内支持并行图层
- 淡入淡出、滑动、缩放、擦除等场景转场
- 运行时校验，附带结构化字段路径
- O(log n) 活跃场景查找与双场景渲染窗口
- 兼容 React 18/19，播放器挂载对 SSR 安全
- 基于 Remotion 的播放能力，由 StageCut 自有的控制器 API 封装

## 安装

```bash
pnpm add @stagecut/core @stagecut/react react react-dom
```

`@stagecut/react` 内部使用 Remotion。请查阅 [Remotion 许可说明](docs/remotion-license.md)，并在适当时于播放器上显式确认许可。

## 快速开始

```tsx
import { compileStagecutVideo, defineStagecutProject } from "@stagecut/core";
import { defineSurfaceRegistry, StagecutPlayer } from "@stagecut/react";

const project = defineStagecutProject({
  schemaVersion: 1,
  id: "hello-project",
  name: "Hello Project",
  stages: [{ id: "main", name: "Main", width: 1280, height: 720, background: "#101827" }],
  surfaces: [{ id: "title", name: "Title" }],
  videos: [{
    id: "hello",
    name: "Hello",
    stageId: "main",
    fps: 60,
    scenes: [{
      id: "intro",
      durationInFrames: 120,
      layers: [{ id: "title", surfaceId: "title", inputProps: { text: "Hello StageCut" } }],
    }],
  }],
});

const surfaces = defineSurfaceRegistry(project, {
  title: ({ input, context }) => (
    <h1 style={{ opacity: context.progress }}>{input.text}</h1>
  ),
});

const video = compileStagecutVideo(project, "hello");

export function Preview() {
  return <StagecutPlayer acknowledgeRemotionLicense surfaces={surfaces} video={video} />;
}
```

Surface 组件接收 `{ input, context }`。`input` 为图层中的 JSON 数据；`context` 包含 `globalFrame`、`localFrame`、`progress`、`fps`、`sceneId` 和 `layerId`。默认禁用 Surface 交互，以保证播放的确定性。当浏览器体验需要暴露 Surface 渲染的真实按钮、链接、输入框、选择与焦点行为时，向 `StagecutPlayer` 传入 `interactive`。转场期间仅活跃场景接受指针事件。

## 外部 JSON

对外部数据使用 `parseStagecutProject(unknown)`。校验失败时抛出 `StagecutValidationError`，其 `issues` 数组包含 `path`、`code` 和 `message`。若需要判别式结果，可使用 `safeParseStagecutProject()`。`serializeStagecutProject()` 输出规范格式的 JSON。

## 案例画廊

> **[打开在线生产级案例画廊 →](https://hugozhou-ai.github.io/stage-cut/)**
>
> 在本地安装或运行 StageCut 之前，可先浏览交互式、生产级案例。

本地运行同一画廊：

```bash
corepack enable
pnpm install
pnpm dev
```

打开 Vite 打印的 URL。画廊包含三个基于 StageCut 公开 API 构建的生产级案例。

### Application Creation Dialog

[![Application Creation Dialog 动画](docs/assets/gallery/application-dialog.gif)](docs/assets/gallery/application-dialog.mp4)

点击动画可打开全分辨率 MP4。使用 `pnpm gallery:render` 重新生成画廊媒体；该命令要求系统 `PATH` 中已安装 FFmpeg。

服务默认监听 `5173` 端口，端口占用时自动递增。可通过 `STAGECUT_GALLERY_PORT` 和 `STAGECUT_GALLERY_HOST` 覆盖。Gallery 重命名期间，仍兼容旧的 `STAGECUT_STUDIO_PORT` 与 `STAGECUT_STUDIO_HOST` 环境变量名。

## StageCut Devtools

在运行时包旁安装仅用于开发的 Studio：

```bash
pnpm add -D @stagecut/devtools
```

在应用根组件附近挂载一次。将 `enabled` 与宿主环境的开发模式绑定，避免在生产环境激活 Studio：

```tsx
import { StagecutDevtools } from "@stagecut/devtools";

<StagecutDevtools
  acknowledgeRemotionLicense
  enabled={import.meta.env.DEV}
  project={project}
  surfaces={surfaces}
/>;
```

在 URL 中添加 `?stagecut` 可显示全局启动器。它会在新标签页打开 `?stagecut=studio`，你可以预览真实 Surface 组件，编辑场景、转场、图层与 input props，查看运行时帧状态，并将修改结果复制为 Agent Prompt。草稿仅保存在当前标签页的 `sessionStorage` 中，不会直接修改源文件。

## 验证

```bash
pnpm verify
pnpm test:coverage
```

请参阅 [架构说明](docs/architecture.md)、[性能说明](docs/performance.md) 与 [0.1 迁移指南](docs/migration-0.1.md)。面向开发者与编码 Agent 的任务导向参考，见 [AI 友好项目使用指南](docs/ai-usage-guide.md)。

维护者发布流程见 [RELEASING.md](RELEASING.md)；发布需人工审批，不会在分支推送时自动执行。

## 贡献与安全

提交 Pull Request 前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。安全漏洞请按 [SECURITY.md](SECURITY.md) 中的流程报告。

StageCut 基于 [MIT License](LICENSE) 开源。
