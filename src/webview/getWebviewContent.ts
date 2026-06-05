import * as vscode from 'vscode';

export function getWebviewContent(webview: vscode.Webview): string {
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style nonce="${nonce}">
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      height: 100%;
      overflow: hidden;
    }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      padding: 8px;
      display: flex;
      flex-direction: column;
    }
    .toolbar {
      flex-shrink: 0;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .header h1 { font-size: 14px; font-weight: 600; }
    .refresh-btn {
      background: transparent;
      border: none;
      color: var(--vscode-descriptionForeground);
      cursor: pointer;
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .refresh-btn:hover {
      background: var(--vscode-toolbar-hoverBackground);
      color: var(--vscode-foreground);
    }
    .tabs, .platform-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 8px;
    }
    .tab, .platform-tab {
      flex: 1;
      padding: 6px 0;
      text-align: center;
      font-size: 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .tab.active, .platform-tab.active {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .platform-tabs { margin-bottom: 10px; }
    .board-tabs.hidden { display: none; }
    .scroll-area {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      margin: 0 -4px;
      padding: 0 4px;
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, var(--vscode-scrollbarSlider-background) 60%, transparent) transparent;
    }
    .scroll-area::-webkit-scrollbar {
      width: 4px;
    }
    .scroll-area::-webkit-scrollbar-track {
      background: transparent;
    }
    .scroll-area::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--vscode-scrollbarSlider-background) 50%, transparent);
      border-radius: 4px;
    }
    .scroll-area::-webkit-scrollbar-thumb:hover {
      background: var(--vscode-scrollbarSlider-hoverBackground);
    }
    .status {
      text-align: center;
      padding: 24px;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }
    .list { display: flex; flex-direction: column; gap: 2px; }
    .row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 4px;
      border-radius: 4px;
      cursor: pointer;
    }
    .row:hover { background: var(--vscode-list-hoverBackground); }
    .rank {
      width: 20px;
      text-align: center;
      font-size: 12px;
      font-weight: 500;
      flex-shrink: 0;
      color: var(--vscode-descriptionForeground);
      opacity: 0.7;
    }
    .rank.r1 { color: var(--vscode-charts-red, #b85c5c); opacity: 0.9; }
    .rank.r2 { color: var(--vscode-charts-orange, #a67c52); opacity: 0.9; }
    .rank.r3 { color: var(--vscode-charts-yellow, #9a8a52); opacity: 0.9; }
    .rank.pin { color: var(--vscode-charts-red, #b85c5c); opacity: 0.9; }
    .title {
      flex: 1;
      font-size: 13px;
      line-height: 1.45;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--vscode-foreground);
      opacity: 0.92;
    }
    .badge {
      font-size: 10px;
      padding: 0 4px;
      border-radius: 2px;
      flex-shrink: 0;
      line-height: 1.5;
      font-weight: 500;
    }
    .badge.new {
      color: var(--vscode-charts-red, #b85c5c);
      background: color-mix(in srgb, var(--vscode-charts-red, #b85c5c) 12%, transparent);
    }
    .badge.hot {
      color: var(--vscode-charts-orange, #a67c52);
      background: color-mix(in srgb, var(--vscode-charts-orange, #a67c52) 12%, transparent);
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="header">
      <h1 id="title">热搜</h1>
      <button class="refresh-btn" id="refreshBtn">换一换 ↻</button>
    </div>
    <div class="platform-tabs">
      <button class="platform-tab active" data-platform="baidu">百度</button>
      <button class="platform-tab" data-platform="weibo">微博</button>
      <button class="platform-tab" data-platform="tencent">腾讯</button>
    </div>
    <div class="tabs board-tabs" id="boardTabs">
      <button class="tab active" data-board="realtime">热搜榜</button>
      <button class="tab" data-board="finance">财经榜</button>
    </div>
  </div>
  <div class="scroll-area" id="scrollArea">
    <div id="status" class="status">加载中...</div>
    <div id="list" class="list"></div>
  </div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const platformNames = { baidu: '百度', weibo: '微博', tencent: '腾讯' };
    let activePlatform = 'baidu';
    let activeBoard = 'realtime';

    function escapeHtml(text) {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function updateTitle() {
      document.getElementById('title').textContent = platformNames[activePlatform] + '热搜';
    }

    function setFinanceVisible(show) {
      const boardTabs = document.getElementById('boardTabs');
      if (show) {
        boardTabs.classList.remove('hidden');
      } else {
        boardTabs.classList.add('hidden');
        activeBoard = 'realtime';
        document.querySelectorAll('.tab').forEach((t) => {
          t.classList.toggle('active', t.dataset.board === 'realtime');
        });
      }
    }

    function renderBoard(board) {
      const list = document.getElementById('list');
      const status = document.getElementById('status');
      list.innerHTML = '';
      status.style.display = 'none';
      document.getElementById('scrollArea').scrollTop = 0;

      for (const item of board.items) {
        const row = document.createElement('div');
        row.className = 'row';
        const rankClass = item.isPinned ? 'pin' : item.rank <= 3 ? 'r' + item.rank : 'r';
        const badgeHtml = item.badge
          ? '<span class="badge ' + (item.badge === '新' ? 'new' : 'hot') + '">' + item.badge + '</span>'
          : '';
        row.innerHTML =
          '<span class="rank ' + rankClass + '">' + (item.isPinned ? '↑' : item.rank) + '</span>' +
          '<span class="title">' + escapeHtml(item.title) + '</span>' +
          badgeHtml;
        row.onclick = () => vscode.postMessage({ type: 'open', url: item.url });
        list.appendChild(row);
      }
    }

    function setLoading() {
      document.getElementById('status').style.display = 'block';
      document.getElementById('status').textContent = '加载中...';
      document.getElementById('list').innerHTML = '';
    }

    function setError(message) {
      document.getElementById('status').style.display = 'block';
      document.getElementById('status').textContent = message || '加载失败，点击换一换重试';
      document.getElementById('list').innerHTML = '';
    }

    document.querySelectorAll('.platform-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.platform-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        activePlatform = tab.dataset.platform;
        updateTitle();
        vscode.postMessage({ type: 'switchPlatform', platform: activePlatform });
      });
    });

    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        activeBoard = tab.dataset.board;
        vscode.postMessage({ type: 'switchTab', boardId: activeBoard });
      });
    });

    document.getElementById('refreshBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'refresh', platform: activePlatform, boardId: activeBoard });
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      switch (msg.type) {
        case 'update':
          if (msg.board.platform === activePlatform && msg.board.id === activeBoard) {
            renderBoard(msg.board);
          }
          break;
        case 'loading':
          if (msg.platform === activePlatform && msg.boardId === activeBoard) setLoading();
          break;
        case 'error':
          if (msg.platform === activePlatform && msg.boardId === activeBoard) setError(msg.message);
          break;
        case 'config':
          activePlatform = msg.platform;
          activeBoard = msg.boardId;
          updateTitle();
          setFinanceVisible(msg.supportsFinance);
          document.querySelectorAll('.platform-tab').forEach((t) => {
            t.classList.toggle('active', t.dataset.platform === activePlatform);
          });
          document.querySelectorAll('.tab').forEach((t) => {
            t.classList.toggle('active', t.dataset.board === activeBoard);
          });
          break;
      }
    });

    updateTitle();
    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
