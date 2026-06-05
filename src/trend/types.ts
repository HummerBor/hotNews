export type TrendBadge = '新' | '热';
export type PlatformId = 'baidu' | 'weibo' | 'tencent';
export type BoardId = 'realtime' | 'finance';
export type OpenMode = 'external' | 'simpleBrowser';

export interface TrendItem {
  rank: number;
  title: string;
  url: string;
  badge?: TrendBadge;
  isPinned?: boolean;
}

export interface TrendBoard {
  platform: PlatformId;
  id: BoardId;
  name: string;
  items: TrendItem[];
  fetchedAt: number;
}

export interface TrendProvider {
  readonly id: PlatformId;
  readonly supportedBoards: readonly BoardId[];
  fetchBoard(boardId: BoardId): Promise<TrendBoard>;
}

export const PLATFORM_NAMES: Record<PlatformId, string> = {
  baidu: '百度',
  weibo: '微博',
  tencent: '腾讯',
};

export const BOARD_NAMES: Record<BoardId, string> = {
  realtime: '热搜榜',
  finance: '财经榜',
};

export function boardCacheKey(platform: PlatformId, boardId: BoardId): string {
  return `${platform}:${boardId}`;
}

export const ALL_PLATFORMS: PlatformId[] = ['baidu', 'weibo', 'tencent'];
