import * as vscode from 'vscode';
import { BOARD_NAMES, BoardId, PlatformId, TrendBoard } from '../trend/types';
import { TrendService } from '../trend/service';
import { getWebviewContent } from './getWebviewContent';

export type ActiveBoardListener = (platform: PlatformId, boardId: BoardId) => void;

export class HotSearchViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private activePlatform: PlatformId = 'aihot';
  private activeBoard: BoardId = 'selected';

  constructor(
    private service: TrendService,
    private extensionUri: vscode.Uri,
    private onActiveBoardChanged?: ActiveBoardListener,
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')],
    };
    webviewView.webview.html = getWebviewContent(
      webviewView.webview,
      vscode.Uri.joinPath(this.extensionUri, 'media', 'pi-icon.png'),
    );

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) void this.fetchCurrent();
    });

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      switch (msg.type) {
        case 'ready':
          this.postConfig();
          this.sendBoard(this.service.getCached(this.activePlatform, this.activeBoard));
          if (webviewView.visible) await this.fetchCurrent();
          break;
        case 'switchPlatform': {
          this.activePlatform = msg.platform;
          const boards = this.service.getBoards(this.activePlatform);
          if (!boards.includes(this.activeBoard)) {
            this.activeBoard = boards[0];
          }
          this.notifyActiveChanged();
          this.postConfig();
          await this.fetchCurrent();
          break;
        }
        case 'switchTab':
          this.activeBoard = msg.boardId;
          this.notifyActiveChanged();
          await this.fetchCurrent();
          break;
        case 'refresh':
          await this.fetchBoard(msg.platform, msg.boardId, { force: true });
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

  private notifyActiveChanged(): void {
    this.onActiveBoardChanged?.(this.activePlatform, this.activeBoard);
  }

  private async fetchCurrent(): Promise<void> {
    await this.fetchBoard(this.activePlatform, this.activeBoard);
  }

  private async fetchBoard(
    platform: PlatformId,
    boardId: BoardId,
    opts?: { force?: boolean },
  ): Promise<void> {
    if (!this.view) return;
    // 有缓存就先展示缓存，避免"加载中"清屏闪烁；没有才显示加载状态
    const cached = this.service.getCached(platform, boardId);
    if (cached) {
      this.sendBoard(cached);
    } else {
      this.view.webview.postMessage({ type: 'loading', platform, boardId });
    }
    await this.service.refresh(platform, boardId, opts);
  }

  private postConfig(): void {
    this.view?.webview.postMessage({
      type: 'config',
      platform: this.activePlatform,
      boardId: this.activeBoard,
      boards: this.service
        .getBoards(this.activePlatform)
        .map((id) => ({ id, name: BOARD_NAMES[id] })),
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
