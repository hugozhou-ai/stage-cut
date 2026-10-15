---
name: stagecut-video
description: 用 StageCut 制作、修改并导出程序化视频，编排 React、Canvas 或 WebGL 画面及音视频图层，按关键帧和区间样片迭代。适用于 vibe 视频制作、产品演示和空间叙事；纯文生视频模型调用不使用此技能。
---

# StageCut 视频制作

把用户意图转成可修改、可渲染的影片。让 agent 决定叙事和视觉表达，使用 StageCut 处理时间、组合、资源准备与交付。优先复用现有项目和素材；遵守当前会话的浏览器、外部服务与发布权限。

## 创作与实现

确认主题、受众、时长、画幅、语言和交付范围。为镜头记录目的、画面动作、文字、声音和资源来源。先实现一段代表性内容；不要为了适配框架把所有作品做成卡片轮播。

阅读 `docs/scene-to-film.md` 了解时间和资源契约，阅读 `packages/render/README.md` 获取当前渲染接口。以项目文档和实际 API 为准，不猜测尚未存在的功能。

JSON 负责镜头和图层编排，Surface 负责画面。按题材自由选择 React DOM、Canvas 或 WebGL；可以加入经授权生成的素材。用 `backgroundLayers` 承载跨镜头的世界和音乐，用 `overlayLayers` 安排字幕与标题。独立镜头使用 Scene layers。

图层的 `startFrame` 相对于所属 Scene 或 Video，`durationInFrames` 指定持续长度，结束帧不包含在范围中。通过编译结果计算全片时长，避免忽略转场重叠。局部动作使用 `context.localFrame`，全片动作使用 `context.globalFrame`。

用 `StagecutResource` 准备字体、图像和引擎资源，资源 ID 包含来源变化。不要让 CSS 动画、真实时钟、未固定的随机数或用户输入决定离线成片。连续模拟必须支持固定步长和状态恢复。

使用 `StagecutRenderRoot` 从同一 Project 和 registry 声明渲染入口；预览与导出共用资源和画面代码。音视频组件位于图层的局部媒体时钟下。配音实际时长确定后，再对齐镜头和字幕。

## 渲染与反馈

先运行 `stagecut inspect --entry ...` 确认影片 ID 和参数，再按需要执行：

```bash
stagecut render --entry render.tsx --id film --out .artifacts/review \
  --frames 0,120,240 --check-frame 120 --stills-only
stagecut render --entry render.tsx --id film --out .artifacts/sample \
  --range 120-239 --scale 0.5
stagecut render --entry render.tsx --id film --out .artifacts/final
```

仓库内用 `pnpm stagecut` 调用；消费项目使用已安装的本地 CLI。仅在相关渲染环境和会话权限允许时执行浏览器渲染。

检查联系表、转场附近帧、运动样片和输出音轨。读取 `render-manifest.json` 中的参数、日志和哈希。重复帧哈希相等只能证明当前环境下该帧的重复捕获一致，不代表整片或跨设备完全确定。

根据证据定位问题：资源加载、时钟、生命周期、编排或编码问题应修复对应通用能力；画面设计问题修改 Surface 和分镜。不要把某一影片的内容细节硬编码进框架。

交付真实生成的影片、必要字幕、源代码和可复现命令。说明已检查项目及尚未验证的限制。发布网站、发布 npm 包或推送仓库是独立动作，遵循用户的授权范围。
