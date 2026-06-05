import { BoardId, BOARD_NAMES, TrendBadge, TrendBoard, TrendItem, TrendProvider } from './types';
import { fetchJson } from './fetch';

interface BaiduRawItem {
  word: string;
  url?: string;
  rawUrl?: string;
  index: number;
  hotTag?: string;
}

interface BaiduCard {
  content?: BaiduRawItem[];
  topContent?: BaiduRawItem[] | null;
}

export interface BaiduResponse {
  success?: boolean;
  data?: { cards?: BaiduCard[] };
}

function mapHotTag(hotTag?: string): TrendBadge | undefined {
  if (hotTag === '3') return '新';
  if (hotTag === '1') return '热';
  return undefined;
}

function mapItem(raw: BaiduRawItem, opts: { isPinned?: boolean; rank: number }): TrendItem {
  const title = raw.word;
  const url = raw.url || raw.rawUrl || `https://www.baidu.com/s?wd=${encodeURIComponent(title)}`;
  return {
    rank: opts.rank,
    title,
    url,
    badge: mapHotTag(raw.hotTag),
    isPinned: opts.isPinned,
  };
}

export function parseBaiduResponse(boardId: BoardId, json: BaiduResponse): TrendBoard {
  const card = json.data?.cards?.[0];
  const items: TrendItem[] = [];

  if (card?.topContent?.[0]) {
    items.push(mapItem(card.topContent[0], { isPinned: true, rank: 0 }));
  }

  const content = card?.content ?? [];
  for (const raw of content) {
    items.push(mapItem(raw, { rank: raw.index + 1 }));
  }

  return {
    platform: 'baidu',
    id: boardId,
    name: BOARD_NAMES[boardId],
    items,
    fetchedAt: Date.now(),
  };
}

export class BaiduProvider implements TrendProvider {
  readonly id = 'baidu';
  readonly supportedBoards = ['realtime', 'finance'] as const;

  private static API_BASE = 'https://top.baidu.com/api/board?platform=pc&tab=';
  private static HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    Referer: 'https://top.baidu.com/',
    Accept: 'application/json',
  };

  async fetchBoard(boardId: BoardId): Promise<TrendBoard> {
    const json = await fetchJson<BaiduResponse>(
      `${BaiduProvider.API_BASE}${boardId}`,
      BaiduProvider.HEADERS,
    );
    if (!json.success) throw new Error('API success=false');
    return parseBaiduResponse(boardId, json);
  }
}
