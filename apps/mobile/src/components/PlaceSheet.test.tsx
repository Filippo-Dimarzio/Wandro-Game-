import { fireEvent, render, screen } from '@testing-library/react-native';
import { DEMO_PLACES } from '@wandro/shared';
import { PlaceSheet } from './PlaceSheet';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a) } }));

const corner = DEMO_PLACES.find((p) => p.id === 'demo-music')!;
const adraga = DEMO_PLACES.find((p) => p.id === 'demo-adraga')!;

describe('PlaceSheet', () => {
  it('shows the category and the days and times for places with set hours', async () => {
    await render(
      <PlaceSheet place={corner} userPosition={corner} unlocked={false} onClose={() => {}} />,
    );
    expect(screen.getByText('Music & events')).toBeOnTheScreen();
    expect(screen.getByTestId('hours-chip')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Show details' }));
    expect(screen.getByText('Thu–Sat · 21:30–00:30')).toBeOnTheScreen();
  });

  it('has no hours for always-open places and links to the category page', async () => {
    await render(
      <PlaceSheet place={adraga} userPosition={adraga} unlocked={false} onClose={() => {}} />,
    );
    expect(screen.queryByTestId('hours-chip')).toBeNull();
    expect(screen.getByText('Beaches & coast')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Show details' }));
    await fireEvent.press(screen.getByRole('link', { name: /More about Beaches & coast/ }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/discover/[category]',
      params: { category: 'coast' },
    });
  });
});
