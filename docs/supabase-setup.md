# Wandro server (Supabase)

The live app talks to the Supabase project **wandro** (ref `abpwwchcyxwrhscdqxtz`, region
eu-west-3 Paris), so accounts, progress, friends and search work on every device.

- API URL: `https://abpwwchcyxwrhscdqxtz.supabase.co`
- Publishable key: in `.github/workflows/deploy-web.yml`. It is public by design; Row Level
  Security and the `SECURITY DEFINER` functions protect the data. The service-role key and the
  database password never go in the repo or the app.
- Dashboard: <https://supabase.com/dashboard/project/abpwwchcyxwrhscdqxtz>

## One-time dashboard settings (Auth)

These live in the dashboard, not in migrations.

1. **URL configuration** (Authentication → URL Configuration)
   - Site URL: `https://filippo-dimarzio.github.io/Wandro-Game-`
   - Redirect URLs: `https://filippo-dimarzio.github.io/Wandro-Game-/**`, `wandro://**`,
     `http://localhost:8081/**`
2. **Emails from "Wandro Support"** (Authentication → Emails → SMTP Settings). Supabase's
   built-in sender only delivers to members of your Supabase team and only a few emails an hour,
   so other players' sign-up and password-reset emails need your own sender:
   - Create a free [Resend](https://resend.com) account, verify a domain you own (for example
     `wandro.app`), and create an API key.
   - Enable custom SMTP: host `smtp.resend.com`, port `465`, user `resend`, password = the API key,
     sender email `support@<your domain>`, sender name `Wandro Support`.
3. **Email templates** (Authentication → Emails → Templates): paste
   `supabase/templates/recovery.html` into "Reset password" (subject "Reset your Wandro
   password") and `supabase/templates/confirmation.html` into "Confirm sign up" (subject
   "Confirm your Wandro account").
4. **Password length** (Authentication → Providers → Email): minimum 8 characters, to match the
   app. Leave "Confirm email" on once SMTP is set up.

## Database changes

Migrations in `supabase/migrations` are the only way the schema changes. To apply new ones to the
hosted project, either:

- `supabase link --project-ref abpwwchcyxwrhscdqxtz` then `supabase db push` (needs the database
  password), or
- apply them with the Supabase MCP / SQL editor in filename order.

`supabase/seed/seed.sql` holds the launch cities' places and city sets; it is idempotent
(`on conflict do nothing`) and was loaded once at setup.

## Edge Functions

`check-photo` removes blank uploads. Deploy with `supabase functions deploy check-photo`.
