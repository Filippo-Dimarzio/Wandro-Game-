import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useSession } from '@/state/session';
import { HomeTip } from './HomeTip';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

describe('HomeTip: one tip at a time on Home', () => {
  beforeEach(() => useSession.getState().reset());

  it('shows how to play first, then the beta invite once it is closed', async () => {
    await render(<HomeTip discoveries={0} />);
    expect(screen.getByTestId('how-to-play')).toBeOnTheScreen();
    expect(screen.queryByTestId('join-beta-card')).toBeNull();

    await act(async () => void fireEvent.press(screen.getByTestId('how-to-play-dismiss')));
    expect(screen.queryByTestId('how-to-play')).toBeNull();
    expect(screen.getByTestId('join-beta-card')).toBeOnTheScreen();
    expect(useSession.getState().dismissedTips).toEqual(['howto']);
  });

  it('skips how to play after the first discovery, and stays closed once dismissed', async () => {
    await render(<HomeTip discoveries={3} />);
    expect(screen.queryByTestId('how-to-play')).toBeNull();
    await act(async () => void fireEvent.press(screen.getByTestId('join-beta-dismiss')));
    expect(screen.queryByTestId('join-beta-card')).toBeNull();
    expect(useSession.getState().dismissedTips).toContain('join');
  });
});
