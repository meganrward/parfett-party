# parfett-party

## Prerequisites

- Node.js 20+ (CI runs on 22)
- [Deno](https://deno.land/) v2.x (for the Edge Functions)
- [Docker](https://www.docker.com/) (the Supabase CLI runs Postgres/Auth/Storage/Inbucket in containers)
- Supabase CLI — installed via `devDependencies` (`npx supabase ...`, or use the `db:*`/`functions:*` npm scripts)

## Install

```bash
npm install
```

## Local Supabase stack

```bash
npm run db:start   # starts Postgres, Auth, Studio, Inbucket, and applies migrations
npm run db:reset   # re-applies migrations + seed from scratch
npm run db:stop
```

Once started, the CLI prints local URLs and keys. The ones already wired up in
`.env.local` files (see below) are:

| service         | URL                        |
| --------------- | -------------------------- |
| API             | http://127.0.0.1:54321     |
| DB              | postgres://127.0.0.1:54322 |
| Studio          | http://127.0.0.1:54323     |
| Inbucket (mail) | http://127.0.0.1:54324     |

### Mailbox (Inbucket)

Host invites and password-reset emails (`create-host`, `resend-host-invite`) send
real email via Supabase Auth — locally these never leave the box, they land in
**Inbucket**, the local mail catcher started by `supabase start`.

To see an invite/reset email:

1. Trigger it (e.g. add a host from the admin UI, or run `npm run seed:test-party:local`).
2. Open **http://127.0.0.1:54324**.
3. Find the message by the recipient's email address and open it to get the
   set-password link.

`enable_confirmations` is off locally (`supabase/config.toml`), so sign-up itself
doesn't require a confirmation email — only the host-invite/reset flows send mail.

## Environment files

Each of these has a checked-in `.env.example` to copy from. `.env.local` (already
present, pointed at the local stack) takes precedence over `.env` (the hosted
project) — comment it out or delete it to fall back to hosted.

- `packages/web/.env` / `.env.local` — `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
  for the web app.
- `supabase/scripts/.env` / `.env.local` — `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
  plus admin/seed credentials, used by the bootstrap/seed scripts and Edge Functions
  during local development. Never commit a filled-in copy.

The local `.env.local` files already contain the Supabase CLI's well-known local
demo keys — safe to keep in the repo since they only work against your own local
stack, not the hosted project.

## Run the app

```bash
npm run dev   # starts packages/web against whichever Supabase env is active
```

## Edge Functions

```bash
npm run functions:serve    # serve all functions locally against the local stack
npm run functions:test     # deno test
npm run functions:check    # deno check
```

## Database / admin scripts

Run against the **local** stack by default via the `:local` script variants
(they load `supabase/scripts/.env.local`); drop `:local` to target the hosted
project (`supabase/scripts/.env`).

```bash
npm run bootstrap:admin:local     # create the super-admin auth user
npm run seed:test-party:local     # seed a test party + hosts (triggers invite emails — check Inbucket)
npm run unseed:test-party:local   # remove it
```

## Tests & quality gates

```bash
npm run lint
npm run format:check
npm run test              # vitest
npm run test:coverage     # enforces lib/ coverage gate
npm run db:test           # pgTAP suite (needs the local stack running)
npm run functions:test    # deno test for Edge Functions
```

## Storybook

```bash
npm run storybook   # @parfett/design-system
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for CI/CD and hosted-project setup.
