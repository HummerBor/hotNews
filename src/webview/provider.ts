import * as vscode from 'vscode';
import { BoardId, PlatformId, TrendBoard } from '../trend/types';
import { TrendService } from '../trend/service';
import { getWebviewContent } from './getWebviewContent';

export class HotSearchViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private activePlatform: PlatformId = 'baidu';
  private activeBoard: BoardId = 'realtime';

  constructor(private service: TrendService) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = getWebviewContent(webviewView.webview);

    webviewView.onDidChangeVisibility((visible) => {
      if (visible) void this.fetchCurrent();
    });

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      switch (msg.type) {
        case 'ready':
          this.postConfig();
          this.sendBoard(this.service.getCached(this.activePlatform, this.activeBoard));
          if (webviewView.visible) await this.fetchCurrent();
          break;
        case 'switchPlatform':
          this.activePlatform = msg.platform;
          if (!this.service.supportsBoard(this.activePlatform, this.activeBoard)) {
            this.activeBoard = 'realtime';
          }
          this.postConfig();
          await this.fetchCurrent();
          break;
        case 'switchTab':
          this.activeBoard = msg.boardId;
          await this.fetchCurrent();
          break;
        case 'refresh':
          await this.fetchBoard(msg.platform, msg.boardId);
          break;
        case 'open':
          await this.openUrl(msg.url);
          break;
      }
    });
  }

  async refreshCurrent(): Promise<void> {
    await this.fetchCurrent();
  }

  private async fetchCurrent(): Promise<void> {
    await this.fetchBoard(this.activePlatform, this.activeBoard);
  }

  private async fetchBoard(platform: PlatformId, boardId: BoardId): Promise<void> {
    if (!this.view) return;
    this.view.webview.postMessage({ type: 'loading', platform, boardId });
    await this.service.refresh(platform, boardId);
  }

  private postConfig(): void {
    this.view?.webview.postMessage({
      type: 'config',
      platform: this.activePlatform,
      boardId: this.activeBoard,
      supportsFinance: this.service.supportsBoard(this.activePlatform, 'finance'),
    });
  }

  onBoardUpdated(board: TrendBoard): void {
    if (board.platform === this.activePlatform && board.id === this.activeBoard) {
      this.sendBoard(board);
    }
  }

  onError(platform: PlatformId, boardId: BoardId, message: string): void {
    if (platform === this.activePlatform && boardId === this.activeBoard) {
      this.view?.webview.postMessage({ type: 'error', platform, boardId, message });
    }
  }

  private sendBoard(board: TrendBoard | undefined): void {
    if (board && this.view) {
      this.view.webview.postMessage({ type: 'update', board });
    }
  }

  private async openUrl(url: string): Promise<void> {
    const mode = vscode.workspace.getConfiguration('hotSearch').get<string>('openMode', 'external');
    if (mode === 'simpleBrowser') {
      await vscode.commands.executeCommand('simpleBrowser.show', url);
    } else {
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }
  }

  reveal(): void {
    void vscode.commands.executeCommand('workbench.view.extension.hotSearch');
  }
}
