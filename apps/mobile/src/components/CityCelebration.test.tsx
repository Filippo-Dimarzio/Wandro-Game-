import { fireEvent, render, screen } from '@testing-library/react-native';
import { DEMO_PLACES } from '@wandro/shared';
import { CityCelebration } from './CityCelebration';
import { DEMO_COLLECTIONS } from '@/demo/collections';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const wrapper = queryWrapper();
const byId = (id: string) => DEMO_PLACES.find((p) => p.id === id)!;
const temple = byId('demo-evora-roman-temple');

describe('CityCelebration', () => {
  beforeEach(() => useSession.getState().reset());

  it('stamps a new city with fireworks', async () => {
    const r = useSession.getState().recordVisit(temple, DEMO_PLACES)!;
    await render(<CityCelebration place={temple} outcome={{ status: 'verified', ...r }} />, {
      wrapper,
    });
    expect(screen.getByText('Évora stamp collected!')).toBeOnTheScreen();
    expect(screen.getByTestId('fireworks')).toBeOnTheScreen();
    expect(screen.getByLabelText('Évora stamp')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('celebration-done'));
    expect(screen.queryByTestId('city-celebration')).toBeNull();
  });

  it('stays quiet for an ordinary discovery in a city you already have', async () => {
    useSession.getState().recordVisit(temple, DEMO_PLACES);
    const other = DEMO_PLACES.find((p) => p.region === 'evora' && !p.hidden && p.id !== temple.id)!;
    const r = useSession.getState().recordVisit(other, DEMO_PLACES)!;
    await render(<CityCelebration place={other} outcome={{ status: 'verified', ...r }} />, {
      wrapper,
    });
    expect(screen.queryByTestId('city-celebration')).toBeNull();
  });

  it('celebrates claiming a whole city', async () => {
    const ids = [
      ...new Set(DEMO_COLLECTIONS.filter((c) => c.region === 'evora').flatMap((c) => c.placeIds)),
    ];
    let last = { status: 'verified' as const };
    for (const id of ids)
      last = { status: 'verified', ...useSession.getState().recordVisit(byId(id), DEMO_PLACES)! };
    const place = byId(ids[ids.length - 1]!);
    await render(<CityCelebration place={place} outcome={last} />, { wrapper });
    expect(screen.getByText('You claimed all of Évora!')).toBeOnTheScreen();
  });

  it('does nothing for a rejected check-in', async () => {
    await render(
      <CityCelebration place={temple} outcome={{ status: 'rejected', reason: 'too_far' }} />,
      { wrapper },
    );
    expect(screen.queryByTestId('city-celebration')).toBeNull();
  });
});
