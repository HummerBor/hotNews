import { BOARD_NAMES, BoardId, TrendBadge, TrendBoard, TrendItem, TrendProvider } from './types';
import { fetchJson } from './fetch';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Referer: 'https://s.weibo.com/',
  Accept: 'application/json',
};

interface WeiboRawItem {
  word: string;
  note?: string;
  realpos?: number;
  label_name?: string;
  icon_desc?: string;
  topic_flag?: number;
}

interface WeiboHotGov {
  word?: string;
  name?: string;
  note?: string;
  url?: string;
  icon_desc?: string;
  label_name?: string;
}

export interface WeiboResponse {
  ok?: number;
  data?: {
    realtime?: WeiboRawItem[];
    hotgov?: WeiboHotGov;
  };
}

function mapBadge(label?: string, iconDesc?: string): TrendBadge | undefined {
  const text = label || iconDesc;
  if (text === '新') return '新';
  if (text === '热') return '热';
  return undefined;
}

function weiboSearchUrl(word: string, topicFlag?: number): string {
  const q = encodeURIComponent(word);
  if (topicFlag === 1) {
    return `https://s.weibo.com/weibo?q=${q}`;
  }
  return `https://s.weibo.com/weibo?q=${q}&t=31&band_rank=1&Refer=top`;
}

export function parseWeiboResponse(json: WeiboResponse): TrendBoard {
  const items: TrendItem[] = [];
  const hotgov = json.data?.hotgov;

  if (hotgov?.word || hotgov?.name) {
    const title = hotgov.note || hotgov.word || hotgov.name || '';
    items.push({
      rank: 0,
      title,
      url: hotgov.url || weiboSearchUrl(title, 1),
      badge: mapBadge(hotgov.label_name, hotgov.icon_desc),
      isPinned: true,
    });
  }

  const realtime = json.data?.realtime ?? [];
  for (const raw of realtime) {
    const title = raw.note || raw.word;
    items.push({
      rank: raw.realpos ?? items.length,
      title,
      url: weiboSearchUrl(raw.word, raw.topic_flag),
      badge: mapBadge(raw.label_name, raw.icon_desc),
    });
  }

  return {
    platform: 'weibo',
    id: 'realtime',
    name: BOARD_NAMES.realtime,
    items,
    fetchedAt: Date.now(),
  };
}

export class WeiboProvider implements TrendProvider {
  readonly id = 'weibo';
  readonly supportedBoards = ['realtime'] as const;

  async fetchBoard(boardId: BoardId): Promise<TrendBoard> {
    if (boardId !== 'realtime') throw new Error('微博暂无财经榜');
    const json = await fetchJson<WeiboResponse>(
      'https://weibo.com/ajax/side/hotSearch',
      HEADERS,
    );
    if (json.ok !== 1) throw new Error('Weibo API ok!=1');
    return parseWeiboResponse(json);
  }
}
