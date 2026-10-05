import { fireEvent, render, screen } from '@testing-library/react-native';
import { EXPLORER_IDS, SHOP_ITEMS } from '@wandro/shared';
import { EXPLORER_ART, KIT_ART } from '@/explorerArt';
import { ExplorerAvatar, explorerImage } from './ExplorerAvatar';
import { ExplorerPicker } from './ExplorerPicker';

describe('explorer art', () => {
  it('has a drawing of every explorer in every outfit the Store sells', () => {
    const outfits = SHOP_ITEMS.filter((i) => i.kind === 'skin').map((i) => i.code);
    for (const id of EXPLORER_IDS) {
      expect(EXPLORER_ART[id].default).toBeDefined();
      for (const outfit of outfits) expect(EXPLORER_ART[id][outfit as 'default']).toBeDefined();
    }
    expect(Object.keys(KIT_ART).sort()).toEqual(['backpack', 'camera', 'map']);
  });

  it('falls back to the default explorer and jacket for unknown values', () => {
    expect(explorerImage('octopus', 'hat_crown')).toBe(EXPLORER_ART.e1.default);
    expect(explorerImage('e3', 'skin_coral')).toBe(EXPLORER_ART.e3.skin_coral);
  });
});

describe('ExplorerAvatar', () => {
  it('shows no kit for a new Wanderer', async () => {
    await render(<ExplorerAvatar explorer="e2" level={1} />);
    expect(screen.queryByTestId(/^kit-/)).toBeNull();
  });

  it('adds the map at Explorer rank and the camera at Cartographer', async () => {
    const { rerender } = await render(<ExplorerAvatar explorer="e2" level={3} />);
    expect(screen.getByTestId('kit-map')).toBeTruthy();
    await rerender(<ExplorerAvatar explorer="e2" level={10} />);
    expect(screen.getByTestId('kit-camera')).toBeTruthy();
  });
});

describe('ExplorerPicker', () => {
  it('offers every explorer and reports the one tapped', async () => {
    const onChange = jest.fn();
    await render(<ExplorerPicker value="e1" onChange={onChange} />);
    expect(screen.getAllByRole('radio')).toHaveLength(EXPLORER_IDS.length);
    expect(screen.getByTestId('explorer-e1')).toBeChecked();
    fireEvent.press(screen.getByTestId('explorer-e5'));
    expect(onChange).toHaveBeenCalledWith('e5');
  });
});
