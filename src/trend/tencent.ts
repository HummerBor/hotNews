import { BOARD_NAMES, BoardId, TrendBadge, TrendBoard, TrendItem, TrendProvider } from './types';
import { fetchJson } from './fetch';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Referer: 'https://news.qq.com/',
  Accept: 'application/json',
};

interface TencentHotEvent {
  ranking?: number;
  is_top?: number;
}

interface TencentRawItem {
  id?: string;
  title?: string;
  url?: string;
  surl?: string;
  articletype?: string;
  hotEvent?: TencentHotEvent;
  rec_icon?: string;
}

export interface TencentResponse {
  ret?: number;
  idlist?: Array<{ newslist?: TencentRawItem[] }>;
}

function mapTencentBadge(recIcon?: string): TrendBadge | undefined {
  if (!recIcon) return undefined;
  if (recIcon.includes('hot') || recIcon.includes('ra2b')) return '热';
  return undefined;
}

export function parseTencentResponse(json: TencentResponse): TrendBoard {
  const newslist = json.idlist?.[0]?.newslist ?? [];
  const items: TrendItem[] = [];

  for (const raw of newslist) {
    if (raw.articletype === '560' || !raw.title) continue;

    const hotEvent = raw.hotEvent;
    const isPinned = hotEvent?.is_top === 1;
    const rank = isPinned ? 0 : (hotEvent?.ranking ?? items.length + 1);
    const url = raw.url || raw.surl || `https://news.qq.com/rain/a/${raw.id}`;

    items.push({
      rank,
      title: raw.title,
      url,
      badge: mapTencentBadge(raw.rec_icon),
      isPinned,
    });
  }

  return {
    platform: 'tencent',
    id: 'realtime',
    name: BOARD_NAMES.realtime,
    items,
    fetchedAt: Date.now(),
  };
}

export class TencentProvider implements TrendProvider {
  readonly id = 'tencent';
  readonly supportedBoards = ['realtime'] as const;

  async fetchBoard(boardId: BoardId): Promise<TrendBoard> {
    if (boardId !== 'realtime') throw new Error('腾讯暂无财经榜');
    const json = await fetchJson<TencentResponse>(
      'https://r.inews.qq.com/gw/event/hot_ranking_list?page_size=60',
      HEADERS,
    );
    if (json.ret !== 0) throw new Error('Tencent API ret!=0');
    return parseTencentResponse(json);
  }
}
