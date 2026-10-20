/** Webmail for the big providers, so "Check your email" can open the right inbox directly. */
const PROVIDERS: { domains: string[]; name: string; url: string }[] = [
  { domains: ['gmail.com', 'googlemail.com'], name: 'Gmail', url: 'https://mail.google.com/' },
  {
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'outlook.pt', 'hotmail.co.uk'],
    name: 'Outlook',
    url: 'https://outlook.live.com/mail/',
  },
  {
    domains: ['yahoo.com', 'yahoo.co.uk', 'ymail.com'],
    name: 'Yahoo Mail',
    url: 'https://mail.yahoo.com/',
  },
  {
    domains: ['icloud.com', 'me.com', 'mac.com'],
    name: 'iCloud Mail',
    url: 'https://www.icloud.com/mail',
  },
  { domains: ['sapo.pt'], name: 'SAPO Mail', url: 'https://mail.sapo.pt/' },
];

export function mailboxFor(email: string): { name: string; url: string } | null {
  const domain = email.trim().toLowerCase().split('@')[1] ?? '';
  const p = PROVIDERS.find((x) => x.domains.includes(domain));
  return p ? { name: p.name, url: p.url } : null;
}

/** f•••7@gmail.com: enough to recognise your address without showing it in full. */
export function maskEmail(email: string): string {
  const [user = '', domain = ''] = email.trim().split('@');
  if (!domain) return email;
  const shown = user.length <= 2 ? user.slice(0, 1) : `${user[0]}•••${user[user.length - 1]}`;
  return `${shown}@${domain}`;
}
