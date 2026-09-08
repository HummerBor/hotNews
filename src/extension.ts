import * as vscode from 'vscode';
import { AihotProvider } from './trend/aihot';
import { BaiduProvider } from './trend/baidu';
import { WeiboProvider } from './trend/weibo';
import { TencentProvider } from './trend/tencent';
import { TrendService } from './trend/service';
import { PlatformId, TrendProvider } from './trend/types';
import { StatusBarManager } from './statusBar';
import { HotSearchViewProvider } from './webview/provider';

export function activate(context: vscode.ExtensionContext): void {
  const providers = new Map<PlatformId, TrendProvider>([
    ['aihot', new AihotProvider()],
    ['baidu', new BaiduProvider()],
    ['weibo', new WeiboProvider()],
    ['tencent', new TencentProvider()],
  ]);

  const service = new TrendService(providers);
  const statusBar = new StatusBarManager();

  // 状态栏跟随侧边栏当前 tab，默认 AI 精选
  let statusSource = 'aihot:selected';
  const viewProvider = new HotSearchViewProvider(service, (platform, boardId) => {
    statusSource = `${platform}:${boardId}`;
    const cached = service.getCached(platform, boardId);
    if (cached) statusBar.updateFromBoard(cached);
  });

  context.subscriptions.push(
    service,
    statusBar,
    vscode.window.registerWebviewViewProvider('hotSearch.panel', viewProvider),
    service.onBoardUpdated((board) => {
      viewProvider.onBoardUpdated(board);
      if (`${board.platform}:${board.id}` === statusSource) {
        statusBar.updateFromBoard(board);
      }
    }),
    // onError 仅在没有缓存可兜底时触发（有缓存时 service 直接回退展示缓存）
    service.onError((platform, boardId, err) => {
      viewProvider.onError(platform, boardId, err.message);
      void vscode.window.showWarningMessage(`热搜更新失败：${err.message}`);
    }),
    vscode.commands.registerCommand('hotSearch.refresh', () => viewProvider.refreshCurrent()),
    vscode.commands.registerCommand('hotSearch.openSidebar', () => viewProvider.reveal()),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('hotSearch.carouselInterval')) {
        statusBar.onConfigChanged();
      }
    }),
  );

  void service.refresh('aihot', 'selected');
}

export function deactivate(): void {}
