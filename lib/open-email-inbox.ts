import * as Linking from 'expo-linking';

const MAIL_CLIENTS = [
  'googlegmail://',
  'ms-outlook://',
  'ymail://',
  'readdle-spark://',
  'message://',
] as const;

function webInboxUrl(address: string): string | null {
  const domain = address.split('@')[1]?.toLowerCase();

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return 'https://mail.google.com/mail/u/0/#inbox';
  }
  if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com' || domain === 'msn.com') {
    return 'https://outlook.live.com/mail/0/inbox';
  }
  if (domain === 'yahoo.com' || domain?.startsWith('yahoo.')) {
    return 'https://mail.yahoo.com/';
  }
  if (domain === 'icloud.com' || domain === 'me.com' || domain === 'mac.com') {
    return 'https://www.icloud.com/mail/';
  }
  if (domain === 'proton.me' || domain === 'protonmail.com') {
    return 'https://mail.proton.me/';
  }

  return null;
}

async function tryOpenUrl(url: string): Promise<boolean> {
  try {
    if (!(await Linking.canOpenURL(url))) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Opens an installed mail client first, then falls back to a known web inbox. */
export async function openEmailInbox(address: string): Promise<boolean> {
  for (const url of MAIL_CLIENTS) {
    if (await tryOpenUrl(url)) return true;
  }

  if (await tryOpenUrl('mailto:')) return true;

  const inboxUrl = webInboxUrl(address);
  return inboxUrl ? tryOpenUrl(inboxUrl) : false;
}
