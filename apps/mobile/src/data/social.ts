import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DEMO_PLACES, MOMENT_VISIBLE_HOURS, type Category } from '@wandro/shared';
import { DEMO_FEED, DEMO_USERS, demoUser } from '@/demo/social';
import { walletOf } from '@/demo/engine';
import { isDemo } from '@/lib/env';
import { keepPhoto } from '@/lib/photo';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

export interface FeedItem {
  id: string;
  userId: string;
  username: string;
  placeId: string;
  placeName: string;
  category: Category;
  caption: string;
  photoUrl?: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  isMine: boolean;
}

export const ME = 'me';

const placeById = (id: string) => DEMO_PLACES.find((p) => p.id === id);

async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const { data } = await supabase!.storage.from('post-photos').createSignedUrls(paths, 3600);
  const out: Record<string, string> = {};
  for (const d of data ?? []) if (d.path && d.signedUrl) out[d.path] = d.signedUrl;
  return out;
}

const MOMENT_MS = MOMENT_VISIBLE_HOURS * 3_600_000;

/** When a moment leaves other people's feeds. */
export const momentExpiry = (createdAt: string) => Date.parse(createdAt) + MOMENT_MS;

export interface MomentStatus {
  /** You shared a moment in the last 24 h, so you can see everyone else's. */
  unlocked: boolean;
  /** When your latest moment stops being visible to others. */
  expiresAt: string | null;
}

/**
 * Today's moments: posts from the last 24 h by people you follow or are friends with. Other
 * people's only show once you've shared one yourself (the server enforces the same in RLS).
 */
export function useFeed() {
  const s = useSession();
  const server = useQuery({
    queryKey: ['feed'],
    enabled: !isDemo,
    queryFn: async (): Promise<{ items: FeedItem[]; status: MomentStatus }> => {
      const db = supabase!;
      const me = (await db.auth.getUser()).data.user?.id;
      const [feed, status] = await Promise.all([
        db.rpc('feed', { p_limit: 50 }),
        db.rpc('moment_status'),
      ]);
      if (feed.error) throw feed.error;
      if (status.error) throw status.error;
      const rows = feed.data as {
        post_id: string;
        user_id: string;
        username: string;
        place_id: string;
        place_name: string;
        category: Category;
        caption: string | null;
        photo_path: string | null;
        created_at: string;
        like_count: number;
        liked_by_me: boolean;
      }[];
      const st = status.data as { unlocked: boolean; expires_at: string | null };
      const urls = await signedUrls(rows.flatMap((r) => (r.photo_path ? [r.photo_path] : [])));
      return {
        status: { unlocked: st.unlocked, expiresAt: st.expires_at },
        items: rows.map((r) => ({
          id: r.post_id,
          userId: r.user_id,
          username: r.username,
          placeId: r.place_id,
          placeName: r.place_name,
          category: r.category,
          caption: r.caption ?? '',
          photoUrl: r.photo_path ? urls[r.photo_path] : undefined,
          createdAt: r.created_at,
          likeCount: Number(r.like_count),
          likedByMe: r.liked_by_me,
          isMine: r.user_id === me,
        })),
      };
    },
  });
  if (!isDemo)
    return {
      items: server.data?.items ?? [],
      status: server.data?.status ?? { unlocked: false, expiresAt: null },
      isLoading: server.isLoading,
      error: server.error,
      refetch: server.refetch,
    };

  const now = Date.now();
  const recent = s.posts.filter((p) => now - Date.parse(p.at) < MOMENT_MS);
  const status: MomentStatus = {
    unlocked: recent.length > 0,
    expiresAt: recent.length
      ? new Date(Math.max(...recent.map((p) => momentExpiry(p.at)))).toISOString()
      : null,
  };
  const mine: FeedItem[] = recent.map((p) => ({
    id: p.id,
    userId: ME,
    username: s.profile?.username ?? 'you',
    placeId: p.placeId,
    placeName: placeById(p.placeId)?.name ?? '',
    category: placeById(p.placeId)?.category ?? 'other',
    caption: p.caption,
    photoUrl: p.photoUri,
    createdAt: p.at,
    likeCount: s.liked[p.id] ? 1 : 0,
    likedByMe: !!s.liked[p.id],
    isMine: true,
  }));
  const others: FeedItem[] = !status.unlocked
    ? []
    : DEMO_FEED.filter(
        (p) =>
          p.hoursAgo < MOMENT_VISIBLE_HOURS &&
          (s.following.includes(p.userId) || s.friends[p.userId] === 'friends') &&
          !s.blocked.includes(p.userId),
      )
        .filter((p) => !s.reports.some((r) => r.targetType === 'post' && r.targetId === p.id))
        .map((p) => ({
          id: p.id,
          userId: p.userId,
          username: demoUser(p.userId)?.username ?? '',
          placeId: p.placeId,
          placeName: placeById(p.placeId)?.name ?? '',
          category: placeById(p.placeId)?.category ?? 'other',
          caption: p.caption,
          createdAt: new Date(now - p.hoursAgo * 3_600_000).toISOString(),
          likeCount: p.likes + (s.liked[p.id] ? 1 : 0),
          likedByMe: !!s.liked[p.id],
          isMine: false,
        }));
  const items = [...mine, ...others].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { items, status, isLoading: false, error: null, refetch: async () => undefined };
}

export interface PassportStamp {
  id: string;
  placeId: string;
  placeName: string;
  category: Category;
  /** Launch city slug, or null for places outside them. */
  region: string | null;
  caption: string;
  photoUrl?: string;
  createdAt: string;
}

/** Every moment you've shared, kept forever but only for you. */
export function usePassport() {
  const posts = useSession((s) => s.posts);
  const server = useQuery({
    queryKey: ['passport'],
    enabled: !isDemo,
    queryFn: async (): Promise<PassportStamp[]> => {
      const { data, error } = await supabase!.rpc('my_passport');
      if (error) throw error;
      const rows = data as {
        post_id: string;
        place_id: string;
        place_name: string;
        category: Category;
        region_slug: string | null;
        caption: string | null;
        photo_path: string | null;
        created_at: string;
      }[];
      const urls = await signedUrls(rows.flatMap((r) => (r.photo_path ? [r.photo_path] : [])));
      return rows.map((r) => ({
        id: r.post_id,
        placeId: r.place_id,
        placeName: r.place_name,
        category: r.category,
        region: r.region_slug,
        caption: r.caption ?? '',
        photoUrl: r.photo_path ? urls[r.photo_path] : undefined,
        createdAt: r.created_at,
      }));
    },
  });
  if (!isDemo) return { stamps: server.data ?? [], isLoading: server.isLoading };
  const stamps = posts
    .map((p) => {
      const place = placeById(p.placeId);
      return {
        id: p.id,
        placeId: p.placeId,
        placeName: place?.name ?? '',
        category: place?.category ?? ('other' as Category),
        region: place?.region ?? null,
        caption: p.caption,
        photoUrl: p.photoUri,
        createdAt: p.at,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { stamps, isLoading: false };
}

/** Your most recent discovery that you haven't shared yet: what "share a moment" opens. */
export function useShareable(): string | null {
  const unlocked = useSession((s) => s.unlocked);
  const posts = useSession((s) => s.posts);
  const server = useQuery({
    queryKey: ['shareable'],
    enabled: !isDemo,
    queryFn: async () => {
      const db = supabase!;
      const [visits, mine] = await Promise.all([
        db
          .from('visits')
          .select('place_id, verified_at')
          .order('verified_at', { ascending: false }),
        db.rpc('my_passport'),
      ]);
      if (visits.error) throw visits.error;
      const shared = new Set(((mine.data ?? []) as { place_id: string }[]).map((r) => r.place_id));
      return visits.data.find((v) => !shared.has(v.place_id as string))?.place_id ?? null;
    },
  });
  if (!isDemo) return (server.data as string | null | undefined) ?? null;
  const shared = new Set(posts.map((p) => p.placeId));
  return (
    Object.entries(unlocked)
      .filter(([id]) => !shared.has(id))
      .sort((a, b) => b[1].at.localeCompare(a[1].at))[0]?.[0] ?? null
  );
}

export function useToggleLike() {
  const qc = useQueryClient();
  const toggle = useSession((s) => s.toggleLike);
  return useMutation({
    mutationFn: async (item: FeedItem) => {
      if (isDemo) return toggle(item.id);
      const db = supabase!;
      const me = (await db.auth.getUser()).data.user!.id;
      const res = item.likedByMe
        ? await db.from('likes').delete().eq('post_id', item.id).eq('user_id', me)
        : await db.from('likes').insert({ post_id: item.id, user_id: me });
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['passport'] });
      qc.invalidateQueries({ queryKey: ['shareable'] });
    },
  });
}

export interface ProfileCard {
  id: string;
  username: string;
  homeCity: string | null;
  isPrivate: boolean;
  level: number;
  followers: number;
  following: number;
  followStatus: 'pending' | 'accepted' | null;
  canSee: boolean;
  discoveries: number | null;
}

export function useProfileCard(userId: string) {
  const following = useSession((s) => s.following);
  const blocked = useSession((s) => s.blocked);
  const server = useQuery({
    queryKey: ['profile-card', userId],
    enabled: !isDemo,
    queryFn: async (): Promise<ProfileCard | null> => {
      const { data, error } = await supabase!.rpc('profile_card', { p_user: userId });
      if (error) throw error;
      if (!data) return null;
      const d = data as Record<string, unknown>;
      return {
        id: d.id as string,
        username: d.username as string,
        homeCity: (d.home_city as string) ?? null,
        isPrivate: !!d.is_private,
        level: d.level as number,
        followers: Number(d.followers),
        following: Number(d.following),
        followStatus: (d.follow_status as ProfileCard['followStatus']) ?? null,
        canSee: !!d.can_see,
        discoveries: d.discoveries === null ? null : Number(d.discoveries),
      };
    },
  });
  if (!isDemo) return server;
  const u = demoUser(userId);
  const isFollowing = following.includes(userId);
  // Demo: private accounts "accept" instantly, so requests are visible but never stuck.
  const data: ProfileCard | null =
    u && !blocked.includes(userId)
      ? {
          id: u.id,
          username: u.username,
          homeCity: u.homeCity,
          isPrivate: u.isPrivate,
          level: u.level,
          followers: 40 + u.level * 7 + (isFollowing ? 1 : 0),
          following: 30 + u.level * 3,
          followStatus: isFollowing ? 'accepted' : null,
          canSee: !u.isPrivate || isFollowing,
          discoveries: !u.isPrivate || isFollowing ? u.discoveries : null,
        }
      : null;
  return { data, isLoading: false, error: null };
}

export function useFollow() {
  const qc = useQueryClient();
  const toggle = useSession((s) => s.toggleFollow);
  return useMutation({
    mutationFn: async ({ userId, following }: { userId: string; following: boolean }) => {
      if (isDemo) return toggle(userId);
      const db = supabase!;
      const me = (await db.auth.getUser()).data.user!.id;
      const res = following
        ? await db.from('follows').delete().eq('follower_id', me).eq('followee_id', userId)
        : await db.from('follows').insert({ follower_id: me, followee_id: userId });
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile-card'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useBlock() {
  const qc = useQueryClient();
  const block = useSession((s) => s.block);
  return useMutation({
    mutationFn: async (userId: string) => {
      if (isDemo) return block(userId);
      const db = supabase!;
      const me = (await db.auth.getUser()).data.user!.id;
      const { error } = await db.from('blocks').insert({ blocker_id: me, blocked_id: userId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useReport() {
  const qc = useQueryClient();
  const report = useSession((s) => s.report);
  return useMutation({
    mutationFn: async (r: {
      targetType: 'post' | 'profile' | 'friend_challenge';
      targetId: string;
      reason: string;
    }) => {
      if (isDemo) return report(r);
      const db = supabase!;
      const me = (await db.auth.getUser()).data.user!.id;
      const { error } = await db.from('reports').insert({
        reporter_id: me,
        target_type: r.targetType,
        target_id: r.targetId,
        reason: r.reason,
      });
      // Reporting the same thing twice is fine: the first report already counts.
      if (error && error.code !== '23505') throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['passport'] });
      qc.invalidateQueries({ queryKey: ['shareable'] });
    },
  });
}

export function useSearchProfiles(q: string) {
  const blocked = useSession((s) => s.blocked);
  const server = useQuery({
    queryKey: ['search', q],
    enabled: !isDemo && q.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase!.rpc('search_profiles', { q: q.trim() });
      if (error) throw error;
      return (data as { id: string; username: string; is_private: boolean }[]).map((r) => ({
        id: r.id,
        username: r.username,
        isPrivate: r.is_private,
      }));
    },
  });
  if (!isDemo) return server.data ?? [];
  const needle = q.trim().toLowerCase();
  return DEMO_USERS.filter(
    (u) => !blocked.includes(u.id) && (!needle || u.username.includes(needle)),
  ).map((u) => ({
    id: u.id,
    username: u.username,
    isPrivate: u.isPrivate,
  }));
}

export type LeaderboardScope = 'friends' | 'region' | 'global' | 'weekly';
export interface LeaderboardRow {
  rank: number;
  userId: string;
  username: string;
  level: number;
  coins: number;
  isMe: boolean;
}

export function useLeaderboard(scope: LeaderboardScope, region = 'sintra') {
  const s = useSession();
  const server = useQuery({
    queryKey: ['leaderboard', scope, region],
    enabled: !isDemo,
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const { data, error } = await supabase!.rpc('leaderboard', {
        p_scope: scope,
        p_region: region,
      });
      if (error) throw error;
      return (
        data as {
          rank: number;
          user_id: string;
          username: string;
          level: number;
          coins: number;
          is_me: boolean;
        }[]
      ).map((r) => ({
        rank: Number(r.rank),
        userId: r.user_id,
        username: r.username,
        level: r.level,
        coins: Number(r.coins),
        isMe: r.is_me,
      }));
    },
  });
  if (!isDemo) return { rows: server.data ?? [], isLoading: server.isLoading };

  const w = walletOf({ ...s });
  const weekAgo = Date.now() - 7 * 86_400_000;
  const myWeekly = s.ledger
    .filter((e) => e.coins > 0 && Date.parse(e.at) > weekAgo)
    .reduce((a, e) => a + e.coins, 0);
  const me = {
    userId: ME,
    username: s.profile?.username ?? 'you',
    level: w.level,
    coins: scope === 'weekly' ? myWeekly : w.coinsEarned,
    isMe: true,
  };
  const others = DEMO_USERS.filter((u) => !s.blocked.includes(u.id))
    .filter((u) => (scope === 'friends' ? s.following.includes(u.id) : !u.isPrivate))
    .map((u) => ({
      userId: u.id,
      username: u.username,
      level: u.level,
      coins: scope === 'weekly' ? u.weeklyCoins : u.coins,
      isMe: false,
    }));
  const rows = [...others, me]
    .sort((a, b) => b.coins - a.coins)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  return { rows, isLoading: false };
}

export function useCreatePost() {
  const qc = useQueryClient();
  const addPost = useSession((s) => s.addPost);
  return useMutation({
    mutationFn: async ({
      placeId,
      caption,
      photoUri,
    }: {
      placeId: string;
      caption: string;
      photoUri?: string;
    }) => {
      if (isDemo) {
        addPost({
          id: `post-${Date.now()}`,
          placeId,
          caption,
          photoUri: photoUri ? await keepPhoto(photoUri) : undefined,
          at: new Date().toISOString(),
        });
        return;
      }
      const db = supabase!;
      const me = (await db.auth.getUser()).data.user!.id;
      const visit = await db
        .from('visits')
        .select('id')
        .eq('user_id', me)
        .eq('place_id', placeId)
        .single();
      if (visit.error) throw visit.error;
      let photoPath: string | null = null;
      if (photoUri) {
        const blob = await (await fetch(photoUri)).arrayBuffer();
        photoPath = `${me}/${visit.data.id}.jpg`;
        const up = await db.storage
          .from('post-photos')
          .upload(photoPath, blob, { contentType: 'image/jpeg', upsert: true });
        if (up.error) throw up.error;
      }
      const { data: post, error } = await db
        .from('posts')
        .insert({
          user_id: me,
          visit_id: visit.data.id,
          place_id: placeId,
          caption: caption || null,
          photo_path: photoPath,
        })
        .select('id')
        .single();
      if (error) throw error;
      // The server checks the photo before anyone else sees it (blank ones are removed).
      if (photoPath)
        await db.functions
          .invoke('check-photo', { body: { post_id: post.id } })
          .catch(() => undefined);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['passport'] });
      qc.invalidateQueries({ queryKey: ['shareable'] });
    },
  });
}
