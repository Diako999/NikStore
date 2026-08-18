# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Storein (استورین) — a Persian (Farsi, RTL) e-commerce platform for eyewear ("عینک"). Monorepo of three independently deployed apps sharing one MongoDB database via the backend API:

| App | Path | Stack | Dev port |
|---|---|---|---|
| Backend API | `storein/` | NestJS 11 + Mongoose + Redis | 3001 |
| Storefront | `storein-nuxt/` | Nuxt 3 (SSR) | 3005 (dev) / 3000 (prod) |
| Admin panel | `storein-admin/` | Vue 3 + Vite, served by Express in prod | 4000 (dev) / 4001 (prod) |

Each app has its own `package.json`, `node_modules`, and `.env` — there is no shared root package.json or workspace tooling. Always `cd` into the relevant app directory (or use `--prefix`/`working-directory`) before running commands.

## Commands

### Backend (`storein/`)
```bash
npm run start:dev          # NestJS with watch mode
npm run build               # nest build
npm run lint                 # eslint --fix on src/apps/libs/test
npm test                     # unit tests (jest, colocated *.spec.ts under src/)
npm run test:cov             # unit tests with coverage
npm run test:e2e             # e2e tests (test/*.e2e-spec.ts) — needs --forceExit in CI
npx jest src/modules/product/product.service.spec.ts   # run a single unit test file
npx jest --config ./test/jest-e2e.json -t "some test name"  # run a single e2e test by name
npm run seed:pages           # seed CMS pages
npm run migrate:image-urls   # one-off data migration script
```
Unit tests need **no** running MongoDB/Redis — they use `mongodb-memory-server` and `ioredis-mock`. E2E tests spin up a real in-memory Mongo via `test/setup/global-setup.ts` (fake env vars, port 3099) and still mock Redis.

**Known gotcha:** `storein/src/jest.setup.ts` hardcodes `MONGOMS_SYSTEM_BINARY` to a Windows `mongod.exe` path (left over from a Windows dev machine). This only affects `database.module.spec.ts` (the only unit spec using `MongoMemoryServer`); on Linux/Mac, unset that env var or point it at a real local `mongod` binary if that specific test fails to launch Mongo.

### Storefront (`storein-nuxt/`)
```bash
npm run dev        # nuxt dev on :3005
npm run build       # nuxt build
npm test            # vitest run
npm run test:watch  # vitest watch
npx vitest run stores/cart.store.test.js   # run a single test file
```

### Admin (`storein-admin/`)
```bash
npm run dev        # vite dev on :4000, proxies /uploads to backend
npm run build       # vite build → dist/
npm start           # node server.js — serves dist/ + proxies /api, /uploads, /socket.io (prod)
npm test            # vitest run
npx vitest run src/router/guard.test.js   # run a single test file
```

### CI (`.github/workflows/ci.yml`)
Runs on push/PR to `main`/`master`/`develop`: backend lint + unit + e2e tests (Node 20), and lint-only checks for admin and nuxt (`|| true`, non-blocking).

## Backend architecture (`storein/`)

Standard NestJS feature-module layout. Each module under `src/modules/<name>/` follows the same shape: `<name>.module.ts`, `<name>.controller.ts` + `.spec.ts`, `<name>.service.ts` + `.spec.ts`, `dto/`, `entities/*.schema.ts` (Mongoose schemas). New features should follow this exact pattern.

- **Entry point**: `src/main.ts` — global prefix `api/v1`, global `ValidationPipe` (whitelist + forbid unknown props + transform), Winston logger wired as the Nest logger, global exception filter + response/logging interceptors, Swagger UI at `/api/docs` (non-production only), Helmet with `crossOriginResourcePolicy: cross-origin` (required because the storefront/admin live on different subdomains), cookie-based refresh tokens.
- **Config**: `src/config/*.config.ts`, loaded via `@nestjs/config` and validated with a `Joi` schema in `app.module.ts` — the app **fails to boot** if a required env var is missing. Check that schema before adding a new env var.
- **Auth** (`modules/auth/`): JWT access + refresh tokens (refresh tokens persisted in Mongo via `entities/refresh-token.schema.ts`), OTP-based phone login. `guards/jwt-auth.guard.ts` / `jwt-refresh.guard.ts` + `common/guards/admin.guard.ts` / `super-admin.guard.ts` for role gating, `common/decorators/public.decorator.ts` to bypass auth on a route, `current-user.decorator.ts` to pull the authenticated user.
- **Pluggable provider pattern** — used twice, follow this pattern for any new external integration:
  - SMS: `modules/auth/sms/sms.service.abstract.ts` with `mock-sms.service.ts` / `kavenegar-sms.service.ts` implementations, selected at runtime by `dynamic-sms.service.ts` reading `SMS_PROVIDER` (`mock`|`kavenegar`).
  - Payments: `modules/payment/gateway/payment-gateway.abstract.ts` with `mock-payment-gateway.service.ts` / `zarinpal-gateway.service.ts`, selected by `dynamic-gateway.service.ts` reading `PAYMENT_GATEWAY` (`mock`|`zarinpal`).
- **Realtime**: `common/gateway/` (Socket.IO via `@nestjs/platform-socket.io`) — used for admin notifications; storefront/admin connect through their own `socket.service.js`, proxied through each app's own server so the browser sees same-origin WebSocket traffic (see Frontend architecture below).
- **Caching**: `RedisModule` (`src/redis/`) + `cache-manager-ioredis-yet`, `REDIS_TTL` env-controlled.
- **Uploads**: served statically from `UPLOAD_DEST` at `/uploads` (see `main.ts`); `sharp` used for image processing.
- **Discounts**: `src/discounts/` lives at the top level (not under `modules/`) but follows the same dto/schemas/validators shape — a bulk/time-based discount engine used by the product/order flow.
- **Response shape**: `ResponseInterceptor` wraps all successful responses as `{ success, data, ... }` — both frontends' `http.service.js` unwrap `response.data.data` automatically, so backend responses should return raw DTOs/entities, not pre-wrapped envelopes.
- **Rate limiting**: global `ThrottlerGuard` (100 req/60s) applied via `APP_GUARD` in `app.module.ts`.

## Frontend architecture (both `storein-nuxt/` and `storein-admin/`)

Both frontends mirror the backend's module list 1:1 with a `services/<name>.service.js` file per backend module (thin axios wrappers) and Pinia stores in `stores/`. When the backend gains a new module/endpoint, add a matching service file rather than calling axios ad hoc from components.

- **`services/http.service.js`** (near-identical in both apps): a shared axios instance, `baseURL: '/api/v1'`, `withCredentials: true`. Implements silent access-token refresh on `401` (queues concurrent requests while a refresh is in flight, dispatches a `storein:session-expired` `window` event on unrecoverable auth failure instead of hard-redirecting) and a one-time retry-after-delay on `503`. Auth token is injected via a lazy provider (`setTokenProvider`) to avoid a circular import with the auth store.
- **Same-origin proxying** — both apps proxy `/api`, `/uploads`, and `/socket.io` to the backend so the browser never talks cross-origin (avoids CORS/cookie issues in Safari/Firefox):
  - `storein-nuxt`: `server/middleware/proxy.ts`, reads `API_INTERNAL_URL` from Nuxt runtime config **at request time** (not baked in at build time — important for swapping backend URLs across environments without rebuilding).
  - `storein-admin`: `server.js` (Express + `http-proxy-middleware`), same `API_INTERNAL_URL` env var, plus manual WebSocket `upgrade` event forwarding since Express doesn't expose it automatically. Uses `pathFilter` (not `app.use('/api', proxy)`) so the `/api` prefix is preserved when forwarding.
- **Storefront rendering strategy** (`storein-nuxt/nuxt.config.ts`): hybrid — public pages use SWR (`/`, `/products`, `/category/**`, `/product/**`, `/blog/**`, `/pages/**`), `/search` and all private/auth-gated routes (`/auth/**`, `/cart`, `/checkout`, `/payment/**`, `/user/**`) are CSR-only (`ssr: false`).
- **RTL/Persian**: storefront `<html lang="fa" dir="rtl">`, Tailwind + `tailwindcss-rtl`, Jalali (Persian) calendar via `jalaali-js`/`vue3-persian-datetime-picker` in admin. Keep new UI RTL-correct (avoid hardcoded `left`/`right`, prefer logical Tailwind classes).
- **Admin auth**: route guards in `src/router/guard.js`.

## Deployment (`deploy/`)

Single-VPS deployment via PM2 (`deploy/ecosystem.config.js` defines the three processes: `storein-backend`, `storein-nuxt`, `storein-admin`) behind Nginx (`deploy/nginx.conf` / `nginx-domain.conf`). See `README.md` for the full first-deploy / domain-setup / common-commands sequence (`bash deploy/setup.sh`, `bash deploy/deploy.sh`, `pm2 logs`, etc.) — that sequence is the source of truth for VPS operations, not reproduced here.

Env files are per-app and not committed: copy `deploy/backend.env.example` → `storein/.env` and `deploy/nuxt.env.example` → `storein-nuxt/.env` before running. `storein-admin` takes its config from PM2 `env` block / process env, not a `.env` file.
