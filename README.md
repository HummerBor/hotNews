# Hot Search

Cursor / VS Code 侧边栏看百度、微博、腾讯热搜，状态栏轮播百度热搜。

![截图](docs/screenshot.png)

## 安装

```bash
npm run package
```

Extensions → `...` → **Install from VSIX...** → 选生成的 `.vsix` → Reload Window

## 怎么用

1. 左侧 Activity Bar 点 **🔥** 打开侧边栏
2. 切换 **百度 / 微博 / 腾讯**，百度还有 **热搜榜 / 财经榜**
3. 点条目打开链接，点 **换一换** 刷新
4. 左下角状态栏轮播百度热搜，点击跳转到侧边栏

设置里搜 `hotSearch` 可改：打开方式（浏览器 / 内置）、轮播间隔。

## 开发

```bash
npm install
npm run watch   # 另开终端
# F5 调试
```

## 说明

- 数据只在打开侧边栏或手动刷新时拉取，不会后台定时请求
- 想改功能自己 fork 后用 AI 改就行，MIT 协议

## License

MIT
