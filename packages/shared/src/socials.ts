/**
 * Social links on a profile. Only handles are stored (the server enforces the same shape in
 * valid_social_links); the app builds each link, so nobody can disguise a link on a profile.
 */
export const SOCIAL_NETWORKS = ['instagram', 'facebook', 'x', 'tripbff'] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];
export type SocialLinks = Partial<Record<SocialNetwork, string>>;

interface Rule {
  pattern: RegExp;
  hosts: string[];
  /** Public profile link; TripBFF has no documented web profile links, so it has none. */
  url?: (handle: string) => string;
}

const RULES: Record<SocialNetwork, Rule> = {
  instagram: {
    pattern: /^[A-Za-z0-9._]{1,30}$/,
    hosts: ['instagram.com'],
    url: (h) => `https://www.instagram.com/${h}`,
  },
  facebook: {
    // A vanity name (5+ characters) or the number in profile.php?id=…
    pattern: /^(?:[A-Za-z0-9.]{5,50}|\d{1,20})$/,
    hosts: ['facebook.com', 'fb.com'],
    url: (h) =>
      /^\d+$/.test(h)
        ? `https://www.facebook.com/profile.php?id=${h}`
        : `https://www.facebook.com/${h}`,
  },
  x: {
    pattern: /^[A-Za-z0-9_]{1,15}$/,
    hosts: ['x.com', 'twitter.com'],
    url: (h) => `https://x.com/${h}`,
  },
  tripbff: { pattern: /^[A-Za-z0-9._-]{1,30}$/, hosts: ['tripbff.com'] },
};

/**
 * Turn what a player typed (a handle, "@handle" or a pasted profile link) into a handle.
 * Returns '' for an empty box (remove the link) and null when it isn't valid for that network.
 */
export function parseSocialHandle(network: SocialNetwork, input: string): string | null {
  let value = input.trim();
  if (!value) return '';
  const rule = RULES[network];
  if (/[/:]/.test(value)) {
    const m = /^(?:https?:\/\/)?(?:www\.|m\.|mobile\.)?([^/?#]+)\/?([^?#]*)(?:\?([^#]*))?/i.exec(
      value,
    );
    if (!m || !rule.hosts.includes(m[1]!.toLowerCase())) return null;
    const id = network === 'facebook' ? new URLSearchParams(m[3] ?? '').get('id') : null;
    value = id ?? m[2]!.split('/')[0] ?? '';
  }
  value = value.replace(/^@/, '');
  return rule.pattern.test(value) ? value : null;
}

/** The public profile link for a handle, or null where the network has none. */
export function socialUrl(network: SocialNetwork, handle: string): string | null {
  const rule = RULES[network];
  return rule.url && rule.pattern.test(handle) ? rule.url(handle) : null;
}

/** Keep only valid, non-empty handles, in the networks' display order. */
export function cleanSocialLinks(links: SocialLinks | null | undefined): SocialLinks {
  const out: SocialLinks = {};
  for (const n of SOCIAL_NETWORKS) {
    const h = links?.[n];
    if (h && RULES[n].pattern.test(h)) out[n] = h;
  }
  return out;
}
