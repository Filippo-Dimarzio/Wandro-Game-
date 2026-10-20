import { Ionicons } from '@expo/vector-icons';
import { cleanSocialLinks, socialUrl, type SocialLinks, type SocialNetwork } from '@wandro/shared';
import { Linking, Pressable, StyleSheet, Text } from 'react-native';
import { t } from '@/i18n';
import { radius, useColors } from '@/theme';

export const SOCIAL_ICONS: Record<SocialNetwork, React.ComponentProps<typeof Ionicons>['name']> = {
  instagram: 'logo-instagram',
  facebook: 'logo-facebook',
  x: 'logo-x',
  // TripBFF has no icon in the set; it's a travel app, so a plane.
  tripbff: 'airplane',
};

/** One rounded chip per social handle, styled like the home-city chip they sit beside. */
export function SocialChips({ links }: { links: SocialLinks | null | undefined }) {
  const c = useColors();
  return (
    <>
      {Object.entries(cleanSocialLinks(links)).map(([key, handle]) => {
        const network = key as SocialNetwork;
        const url = socialUrl(network, handle);
        const name = t(`social.${network}`);
        return (
          <Pressable
            key={network}
            onPress={url ? () => Linking.openURL(url) : undefined}
            disabled={!url}
            accessibilityRole={url ? 'link' : 'text'}
            accessibilityLabel={
              url
                ? t('social.open', { network: name, handle })
                : t('social.handle', { network: name, handle })
            }
            style={[styles.chip, { backgroundColor: c.surface }]}
            testID={`social-chip-${network}`}
          >
            <Ionicons name={SOCIAL_ICONS[network]} size={16} color={c.text} />
            <Text style={{ color: c.text, fontWeight: '700' }} numberOfLines={1}>
              @{handle}
            </Text>
          </Pressable>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    minHeight: 40,
    maxWidth: '100%',
  },
});
