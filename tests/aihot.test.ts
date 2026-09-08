import { describe, it, expect } from 'vitest';
import { parseAihotResponse } from '../src/trend/aihot';
import fixture from './fixtures/aihot.json';

describe('parseAihotResponse', () => {
  it('parses items with rank, badge and tooltip', () => {
    const board = parseAihotResponse('selected', fixture);
    expect(board.platform).toBe('aihot');
    expect(board.name).toBe('精选');
    expect(board.items).toHaveLength(3);

    const first = board.items[0];
    expect(first.rank).toBe(1);
    expect(first.title).toBe('OpenAI 发布新一代模型');
    expect(first.url).toMatch(/^https:\/\//);
    expect(first.badge).toBe('热');
    expect(first.tooltip).toContain('OpenAI Blog');
    expect(first.tooltip).toContain('新模型在推理能力上大幅提升。');
  });

  it('omits badge below score threshold and handles null fields', () => {
    const board = parseAihotResponse('all', fixture);
    expect(board.name).toBe('AI 动态');
    expect(board.items[1].badge).toBeUndefined();

    const bare = board.items[2];
    expect(bare.badge).toBeUndefined();
    expect(bare.tooltip).toBe('Hacker News');
  });
});
