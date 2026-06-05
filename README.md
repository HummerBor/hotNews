# Hot Search 扩展

个人自用百度/微博/腾讯热搜 Cursor/VS Code 扩展。

## 开发调试

1. `npm install`
2. Cursor 打开本项目
3. 按 F5 启动 Extension Development Host

## 安装到 Cursor

```bash
npm run package
```

Extensions → `...` → Install from VSIX → 选择生成的 `.vsix`

## 配置

- `hotSearch.openMode` — `external` | `simpleBrowser`
- `hotSearch.carouselInterval` — 状态栏轮播秒数（默认 5）

数据仅在打开侧边栏、切换 Tab/平台、点「换一换」或执行 Refresh 命令时拉取，无后台定时请求。
