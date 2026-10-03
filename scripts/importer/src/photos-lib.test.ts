import { pickCandidate, photoSeedSql, photosModule, stripHtml } from './photos-lib';
import type { Place } from '@wandro/shared';

const eiffel = { lat: 48.8584, lng: 2.2945 };

describe('photo matching', () => {
  it('picks the nearest candidate within 1.5 km, ignoring namesakes elsewhere', () => {
    const near = { qid: 'Q243', lat: 48.8583, lng: 2.2944, image: 'Tour Eiffel.jpg' };
    const replica = { qid: 'Q1', lat: 36.1125, lng: -115.1707, image: 'Las Vegas.jpg' };
    expect(pickCandidate(eiffel, [replica, near])?.qid).toBe('Q243');
    expect(pickCandidate(eiffel, [replica])).toBeNull();
  });

  it('turns Commons author HTML into a plain name', () => {
    expect(stripHtml('<a href="//commons.wikimedia.org/wiki/User:Ana">Ana &amp; Rui</a>')).toBe(
      'Ana & Rui',
    );
  });
});

describe('generated outputs', () => {
  const photo = {
    url: 'https://upload.wikimedia.org/x.jpg',
    author: "O'Brien",
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:X.jpg',
  };
  const place = { id: 'demo-paris-eiffel', name: 'Eiffel Tower', region: 'paris' } as Place;

  it('writes a typed module keyed by place id', () => {
    const mod = photosModule({ 'demo-paris-eiffel': photo });
    expect(mod).toContain('"demo-paris-eiffel": {"url":"https://upload.wikimedia.org/x.jpg"');
    expect(mod).toContain('export const PLACE_PHOTOS');
  });

  it('replaces the seed block in place, escaping quotes', () => {
    const once = photoSeedSql('-- seed\n', { 'demo-paris-eiffel': photo }, [place]);
    expect(once).toContain(
      "('paris', 'Eiffel Tower', 'https://upload.wikimedia.org/x.jpg', 'O''Brien'",
    );
    const twice = photoSeedSql(once, {}, [place]);
    expect(twice).not.toContain('Eiffel Tower');
    expect(twice.match(/BEGIN generated place photos/g)).toHaveLength(1);
  });
});
