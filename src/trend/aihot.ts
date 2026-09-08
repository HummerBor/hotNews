import { BOARD_NAMES, BoardId, TrendBoard, TrendItem, TrendProvider } from './types';
import { fetchJson } from './fetch';

// API 要求浏览器 UA（默认 curl UA 会被 403），后缀标识便于服务方区分流量来源
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36 hot-search-vscode/0.3.0',
  Accept: 'application/json',
};

interface AihotRawItem {
  title: string;
  url: string;
  source: string;
  publishedAt?: string | null;
  summary?: string | null;
  score?: number | null;
}

export interface AihotResponse {
  count?: number;
  items?: AihotRawItem[];
}

function relativeTime(iso?: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return '';
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 1)} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

function buildTooltip(raw: AihotRawItem): string | undefined {
  const meta = [raw.source, relativeTime(raw.publishedAt)].filter(Boolean).join(' · ');
  const tooltip = [meta, raw.summary ?? ''].filter(Boolean).join('\n');
  return tooltip || undefined;
}

export function parseAihotResponse(boardId: BoardId, json: AihotResponse): TrendBoard {
  const items: TrendItem[] = (json.items ?? []).map((raw, index) => ({
    rank: index + 1,
    title: raw.title,
    url: raw.url,
    badge: (raw.score ?? 0) >= 85 ? ('热' as const) : undefined,
    tooltip: buildTooltip(raw),
  }));

  return {
    platform: 'aihot',
    id: boardId,
    name: BOARD_NAMES[boardId],
    items,
    fetchedAt: Date.now(),
  };
}

export class AihotProvider implements TrendProvider {
  readonly id = 'aihot';
  readonly supportedBoards = ['selected', 'all'] as const;

  // boardId 直接对应 API 的 mode 参数（selected=精选 / all=全部动态）
  private static API_BASE = 'https://aihot.virxact.com/api/public/items?take=50&mode=';

  async fetchBoard(boardId: BoardId): Promise<TrendBoard> {
    if (!this.supportedBoards.includes(boardId as 'selected' | 'all')) {
      throw new Error(`AI HOT 不支持 ${boardId}`);
    }
    const json = await fetchJson<AihotResponse>(`${AihotProvider.API_BASE}${boardId}`, HEADERS);
    if (!Array.isArray(json.items)) throw new Error('AI HOT API 响应缺少 items');
    return parseAihotResponse(boardId, json);
  }
}
