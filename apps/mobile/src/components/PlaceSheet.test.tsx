import { fireEvent, render, screen } from '@testing-library/react-native';
import { DEMO_PLACES } from '@wandro/shared';
import { queryWrapper } from '@/test/queryWrapper';
import { PlaceSheet } from './PlaceSheet';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a) } }));

const corner = DEMO_PLACES.find((p) => p.id === 'demo-music')!;
const adraga = DEMO_PLACES.find((p) => p.id === 'demo-adraga')!;
const wrapper = queryWrapper();

describe('PlaceSheet', () => {
  it('shows the category and the days and times for places with set hours', async () => {
    await render(
      <PlaceSheet place={corner} userPosition={corner} unlocked={false} onClose={() => {}} />,
      { wrapper },
    );
    expect(screen.getByText('Music & events')).toBeOnTheScreen();
    expect(screen.getByTestId('hours-chip')).toBeOnTheScreen();
    expect(screen.queryByTestId('time-quest')).toBeNull();

    await fireEvent.press(screen.getByTestId('tab-about'));
    expect(screen.getByText('Thu–Sat · 21:30–00:30')).toBeOnTheScreen();
  });

  it('has no hours for always-open places and links to the category page', async () => {
    await render(
      <PlaceSheet place={adraga} userPosition={adraga} unlocked={false} onClose={() => {}} />,
      { wrapper },
    );
    expect(screen.queryByTestId('hours-chip')).toBeNull();
    expect(screen.getByText('Beaches & coast')).toBeOnTheScreen();
    expect(screen.getByTestId('time-quest')).toHaveTextContent(/Golden-hour quest/);

    await fireEvent.press(screen.getByTestId('tab-about'));
    await fireEvent.press(screen.getByRole('link', { name: /More about Beaches & coast/ }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/discover/[category]',
      params: { category: 'coast' },
    });
  });

  const pena = DEMO_PLACES.find((p) => p.id === 'demo-pena')!;
  const [fact1, fact2, fact3] = pena.details!.facts.map((f) => f.text);

  it('Learn shows every fact before discovery', async () => {
    await render(
      <PlaceSheet place={pena} userPosition={pena} unlocked={false} onClose={() => {}} />,
      { wrapper },
    );
    expect(screen.getByText(pena.details!.teaser)).toBeOnTheScreen();
    expect(screen.getByText(fact1!)).toBeOnTheScreen();
    expect(screen.getByText(fact2!)).toBeOnTheScreen();
    expect(screen.getByText(fact3!)).toBeOnTheScreen();
    expect(screen.getByText(/Triton arch/)).toBeOnTheScreen();
  });

  it('opens straight onto Learn, with the fact count on the tab', async () => {
    await render(
      <PlaceSheet place={pena} userPosition={pena} unlocked={false} onClose={() => {}} />,
      { wrapper },
    );
    const learn = screen.getByRole('tab', {
      name: `Learn: ${pena.details!.facts.length} facts about this place`,
    });
    expect(learn).toBeSelected();
    expect(screen.getByTestId('place-learn')).toBeOnTheScreen();
    expect(screen.getByText(fact1!)).toBeOnTheScreen();

    // Tapping the open tab folds the card down to its peek, teaser still showing.
    await fireEvent.press(learn);
    expect(screen.queryByText(fact1!)).toBeNull();
    expect(screen.getByTestId('peek-teaser')).toHaveTextContent(pena.details!.teaser);
  });

  it('places without facts open on the short card', async () => {
    const bare = { ...pena, id: 'demo-bare', details: undefined };
    await render(
      <PlaceSheet place={bare} userPosition={bare} unlocked={false} onClose={() => {}} />,
      { wrapper },
    );
    expect(screen.queryByTestId('place-learn')).toBeNull();
    expect(screen.getByTestId('tab-learn')).not.toBeSelected();
  });

  it('Learn reveals every fact once discovered', async () => {
    await render(<PlaceSheet place={pena} userPosition={pena} unlocked onClose={() => {}} />, {
      wrapper,
    });
    expect(screen.getByText(fact2!)).toBeOnTheScreen();
    expect(screen.queryByTestId('fact-locked')).toBeNull();
  });

  it('Plan shows time, cost, access and a nearby place to pair it with', async () => {
    const mouros = DEMO_PLACES.find((p) => p.id === 'demo-mouros')!;
    await render(
      <PlaceSheet
        place={pena}
        others={[pena, mouros, adraga]}
        userPosition={pena}
        unlocked={false}
        onClose={() => {}}
      />,
      { wrapper },
    );
    await fireEvent.press(screen.getByTestId('tab-plan'));
    expect(screen.getByText('About 2 h')).toBeOnTheScreen();
    expect(screen.getByText('Ticket needed')).toBeOnTheScreen();
    expect(screen.getByText('Steep climb')).toBeOnTheScreen();
    expect(screen.getByText(/^Castle of the Moors · /)).toBeOnTheScreen();
  });

  it('Learn shows the facts without source links', async () => {
    const museum = DEMO_PLACES.find((p) => p.id === 'demo-sintra-natural-history')!;
    await render(<PlaceSheet place={museum} userPosition={museum} unlocked onClose={() => {}} />, {
      wrapper,
    });
    expect(screen.queryByTestId('fact-source')).toBeNull();
    expect(screen.getByText(/Nantan meteorite/)).toBeOnTheScreen();
  });

  it('Plan shows safety and access tips', async () => {
    const cabo = DEMO_PLACES.find((p) => p.id === 'demo-cabo')!;
    await render(
      <PlaceSheet place={cabo} userPosition={cabo} unlocked={false} onClose={() => {}} />,
      { wrapper },
    );
    await fireEvent.press(screen.getByTestId('tab-plan'));
    expect(screen.getByTestId('place-tip')).toHaveTextContent(/fences/);
  });
});
