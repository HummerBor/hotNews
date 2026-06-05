import { describe, it, expect } from 'vitest';
import { parseBaiduResponse } from '../src/trend/baidu';
import fixture from './fixtures/realtime.json';

describe('parseBaiduResponse', () => {
  it('parses pinned item and ranks', () => {
    const board = parseBaiduResponse('realtime', fixture);
    expect(board.name).toBe('热搜榜');
    expect(board.items[0].isPinned).toBe(true);
    expect(board.items[0].title).toBeTruthy();
    expect(board.items[1].rank).toBe(1);
    expect(board.items[1].title).toBeTruthy();
    expect(board.items[1].url).toMatch(/^https:\/\//);
  });

  it('parses all available items', () => {
    const board = parseBaiduResponse('realtime', fixture);
    const ranked = board.items.filter((i) => !i.isPinned);
    expect(ranked.length).toBeGreaterThan(15);
  });
});
