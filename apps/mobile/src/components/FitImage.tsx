import { Image, type ImageProps } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/** Blur of the backdrop copy; enough to read as colour, not as a second picture. */
export const FIT_BACKDROP_BLUR = 24;

interface Props extends Omit<ImageProps, 'style' | 'contentFit'> {
  /** The frame: size, position, radius. The whole image is always fitted inside it. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Shows the whole image inside any frame, never cropped. Where the image and the frame have
 * different shapes, a blurred copy of the same image fills the gaps so there are no empty bars.
 */
export function FitImage({ style, source, blurRadius, ...rest }: Props) {
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
