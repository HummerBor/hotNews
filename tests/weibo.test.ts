import { describe, it, expect } from 'vitest';
import { parseWeiboResponse } from '../src/trend/weibo';
import fixture from './fixtures/weibo.json';

describe('parseWeiboResponse', () => {
  it('parses pinned hotgov and realtime items', () => {
    const board = parseWeiboResponse(fixture);
    expect(board.platform).toBe('weibo');
    expect(board.items[0].isPinned).toBe(true);
    expect(board.items[0].title).toBeTruthy();
    expect(board.items[1].rank).toBeGreaterThan(0);
    expect(board.items[1].url).toMatch(/^https:\/\/s\.weibo\.com/);
  });

  it('parses all available items', () => {
    const board = parseWeiboResponse(fixture);
    const ranked = board.items.filter((i) => !i.isPinned);
    expect(ranked.length).toBeGreaterThan(15);
  });
});
