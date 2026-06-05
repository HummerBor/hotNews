import { describe, it, expect } from 'vitest';
import { parseTencentResponse } from '../src/trend/tencent';
import fixture from './fixtures/tencent.json';

describe('parseTencentResponse', () => {
  it('parses hot ranking list', () => {
    const board = parseTencentResponse(fixture);
    expect(board.platform).toBe('tencent');
    expect(board.items.length).toBeGreaterThan(0);
    expect(board.items[0].title).toBeTruthy();
    expect(board.items[0].url).toMatch(/^https:\/\//);
  });

  it('parses all available items', () => {
    const board = parseTencentResponse(fixture);
    const ranked = board.items.filter((i) => !i.isPinned);
    expect(ranked.length).toBeGreaterThan(15);
  });
});
