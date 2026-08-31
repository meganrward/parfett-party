# Deployment

The app deploys to **GitHub Pages** at `https://<user>.github.io/parfett-party/` via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to `main`
(pull requests run the checks but don't deploy).

Pipeline:

1. **verify** — `npm ci`, `lint`, `format:check`, `test:coverage` (enforces the `lib/`
   ≥ 90% gate), `deno test` for the Edge Functions, `deno check` on both function entries.
2. **db-test** — spins up local Supabase and runs the pgTAP suite (`supabase test db`).
3. **deploy** — only on `main`: builds `@parfett/design-system` then `@parfett/web`
   (`base: '/parfett-party/'`, `HashRouter`), uploads `packages/web/dist`, publishes to
   Pages. Any failed job blocks the deploy.

## One-time setup (do these in the GitHub / Supabase UIs)

### 1. GitHub Pages source

Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.

### 2. Repo variables (Settings → Secrets and variables → Actions → **Variables**)

These are **public** (they end up in the client bundle) — use repository _variables_, not
secrets. From Supabase → Project Settings → API:

| name                     | value                                      |
| ------------------------ | ------------------------------------------ |
| `VITE_SUPABASE_URL`      | `https://skagtaxusihzeiexfjzr.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the `anon` / publishable key               |

The `deploy` job fails fast if either is missing.

### 3. Supabase Auth URLs (Supabase → Authentication → URL Configuration)

So password-reset / host-invite links land back on the app:

- **Site URL:** `https://<user>.github.io/parfett-party/`
- **Redirect allow-list:** add `https://<user>.github.io/parfett-party/**`

## Edge Functions

Deployed manually (not in CI):

```bash
npm run functions:deploy            # generate-qr-codes
npx supabase functions deploy create-host
```

Both are currently deployed. They read `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` /
`SUPABASE_ANON_KEY`, which Supabase injects automatically for deployed functions.

## Database migrations

```bash
npx supabase db push        # apply pending migrations to the linked project
npx supabase migration list # confirm local == remote
```
