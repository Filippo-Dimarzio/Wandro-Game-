import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { HoldToConfirm } from './HoldToConfirm';

jest.useFakeTimers();

const advance = (ms: number) => act(async () => void jest.advanceTimersByTime(ms));

describe('HoldToConfirm', () => {
  it('confirms after holding for the full duration', async () => {
    const onConfirm = jest.fn();
    await render(
      <HoldToConfirm
        label="Hold"
        accessibilityLabel="Confirm"
        onConfirm={onConfirm}
        durationMs={500}
      />,
    );
    await fireEvent(screen.getByRole('button', { name: 'Confirm' }), 'pressIn');
    await advance(600);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cancels when released early', async () => {
    const onConfirm = jest.fn();
    await render(
      <HoldToConfirm
        label="Hold"
        accessibilityLabel="Confirm"
        onConfirm={onConfirm}
        durationMs={500}
      />,
    );
    const button = screen.getByRole('button', { name: 'Confirm' });
    await fireEvent(button, 'pressIn');
    await advance(200);
    await fireEvent(button, 'pressOut');
    await advance(600);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('lets screen-reader users confirm with the activate action', async () => {
    const onConfirm = jest.fn();
    await render(<HoldToConfirm label="Hold" accessibilityLabel="Confirm" onConfirm={onConfirm} />);
    await fireEvent(screen.getByRole('button', { name: 'Confirm' }), 'accessibilityAction', {
      nativeEvent: { actionName: 'activate' },
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does nothing when disabled', async () => {
    const onConfirm = jest.fn();
    await render(
      <HoldToConfirm label="Hold" accessibilityLabel="Confirm" onConfirm={onConfirm} disabled />,
    );
    const button = screen.getByRole('button', { name: 'Confirm' });
    await fireEvent(button, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
    await fireEvent(button, 'pressIn');
    await advance(2000);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
