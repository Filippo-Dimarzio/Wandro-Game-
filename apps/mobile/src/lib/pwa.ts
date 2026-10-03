import { Platform } from 'react-native';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    wandroDesktop?: { isDesktop: boolean; platform: string };
  }
}

const base = process.env.EXPO_PUBLIC_BASE_URL ?? '';
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export const isWeb = Platform.OS === 'web';
/** True inside the Electron desktop app. */
export const isDesktopApp =
  isWeb && typeof window !== 'undefined' && !!window.wandroDesktop?.isDesktop;
/** True when already running as an installed app (desktop shell or installed PWA). */
export const isInstalled =
  isDesktopApp ||
  (isWeb &&
    typeof window !== 'undefined' &&
    window.matchMedia?.('(display-mode: standalone)').matches);

export const RELEASES_URL = 'https://github.com/Filippo-Dimarzio/Wandro-Game-/releases/latest';

/** Adds the manifest, registers the service worker and captures the browser's install prompt. */
export function setupPwa(): void {
  if (!isWeb || typeof document === 'undefined' || isDesktopApp) return;
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = `${base}/manifest.webmanifest`;
    document.head.appendChild(link);
    const theme = document.createElement('meta');
    theme.name = 'theme-color';
    theme.content = '#0E7C66';
    document.head.appendChild(theme);
  }
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => undefined);
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

export function canPromptInstall(): boolean {
  return !!deferred;
}

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  listeners.forEach((l) => l());
  return outcome === 'accepted';
}

export function onInstallAvailabilityChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
