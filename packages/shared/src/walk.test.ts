import { haversineMeters } from './geo';
import { approachProgress, moveBy, proximity, walkingMinutes } from './walk';

describe('walking helpers', () => {
  const start = { lat: 38.7975, lng: -9.3905 };
  it('moves by metres east and north', () => {
    expect(haversineMeters(start, moveBy(start, 100, 0))).toBeCloseTo(100, 0);
    expect(haversineMeters(start, moveBy(start, 0, -250))).toBeCloseTo(250, 0);
    expect(haversineMeters(start, moveBy(start, 30, 40))).toBeCloseTo(50, 0);
  });
  it('estimates walking time', () => {
    expect(walkingMinutes(10)).toBe(1);
    expect(walkingMinutes(780)).toBe(10);
  });
  it('labels proximity like Find My', () => {
    expect(proximity(50, 75)).toBe('here');
    expect(proximity(200, 75)).toBe('close');
    expect(proximity(400, 75)).toBe('warmer');
    expect(proximity(2000, 75)).toBe('far');
  });
  it('tracks approach progress', () => {
    expect(approachProgress(1075, 1075, 75)).toBe(0);
    expect(approachProgress(1075, 575, 75)).toBeCloseTo(0.5);
    expect(approachProgress(1075, 20, 75)).toBe(1);
    expect(approachProgress(1075, 3000, 75)).toBe(0);
  });
});
