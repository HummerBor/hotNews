import * as vscode from 'vscode';
import { BoardId, PlatformId, TrendBoard, TrendProvider } from './types';

type BoardListener = (board: TrendBoard) => void;
type ErrorListener = (platform: PlatformId, boardId: BoardId, error: Error) => void;

// 缓存新鲜度窗口：窗口内不重复发请求，直接复用缓存。
// AI HOT 服务端本身有 5 分钟缓存，拉得更勤拿到的也是同一份数据。
const FRESH_TTL_MS: Record<PlatformId, number> = {
  aihot: 5 * 60_000,
  baidu: 60_000,
  weibo: 60_000,
  tencent: 60_000,
};

// 手动刷新（换一换）的最小间隔，防止连点把请求打爆
const FORCE_COOLDOWN_MS = 10_000;

export class TrendService implements vscode.Disposable {
  private cache = new Map<string, TrendBoard>();
  private boardListeners = new Set<BoardListener>();
  private errorListeners = new Set<ErrorListener>();
  private inflight = new Map<string, Promise<TrendBoard | undefined>>();

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

  getBoards(platform: PlatformId): readonly BoardId[] {
    return this.providers.get(platform)?.supportedBoards ?? [];
  }

  async refresh(
    platform: PlatformId,
    boardId: BoardId,
    opts?: { force?: boolean },
  ): Promise<TrendBoard | undefined> {
    const provider = this.providers.get(platform);
    if (!provider) throw new Error(`未知平台: ${platform}`);
    if (!provider.supportedBoards.includes(boardId)) {
      throw new Error(`${platform} 不支持 ${boardId}`);
    }

    const key = `${platform}:${boardId}`;
    const cached = this.cache.get(key);

    if (cached) {
      const age = Date.now() - cached.fetchedAt;
      const limit = opts?.force ? FORCE_COOLDOWN_MS : FRESH_TTL_MS[platform];
      if (age < limit) {
        this.boardListeners.forEach((fn) => fn(cached));
        return cached;
      }
    }

    // 同一榜单的并发请求合并成一次（如切 tab 和可见性变化同时触发）
    const existing = this.inflight.get(key);
    if (existing) return existing;

    const task = (async () => {
      try {
        const board = await provider.fetchBoard(boardId);
        this.cache.set(key, board);
        this.boardListeners.forEach((fn) => fn(board));
        return board;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const fallback = this.cache.get(key);
        if (fallback) {
          // 有旧数据就先展示旧数据，不要报错清屏
          this.boardListeners.forEach((fn) => fn(fallback));
        } else {
          this.errorListeners.forEach((fn) => fn(platform, boardId, error));
        }
        return fallback;
      } finally {
        this.inflight.delete(key);
      }
    })();

    this.inflight.set(key, task);
    return task;
  }

  dispose(): void {
    this.boardListeners.clear();
    this.errorListeners.clear();
  }
}
