import { Image, type ImageProps } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/** Blur of the backdrop copy; enough to read as colour, not as a second picture. */
export const FIT_BACKDROP_BLUR = 24;

interface Props extends Omit<ImageProps, 'style' | 'contentFit'> {
  /** The frame: size, position, radius. */
  style?: StyleProp<ViewStyle>;
  /**
   * Show the whole image, never cropped, with a blurred copy filling any gaps. Only for places
   * where every pixel matters (checking a photo before posting it); everywhere else the picture
   * fills its frame edge to edge.
   */
  whole?: boolean;
}

/**
 * A picture that fits its frame like a puzzle piece: it fills the frame edge to edge, centred, so
 * cards, tiles and banners never show bars or blurred sides. Illustrations are drawn with their
 * subject in the middle so they survive any crop, from a circle to a wide banner.
 */
export function FitImage({ style, source, blurRadius, whole, ...rest }: Props) {
  if (!whole)
    return (
      <View style={[styles.frame, style]}>
        <Image
          {...rest}
          source={source}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="center"
          blurRadius={blurRadius}
        />
      </View>
    );
  return (
    <View style={[styles.frame, style]}>
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        blurRadius={Math.max(blurRadius ?? 0, FIT_BACKDROP_BLUR)}
        accessible={false}
        testID="fit-backdrop"
      />
      <Image
        {...rest}
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        blurRadius={blurRadius}
      />
    </View>
  );
}

const styles = StyleSheet.create({ frame: { overflow: 'hidden' } });
