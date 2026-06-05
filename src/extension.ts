import * as vscode from 'vscode';
import { BaiduProvider } from './trend/baidu';
import { WeiboProvider } from './trend/weibo';
import { TencentProvider } from './trend/tencent';
import { TrendService } from './trend/service';
import { PlatformId } from './trend/types';
import { StatusBarManager } from './statusBar';
import { HotSearchViewProvider } from './webview/provider';

export function activate(context: vscode.ExtensionContext): void {
  const providers = new Map<PlatformId, BaiduProvider | WeiboProvider | TencentProvider>([
    ['baidu', new BaiduProvider()],
    ['weibo', new WeiboProvider()],
    ['tencent', new TencentProvider()],
  ]);

  const service = new TrendService(providers);
  const viewProvider = new HotSearchViewProvider(service);
  const statusBar = new StatusBarManager();

  context.subscriptions.push(
    service,
    statusBar,
    vscode.window.registerWebviewViewProvider('hotSearch.panel', viewProvider),
    service.onBoardUpdated((board) => {
      viewProvider.onBoardUpdated(board);
      if (board.platform === 'baidu' && board.id === 'realtime') {
        statusBar.updateFromBoard(board);
      }
    }),
    service.onError((platform, boardId, err) => {
      viewProvider.onError(platform, boardId, err.message);
      if (!service.getCached(platform, boardId)) {
        void vscode.window.showWarningMessage(`热搜更新失败：${err.message}`);
      }
    }),
    vscode.commands.registerCommand('hotSearch.refresh', () => viewProvider.refreshCurrent()),
    vscode.commands.registerCommand('hotSearch.openSidebar', () => viewProvider.reveal()),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('hotSearch.carouselInterval')) {
        statusBar.onConfigChanged();
      }
    }),
  );
}

export function deactivate(): void {}
