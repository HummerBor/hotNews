# Hot Search

在 Cursor / VS Code 侧边栏看百度、微博、腾讯热搜，状态栏轮播百度热搜 Top 榜。数据直接抓取各平台公开接口，无需账号、无需后端。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 功能

- **多平台**：百度、微博、腾讯，侧边栏 Tab 切换
- **多榜单**：百度支持热搜榜 + 财经榜；微博 / 腾讯为热搜榜
- **完整榜单**：展示 API 返回的全部条目（约 50 条），列表区域独立滚动
- **状态栏轮播**：左下角轮播百度热搜，点击聚焦侧边栏
- **按需拉取**：仅在打开侧边栏、切换平台/榜单、点「换一换」或执行刷新命令时请求，无后台定时任务
- **主题适配**：颜色跟随 VS Code 主题，不刺眼

## 截图

> 安装后在 Activity Bar 点击火焰图标打开侧边栏。

```
┌─────────────────────────┐
│ 百度热搜        换一换 ↻ │
│ [百度] [微博] [腾讯]     │
│ [热搜榜] [财经榜]        │
├─────────────────────────┤
│ ↑ 置顶条目               │
│ 1  第一条热搜      [新]  │
│ 2  第二条热搜            │
│ ...（可滚动）            │
└─────────────────────────┘

状态栏：🔥 某条热搜标题 → 5 秒轮播下一条
```

## 安装

### 方式一：VSIX（推荐，无需构建）

1. 下载 [Releases](https://github.com/HummerBor/hotNews/releases) 中的 `.vsix`，或本地执行 `npm run package` 生成
2. Cursor / VS Code → Extensions → `...` → **Install from VSIX...**
3. 选择 `.vsix` 文件，Reload Window

### 方式二：本地开发调试

```bash
git clone https://github.com/HummerBor/hotNews.git
cd hotNews
npm install
```

用 Cursor / VS Code 打开项目，按 **F5** 启动 Extension Development Host。

## 使用

| 操作 | 说明 |
|------|------|
| 打开侧边栏 | Activity Bar 点击 🔥 图标 |
| 切换平台 | 百度 / 微博 / 腾讯 |
| 切换榜单 | 热搜榜 / 财经榜（仅百度） |
| 刷新 | 点「换一换 ↻」 |
| 打开链接 | 点击榜单条目 |
| 状态栏 | 轮播百度热搜，点击打开侧边栏 |

### 命令面板

| 命令 | 作用 |
|------|------|
| `Hot Search: Refresh` | 刷新当前榜单 |
| `Hot Search: Open Sidebar` | 打开并聚焦侧边栏 |

## 配置

在设置中搜索 `hotSearch`：

| 键 | 默认值 | 说明 |
|----|--------|------|
| `hotSearch.openMode` | `external` | 点击条目：`external` 系统浏览器 / `simpleBrowser` 内置浏览器 |
| `hotSearch.carouselInterval` | `5` | 状态栏轮播间隔（秒） |

## 开发

```bash
npm install          # 安装依赖
npm run compile      # 编译
npm run watch        # 监听编译
npm test             # 运行测试
npm run package      # 打包 .vsix
```

### 项目结构

```
src/
├── extension.ts          # 入口
├── statusBar.ts          # 状态栏轮播
├── trend/
│   ├── types.ts          # 类型与 Provider 接口
│   ├── baidu.ts          # 百度 API
│   ├── weibo.ts          # 微博 API
│   ├── tencent.ts        # 腾讯 API
│   ├── service.ts        # 缓存与调度
│   └── fetch.ts          # HTTP 封装
└── webview/
    ├── provider.ts       # Webview 逻辑
    └── getWebviewContent.ts  # UI 模板
```

### 扩展新平台

实现 `TrendProvider` 接口，在 `extension.ts` 注册即可，UI 层无需改动：

```typescript
interface TrendProvider {
  readonly id: PlatformId;
  readonly supportedBoards: readonly BoardId[];
  fetchBoard(boardId: BoardId): Promise<TrendBoard>;
}
```

## 数据来源

| 平台 | 接口 | 榜单 |
|------|------|------|
| 百度 | `top.baidu.com/api/board` | 热搜榜、财经榜 |
| 微博 | `weibo.com/ajax/side/hotSearch` | 热搜榜 |
| 腾讯 | `r.inews.qq.com/gw/event/hot_ranking_list` | 热搜榜 |

均为各平台网页使用的非公开接口，可能随时变更。本项目仅供个人学习交流，数据版权归原平台所有。

## 常见问题

**Q: 安装后看不到微博/腾讯 Tab？**  
Reload Window。若曾装过旧版，卸载扩展后重装最新 VSIX。

**Q: 会不会一直占内存、调接口？**  
不会。无定时刷新，只有打开侧边栏或手动刷新时才请求。

**Q: 能上架 Marketplace 吗？**  
当前按个人 sideload 设计，未上架。可自行 fork 后发布。

## License

[MIT](LICENSE) © HummerBor
