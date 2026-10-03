// Builds the Expo web app at the root path and copies it into apps/desktop/web.
import { execSync } from 'node:child_process';
import { cpSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const mobile = join(here, '..', '..', 'mobile');
execSync('pnpm build:web', {
  cwd: mobile,
  stdio: 'inherit',
  env: {
    ...process.env,
    EXPO_BASE_URL: '',
    EXPO_PUBLIC_BASE_URL: '',
    EXPO_PUBLIC_PLATFORM_SHELL: 'desktop',
  },
});
const out = join(here, '..', 'web');
rmSync(out, { recursive: true, force: true });
cpSync(join(mobile, 'dist'), out, { recursive: true });
console.log(`Web app copied to ${out}`);
