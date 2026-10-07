import { haversineMeters } from '@wandro/shared';
import { directionsUrl } from './directions';

const piriquita = { lat: 38.7978, lng: -9.3925 };
const from = (p: { lat: number; lng: number }) => haversineMeters(p, piriquita);

describe('directionsUrl', () => {
  it('walks to nearby places, with the place as the destination', () => {
    const near = { lat: 38.799, lng: -9.39 };
    expect(directionsUrl(piriquita, from(near), 'android')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=38.7978,-9.3925&travelmode=walking',
    );
    expect(directionsUrl(piriquita, from(near), 'ios')).toBe(
      'http://maps.apple.com/?daddr=38.7978,-9.3925&dirflg=w',
    );
  });

  it('lets the maps app choose car or transit across the city', () => {
    const lisbon = { lat: 38.7223, lng: -9.1393 };
    expect(directionsUrl(piriquita, from(lisbon), 'web')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=38.7978,-9.3925',
    );
  });

  it('shows the place itself when the player is far away, never a route from elsewhere', () => {
    const madrid = { lat: 40.4168, lng: -3.7038 };
    expect(directionsUrl(piriquita, from(madrid), 'web')).toBe(
      'https://www.google.com/maps/search/?api=1&query=38.7978,-9.3925',
    );
    expect(directionsUrl(piriquita, from(madrid), 'ios')).toBe(
      'http://maps.apple.com/?ll=38.7978,-9.3925&q=38.7978,-9.3925',
    );
  });

  it('never puts the player’s own location in the link', () => {
    const me = { lat: 38.71234, lng: -9.15678 };
    expect(directionsUrl(piriquita, from(me), 'web')).not.toContain('38.71234');
  });
});
