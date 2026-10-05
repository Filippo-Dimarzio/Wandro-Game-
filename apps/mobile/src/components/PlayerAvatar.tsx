import { useExplorers } from '@/data/explorer';
import { ExplorerAvatar } from './ExplorerAvatar';

/** Another player's explorer, looked up by their user id (friends lists, profile pages). */
export function PlayerAvatar({
  userId,
  size = 40,
  level,
}: {
  userId: string;
  size?: number;
  level?: number;
}) {
  const explorer = useExplorers([userId])[userId];
  return <ExplorerAvatar explorer={explorer} size={size} level={level} />;
}
