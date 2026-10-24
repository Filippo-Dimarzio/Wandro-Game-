import { render, screen } from '@testing-library/react-native';
import { FIT_BACKDROP_BLUR, FitImage } from './FitImage';

describe('FitImage', () => {
  it('shows the whole image over a blurred copy that fills the frame', async () => {
    await render(
      <FitImage
        source={{ uri: 'https://example.org/a.jpg' }}
        accessibilityLabel="Pena"
        testID="pic"
      />,
    );
    const pic = screen.getByTestId('pic');
    expect(pic.props.contentFit).toBe('contain');
    expect(screen.getByLabelText('Pena')).toBe(pic);
    const backdrop = screen.getByTestId('fit-backdrop');
    expect(backdrop.props.contentFit).toBe('cover');
    expect(backdrop.props.blurRadius).toBe(FIT_BACKDROP_BLUR);
  });
});
