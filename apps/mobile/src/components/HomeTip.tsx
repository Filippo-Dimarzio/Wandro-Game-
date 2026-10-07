import { isDemo } from '@/lib/env';
import { useSession } from '@/state/session';
import { HowToPlay } from './HowToPlay';
import { InstallBanner } from './InstallBanner';
import { JoinBetaCard } from './JoinBetaCard';

/**
 * One tip at a time on Home, so it never stacks up: how to play (until the first discovery),
 * then joining the beta (demo only), then installing the app. Closed tips stay on Profile.
 */
export function HomeTip({ discoveries }: { discoveries: number }) {
  const dismissed = useSession((s) => s.dismissedTips);
  const dismissTip = useSession((s) => s.dismissTip);
  if (discoveries === 0 && !dismissed.includes('howto'))
    return <HowToPlay onDismiss={() => dismissTip('howto')} />;
  if (isDemo && !dismissed.includes('join'))
    return <JoinBetaCard onDismiss={() => dismissTip('join')} />;
  return <InstallBanner />;
}
