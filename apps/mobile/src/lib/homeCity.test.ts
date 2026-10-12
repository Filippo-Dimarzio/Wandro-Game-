import { homeCityLabel } from './homeCity';

describe('homeCityLabel', () => {
  it('turns a launch city into its name and flag, however it was typed', () => {
    expect(homeCityLabel('lisbon')).toEqual({ flag: '🇵🇹', name: 'Lisbon' });
    expect(homeCityLabel(' Lisboa ')).toEqual({ flag: '🇵🇹', name: 'Lisbon' });
    expect(homeCityLabel('evora')).toEqual({ flag: '🇵🇹', name: 'Évora' });
  });

  it('keeps any other city, capitalised, with a pin', () => {
    expect(homeCityLabel('new york')).toEqual({ flag: '📍', name: 'New York' });
  });

  it('shows nothing when no city was given', () => {
    expect(homeCityLabel('')).toBeNull();
    expect(homeCityLabel(undefined)).toBeNull();
  });
});
