export type TrendBadge = '新' | '热';
export type PlatformId = 'aihot' | 'baidu' | 'weibo' | 'tencent';
export type BoardId = 'realtime' | 'finance' | 'selected' | 'all';

export interface TrendItem {
  rank: number;
  title: string;
  url: string;
  badge?: TrendBadge;
  isPinned?: boolean;
  /** hover 提示，AI HOT 条目用来放 来源 · 时间 + 摘要 */
  tooltip?: string;
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

export const BOARD_NAMES: Record<BoardId, string> = {
  realtime: '热搜榜',
  finance: '财经榜',
  selected: '精选',
  all: 'AI 动态',
};
