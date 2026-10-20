import { mailboxFor, maskEmail } from './mailbox';

describe('mailbox', () => {
  it('opens Gmail for Gmail addresses, and other big providers too', () => {
    expect(mailboxFor('Fil@GMAIL.com')).toEqual({ name: 'Gmail', url: 'https://mail.google.com/' });
    expect(mailboxFor('a@hotmail.com')?.name).toBe('Outlook');
    expect(mailboxFor('a@icloud.com')?.name).toBe('iCloud Mail');
    expect(mailboxFor('a@company.pt')).toBeNull();
  });

  it('masks the address', () => {
    expect(maskEmail('fdmvlogs7@gmail.com')).toBe('f•••7@gmail.com');
    expect(maskEmail('ab@x.pt')).toBe('a@x.pt');
  });
});
