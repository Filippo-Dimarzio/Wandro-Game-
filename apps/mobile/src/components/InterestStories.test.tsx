import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { CATEGORIES, DEMO_PLACES } from '@wandro/shared';
import { InterestStories } from '@/components/InterestStories';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

describe('InterestStories', () => {
  beforeEach(() => jest.mocked(router.push).mockClear());

  it('shows every interest as a story and opens the map filtered to it', async () => {
    await render(<InterestStories places={DEMO_PLACES} unlocked={new Set()} />);
    for (const cat of CATEGORIES) expect(screen.getByTestId(`interest-${cat}`)).toBeOnTheScreen();
    await act(async () => void fireEvent.press(screen.getByTestId('interest-coast')));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/(tabs)/explore',
      params: expect.objectContaining({ category: 'coast' }),
    });
  });

  it('says how much is left to discover in each interest', async () => {
    const coast = DEMO_PLACES.filter((p) => p.category === 'coast');
    await render(
      <InterestStories places={coast} unlocked={new Set(coast.slice(1).map((p) => p.id))} />,
    );
    expect(screen.getByLabelText(/^Beaches & coast, 1 to discover/)).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Nature, all discovered/)).toBeOnTheScreen();
  });
});
