import { keepPhoto, KEPT_PHOTO_WIDTH } from './photo';
import { keepRecentPhotos, MAX_KEPT_PHOTOS, useSession, type DemoPost } from '@/state/session';

const mockResize = jest.fn();
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: () => ({
      resize: (o: unknown) => {
        mockResize(o);
        return {
          renderAsync: async () => ({ saveAsync: async () => ({ uri: 'x', base64: 'QUJD' }) }),
        };
      },
    }),
  },
}));
jest.mock('expo-image-picker', () => ({}));

describe('keepPhoto', () => {
  it('stores the photo itself, so it survives reloads and new deploys', async () => {
    expect(await keepPhoto('blob:https://app/123')).toBe('data:image/jpeg;base64,QUJD');
    expect(mockResize).toHaveBeenCalledWith({ width: KEPT_PHOTO_WIDTH });
  });

  it('leaves photos that are already stored alone', async () => {
    mockResize.mockClear();
    expect(await keepPhoto('data:image/jpeg;base64,AAA')).toBe('data:image/jpeg;base64,AAA');
    expect(mockResize).not.toHaveBeenCalled();
  });
});

describe('keepRecentPhotos', () => {
  const now = Date.parse('2026-10-05T12:00:00Z');
  const post = (i: number, hoursAgo: number): DemoPost => ({
    id: `p${i}`,
    placeId: 'demo-pena',
    caption: '',
    photoUri: 'data:image/jpeg;base64,AAA',
    at: new Date(now - hoursAgo * 3_600_000).toISOString(),
  });

  it('always keeps every photo from the last 24 hours', () => {
    const posts = Array.from({ length: MAX_KEPT_PHOTOS + 10 }, (_, i) => post(i, 1));
    expect(keepRecentPhotos(posts, now).every((p) => p.photoUri)).toBe(true);
  });

  it('thins out only old photos beyond the limit, keeping the posts', () => {
    const posts = Array.from({ length: MAX_KEPT_PHOTOS + 5 }, (_, i) => post(i, 48 + i));
    const kept = keepRecentPhotos(posts, now);
    expect(kept).toHaveLength(MAX_KEPT_PHOTOS + 5);
    expect(kept.filter((p) => p.photoUri)).toHaveLength(MAX_KEPT_PHOTOS);
    expect(kept[0]!.photoUri).toBeDefined();
    expect(kept.at(-1)!.photoUri).toBeUndefined();
  });
});

describe('saved state from an older version', () => {
  it('keeps posts but drops photo links that died with the old page', async () => {
    const persist = (
      useSession as unknown as {
        persist: { getOptions: () => { migrate: (s: unknown, v: number) => unknown } };
      }
    ).persist;
    const migrated = persist.getOptions().migrate(
      {
        posts: [
          { id: 'a', placeId: 'demo-pena', caption: 'hi', photoUri: 'blob:x', at: 'now' },
          {
            id: 'b',
            placeId: 'demo-pena',
            caption: '',
            photoUri: 'data:image/jpeg;base64,A',
            at: 'now',
          },
        ],
      },
      2,
    ) as { posts: DemoPost[] };
    expect(migrated.posts.map((p) => [p.id, p.photoUri])).toEqual([
      ['a', undefined],
      ['b', 'data:image/jpeg;base64,A'],
    ]);
  });
});
