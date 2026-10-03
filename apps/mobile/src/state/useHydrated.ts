import { useEffect, useState } from 'react';
import { useSession } from './session';

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(useSession.persist.hasHydrated());
  useEffect(() => {
    const unsub = useSession.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useSession.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}
