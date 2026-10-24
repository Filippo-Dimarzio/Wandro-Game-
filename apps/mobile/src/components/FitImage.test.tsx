import { render, screen } from '@testing-library/react-native';
import { FIT_BACKDROP_BLUR, FitImage } from './FitImage';

describe('FitImage', () => {
  it('fills its frame edge to edge, with no blurred backdrop', async () => {
    await render(
      <FitImage
        source={{ uri: 'https://example.org/a.jpg' }}
        accessibilityLabel="Pena"
        testID="pic"
      />,
    );
    const pic = screen.getByTestId('pic');
    expect(pic.props.contentFit).toBe('cover');
    expect(screen.getByLabelText('Pena')).toBe(pic);
    expect(screen.queryByTestId('fit-backdrop')).toBeNull();
  });

  it('shows the whole photo over a blurred copy when asked to', async () => {
    await render(
      <FitImage
        source={{ uri: 'https://example.org/a.jpg' }}
        whole
        accessibilityLabel="Pena"
        testID="pic"
      />,
    );
    expect(screen.getByTestId('pic').props.contentFit).toBe('contain');
    const backdrop = screen.getByTestId('fit-backdrop');
    expect(backdrop.props.contentFit).toBe('cover');
    expect(backdrop.props.blurRadius).toBe(FIT_BACKDROP_BLUR);
  });
});
