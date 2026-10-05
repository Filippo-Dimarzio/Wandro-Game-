import { DEFAULT_EXPLORER, EXPLORER_IDS, explorerFor, isExplorerId } from './explorers';

describe('explorers', () => {
  it('offers eight explorers, starting with the default', () => {
    expect(EXPLORER_IDS).toHaveLength(8);
    expect(EXPLORER_IDS[0]).toBe(DEFAULT_EXPLORER);
  });

  it('only accepts known explorer ids', () => {
    expect(isExplorerId('e3')).toBe(true);
    expect(isExplorerId('octopus')).toBe(false);
    expect(isExplorerId(undefined)).toBe(false);
  });

  it("uses a player's own choice when they have one", () => {
    expect(explorerFor('user-1', 'e5')).toBe('e5');
  });

  it('gives players without a choice a steady explorer from their id', () => {
    const a = explorerFor('3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90');
    expect(EXPLORER_IDS).toContain(a);
    expect(explorerFor('3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90', null)).toBe(a);
    expect(explorerFor('3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90', 'not-an-explorer')).toBe(a);
  });
});
