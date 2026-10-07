// check-photo: decides on the server whether an uploaded post photo is blank (a black frame,
// a flat colour). Passed photos are shown to others; blank ones are deleted from storage and
// removed from the post. A live photo's selfie is checked too: if either is blank, both go.
//
//   POST { post_id }      as the post's author, right after posting (the app does this)
//   POST { sweep: true }  as a moderator: check every photo not yet checked (up to 200)
//
// Uses the service-role key, which only exists in the function's environment, never the app.
import { createClient } from 'npm:@supabase/supabase-js@2';
import jpeg from 'npm:jpeg-js@0.4.4';
import { photoLooksBlank } from './blank.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function looksOk(path: string): Promise<boolean> {
  const { data, error } = await admin.storage.from('post-photos').download(path);
  if (error || !data) return false;
  try {
    const img = jpeg.decode(new Uint8Array(await data.arrayBuffer()), {
      useTArray: true,
      maxMemoryUsageInMB: 256,
    });
    return !photoLooksBlank(img.data);
  } catch {
    return false; // Not a readable JPEG: the app always uploads one, so treat it as bad.
  }
}

async function check(post: { id: string; photo_path: string | null; selfie_path?: string | null }) {
  let ok = true;
  for (const path of [post.photo_path, post.selfie_path]) {
    if (ok && path) ok = await looksOk(path);
  }
  const { data: paths, error } = await admin.rpc('record_photo_check', {
    p_post: post.id,
    p_ok: ok,
  });
  if (error) throw error;
  const remove = (paths as string[] | null) ?? [];
  if (!ok && remove.length) await admin.storage.from('post-photos').remove(remove);
  return { post_id: post.id, ok };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
  const { data: auth } = await admin.auth.getUser(token);
  const user = auth.user;
  if (!user) return json({ error: 'not_authenticated' }, 401);
  const body = (await req.json().catch(() => ({}))) as { post_id?: string; sweep?: boolean };

  const { data: me } = await admin
    .from('profiles')
    .select('is_moderator')
    .eq('id', user.id)
    .single();
  const moderator = !!me?.is_moderator;

  if (body.sweep) {
    if (!moderator) return json({ error: 'forbidden' }, 403);
    const { data: posts, error } = await admin
      .from('posts')
      .select('id, photo_path, selfie_path')
      .is('photo_checked_at', null)
      .not('photo_path', 'is', null)
      .limit(200);
    if (error) return json({ error: error.message }, 500);
    const results = [];
    for (const p of posts ?? []) results.push(await check(p));
    return json({ checked: results.length, removed: results.filter((r) => !r.ok).length });
  }

  if (!body.post_id) return json({ error: 'post_id_required' }, 400);
  const { data: post } = await admin
    .from('posts')
    .select('id, user_id, photo_path, selfie_path')
    .eq('id', body.post_id)
    .single();
  if (!post) return json({ error: 'post_not_found' }, 404);
  if (post.user_id !== user.id && !moderator) return json({ error: 'forbidden' }, 403);
  return json(await check(post));
});
