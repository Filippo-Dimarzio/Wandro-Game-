import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { DEMO_PLACES } from '@wandro/shared';
import { PhotoButton } from '@/components/PhotoSheet';
import { useCheckinPhoto } from '@/state/checkinPhoto';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/lib/photo', () => ({
  BlankPhotoError: class extends Error {},
  pickCleanPhoto: jest.fn(async (source: string) => `file:///${source}.jpg`),
  takeLivePhoto: jest.fn(async () => ({ photo: 'file:///back.jpg', selfie: 'file:///front.jpg' })),
  keepPhoto: jest.fn(async (uri: string) => uri),
}));

const pena = DEMO_PLACES.find((p) => p.id === 'demo-pena')!;
const adraga = DEMO_PLACES.find((p) => p.id === 'demo-adraga')!;

describe('PhotoButton and PhotoSheet', () => {
  beforeEach(() => {
    useSession.getState().reset();
    useCheckinPhoto.getState().clear();
    jest.mocked(router.push).mockClear();
  });

  it('opens a small box with camera, live, camera roll and files', async () => {
    await render(<PhotoButton place={pena} />, { wrapper: queryWrapper() });
    await fireEvent.press(screen.getByLabelText('Add a photo of Pena Palace'));
    expect(screen.getByTestId('photo-sheet')).toBeOnTheScreen();
    for (const key of ['camera', 'live', 'library', 'files'])
      expect(screen.getByTestId(`photo-source-${key}`)).toBeOnTheScreen();
  });

  it('posts straight to today’s moments for a place you’ve discovered', async () => {
    useSession.getState().recordVisit(pena, DEMO_PLACES);
    await render(<PhotoButton place={pena} />, { wrapper: queryWrapper() });
    await fireEvent.press(screen.getByLabelText('Add a photo of Pena Palace'));
    await fireEvent.press(screen.getByTestId('photo-source-library'));
    expect(await screen.findByTestId('photo-preview')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Post to today’s moments'));
    await waitFor(() => expect(useSession.getState().posts).toHaveLength(1));
    expect(useSession.getState().posts[0]).toMatchObject({
      placeId: pena.id,
      photoUri: 'file:///library.jpg',
    });
  });

  it('a live photo keeps its selfie, BeReal style', async () => {
    useSession.getState().recordVisit(pena, DEMO_PLACES);
    await render(<PhotoButton place={pena} />, { wrapper: queryWrapper() });
    await fireEvent.press(screen.getByLabelText('Add a photo of Pena Palace'));
    await fireEvent.press(screen.getByTestId('photo-source-live'));
    await screen.findByTestId('photo-preview');
    await fireEvent.press(screen.getByTestId('photo-submit'));
    await waitFor(() =>
      expect(useSession.getState().posts[0]).toMatchObject({
        photoUri: 'file:///back.jpg',
        selfieUri: 'file:///front.jpg',
      }),
    );
  });

  it('for a place not discovered yet, the photo rides along with the check-in', async () => {
    await render(<PhotoButton place={adraga} />, { wrapper: queryWrapper() });
    await fireEvent.press(screen.getByLabelText('Add a photo of Adraga Beach'));
    await fireEvent.press(screen.getByTestId('photo-source-camera'));
    await screen.findByTestId('photo-preview');
    await act(async () => void fireEvent.press(screen.getByText('Check in with this photo')));
    expect(useCheckinPhoto.getState().attached).toMatchObject({
      placeId: adraga.id,
      photo: 'file:///camera.jpg',
    });
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/(tabs)/capture',
      params: { place: adraga.id },
    });
    expect(useSession.getState().posts).toHaveLength(0);
  });
});
