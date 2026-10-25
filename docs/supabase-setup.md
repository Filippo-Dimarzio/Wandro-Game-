# Wandro server (Supabase)

The live app talks to the Supabase project **wandro** (ref `abpwwchcyxwrhscdqxtz`, region
eu-west-3 Paris), so accounts, progress, friends and search work on every device.

- API URL: `https://abpwwchcyxwrhscdqxtz.supabase.co`
- Publishable key: in `.github/workflows/deploy-web.yml`. It is public by design; Row Level
  Security and the `SECURITY DEFINER` functions protect the data. The service-role key and the
  database password never go in the repo or the app.
- Dashboard: <https://supabase.com/dashboard/project/abpwwchcyxwrhscdqxtz>

## Going live (in this order)

1. Add the two repository secrets below (Database changes), then run **Actions → Supabase
   database → Run workflow**. It loads every migration, the places seed and the Edge Function.
2. Do the dashboard settings below (URL configuration, sign-up without email, and the reset
   email sender).
3. Add the repository **variable** `SUPABASE_LIVE` = `true` (Settings → Secrets and variables →
   Actions → Variables) and re-run **Deploy web app**. Until then the site stays in on-device demo
   mode, so it never points at an empty database.

## One-time dashboard settings (Auth)

These live in the dashboard, not in migrations.

1. **URL configuration** (Authentication → URL Configuration)
   - Site URL: `https://filippo-dimarzio.github.io/Wandro-Game-`
   - Redirect URLs: `https://filippo-dimarzio.github.io/Wandro-Game-/**`, `wandro://**`,
     `http://localhost:8081/**`
2. **No sign-up email** (Authentication → Sign In / Providers → Email): turn **Confirm email**
   off, so a new account starts playing straight away and sign-up never sends an email. Set the
   minimum password length to 8 characters, to match the app.
3. **Password-reset emails from "Wandro Support"** (Authentication → Emails → SMTP Settings).
   Supabase's built-in sender only delivers to members of your Supabase team, so other players'
   reset emails need your own sender. Without a domain of our own, a dedicated Gmail account works:
   - Create a Gmail account for Wandro, turn on 2-Step Verification, then create an App password
     (Google Account → Security → App passwords).
   - Enable custom SMTP: host `smtp.gmail.com`, port `465`, user = the Gmail address, password =
     the app password, sender email = the Gmail address, sender name `Wandro Support`.
   - Gmail sends up to about 500 emails a day. With a domain later, switch to Resend
     (`smtp.resend.com`, user `resend`, password = API key, sender `support@<domain>`).
4. **Email templates** (Authentication → Emails → Templates): paste
   `supabase/templates/recovery.html` into "Reset password" (subject "Reset your Wandro
   password"). `supabase/templates/confirmation.html` is only needed if "Confirm email" is
   turned back on.

## Database changes

Migrations in `supabase/migrations` are the only way the schema changes. The **Supabase
database** workflow (`.github/workflows/supabase.yml`) applies them, with the seed and Edge
Functions, whenever they change on `main` (or from Actions → Supabase database → Run workflow).
It needs two repository secrets: `SUPABASE_ACCESS_TOKEN` (from
<https://supabase.com/dashboard/account/tokens>; a scoped token needs database and Edge
Functions write access, or the last step fails with `edge_functions_write`) and `SUPABASE_DB_PASSWORD` (Project settings →
Database). Without them it skips. By hand, either:

- `supabase link --project-ref abpwwchcyxwrhscdqxtz` then `supabase db push` (needs the database
  password), or
- apply them with the Supabase MCP / SQL editor in filename order.

`supabase/seed/seed.sql` holds the launch cities' places and city sets; it is idempotent
(`on conflict do nothing`) and was loaded once at setup.

## Edge Functions

`check-photo` removes blank uploads. Deploy with `supabase functions deploy check-photo`.
