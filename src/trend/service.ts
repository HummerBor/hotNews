import * as vscode from 'vscode';
import { BoardId, PlatformId, TrendBoard, TrendProvider } from './types';

type BoardListener = (board: TrendBoard) => void;
type ErrorListener = (platform: PlatformId, boardId: BoardId, error: Error) => void;

export class TrendService implements vscode.Disposable {
  private cache = new Map<string, TrendBoard>();
  private boardListeners = new Set<BoardListener>();
  private errorListeners = new Set<ErrorListener>();

  constructor(private providers: Map<PlatformId, TrendProvider>) {}

  onBoardUpdated(fn: BoardListener): vscode.Disposable {
    this.boardListeners.add(fn);
    return { dispose: () => this.boardListeners.delete(fn) };
  }

  onError(fn: ErrorListener): vscode.Disposable {
    this.errorListeners.add(fn);
    return { dispose: () => this.errorListeners.delete(fn) };
  }

  getCached(platform: PlatformId, boardId: BoardId): TrendBoard | undefined {
    return this.cache.get(`${platform}:${boardId}`);
  }

  supportsBoard(platform: PlatformId, boardId: BoardId): boolean {
    const provider = this.providers.get(platform);
    return provider?.supportedBoards.includes(boardId) ?? false;
  }

  async refresh(platform: PlatformId, boardId: BoardId): Promise<TrendBoard | undefined> {
    const provider = this.providers.get(platform);
    if (!provider) throw new Error(`未知平台: ${platform}`);
    if (!provider.supportedBoards.includes(boardId)) {
      throw new Error(`${platform} 不支持 ${boardId}`);
    }

    try {
      const board = await provider.fetchBoard(boardId);
      this.cache.set(`${platform}:${boardId}`, board);
      this.boardListeners.forEach((fn) => fn(board));
      return board;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.errorListeners.forEach((fn) => fn(platform, boardId, error));
      return this.cache.get(`${platform}:${boardId}`);
    }
  }

  dispose(): void {
    this.boardListeners.clear();
    this.errorListeners.clear();
  }
}
