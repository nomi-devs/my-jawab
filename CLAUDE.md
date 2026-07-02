# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Two active services in one repo:

| Service | Tech | Port | Directory |
|---|---|---|---|
| `backend-admin` | NestJS + Prisma + PostgreSQL | 3001 | `backend-admin/` |
| `admin-panel` | React + Vite | 5173 | `admin-panel/` |

`media-service-admin/` is retired — its functionality was merged into `backend-admin`. Ignore it.

All backend routes are mounted under the global prefix `api` (set in `main.ts`), so a controller decorated `@Controller('admin')` is actually reachable at `/api/admin/...`. Swagger docs are served at `/api/docs`.

## Commands

### backend-admin (run from inside `backend-admin/`)
```bash
npm run start:dev     # watch mode
npm run build         # compile TypeScript
npm run start:prod    # run compiled dist/main
npm run lint          # ESLint with auto-fix
npm run test          # Jest unit tests (files matching *.spec.ts)
npm run test:watch    # Jest watch mode
npm run test:e2e      # E2E tests
npm run seed          # run prisma/seed.ts (ts-node, uses tsconfig.seed.json)
```

Run a single test file: `npx jest path/to/file.spec.ts` (paths are relative to `src/`, since `rootDir` is `src` in the Jest config in `package.json`).

Prisma CLI (config is `prisma.config.ts`, which reads `DATABASE_URL`):
```bash
npx prisma migrate dev     # create + apply a migration from schema.prisma changes
npx prisma generate        # regenerate the Prisma Client (needed after pulling schema changes)
npx prisma studio          # browse the DB in a GUI
npx prisma db push         # push schema changes without creating a migration (prototyping only)
```

### admin-panel (run from inside `admin-panel/`)
```bash
npm run dev           # Vite dev server at localhost:5173
npm run build         # production build
npm run lint          # ESLint
npm run format        # Prettier write
```

### Database setup (PostgreSQL, local)
```bash
createdb db_jawab
# or: psql -U postgres -c "CREATE DATABASE db_jawab;"
```
Then, from inside `backend-admin/`, run `npx prisma migrate dev` to create the schema, followed by `npm run seed`. `prisma/seed.ts` is idempotent (skips users that already exist by email) and creates:
- 4 users, one per role — `admin@jawab.com` / `Admin@123`, `subadmin@jawab.com` / `SubAdmin@123`, `prouser@jawab.com` / `ProUser@123`, `user@jawab.com` / `User@123` — each with a profile
- 5 currencies (USD, KWD, SAR, EUR, GBP), upserted by `currency_code`

Log into `admin-panel` with the `admin@jawab.com` credentials above.

## Environment Switching

There are **two hardcoded switches** — not `.env` — that control local vs production URLs:

**1. `backend-admin/src/config/services.config.ts`**
```typescript
export const hostType: 'local' | 'live' = 'local';
```
- `local` → Redis at `localhost:6379`
- `live` → Redis at `redis_container`

**2. `admin-panel/src/config/app.js`**
```javascript
export const hostType = "local"; // "local" | "live"
```
- `local` → all API and media URLs at `http://localhost:3001/api`
- `live` → production URLs at `jawab.jantrah.io`

## Local .env Files

**`backend-admin/.env`** (required, not committed — copy from `.env.example`):
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=
DB_NAME=db_jawab
DB_SYNCHRONIZE=true
DATABASE_URL="postgresql://postgres:@localhost:5432/db_jawab"
APP_URL=http://localhost:3001
API_URL=http://localhost:3001/api
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
```
Also present in `.env.example`: SMTP/email settings, `GOOGLE_CLIENT_ID`/`APPLE_CLIENT_ID` for OAuth, media-processing tunables (`MAX_IMAGE_SIZE`, `SUPPORT_WEBP`, etc.), and optional AWS S3 credentials (blank = local disk storage).

`admin-panel` has no `.env` — all config lives in `src/config/app.js`.

## Architecture

### backend-admin

**Data layer is Prisma + PostgreSQL** (`prisma/schema.prisma`, one `db_jawab` database — users, posts, comments, polls, communities, topics, subscriptions, payments, media, notifications, emails, jobs, templates all live there as Prisma models). `PrismaService` (`src/prisma/prisma.service.ts`) wraps `PrismaClient` with the `@prisma/adapter-pg` driver adapter; inject it into a service constructor and call `this.prisma.<model>.<method>()`, e.g. `this.prisma.user.findUnique(...)`.

> **Leftover from a prior TypeORM stack:** `src/modules/*/entities/*.entity.ts` files and the `typeorm`/`@nestjs/typeorm`/`mysql2` packages still exist in the repo, but `app.module.ts` no longer imports `TypeOrmModule.forRoot()` and nothing calls `TypeOrmModule.forFeature()` or `@InjectRepository()` anywhere in `src/modules`. These entity files are dead code — don't use them as the source of truth for the data model or extend them for new fields. `prisma/schema.prisma` is authoritative.

The backend serves **two different audiences** from the same app:
- `ma/*` routes (e.g. `user.controller.ts` → `@Controller('ma/users')`) — end-user–facing API: profile, follow/unfollow, topic subscriptions, "my posts/polls/replies". Used by the mobile/consumer app (not in this repo).
- `admin/*` routes (`admin.controller.ts` → `@Controller('admin')`) — admin-only: dashboard stats, user/content moderation, CSV export, hard/soft delete, restore. This is what `admin-panel` talks to.

Both are gated by `JwtAuthGuard` applied per-controller via `@UseGuards(JwtAuthGuard)`, not globally.

**Module layout** (`src/modules/`):

- `admin` — fat module; `AdminService` contains most cross-cutting business logic (dashboard stats, user/content moderation). Other module services are injected into it.
- `auth` — JWT + Passport, Google/Apple OAuth, email verification, password reset.
- `media` — file uploads, Sharp image optimization (WebP/AVIF), ffmpeg video thumbnails, local/S3 storage. Exposes files at `GET /api/media/files/*`.
- `shared` — `@Global()` module; exports `MediaClientService` (thin wrapper around `MediaService`) and `RedisService`. Import `SharedModule` to get media upload capability anywhere without re-importing `MediaModule`.
- `email` — BullMQ queue-backed email sending via SMTP. Processor in `processors/email.processor.ts`.
- `templates` — Handlebars template rendering for emails and PDFs (file-based, no DB).
- `notification`, `job` — DB-backed notification and background job records.

**Config namespaces** (`src/config/`):
- `app.config.ts` → `configService.get('app')` — app URL, JWT settings (default 30d access / 90d refresh token expiry), feature flags, timezone
- `services.config.ts` → Redis connection; also exports `getRedisConfig()` used by BullMQ and CacheModule

**CORS**: configured via `src/config/origins.ts`. Add new allowed origins to `defaultOrigins` or set `CORS_ORIGINS` env var (comma-separated, or `*` for all). Rate limiting is global via `ThrottlerGuard` registered as `APP_GUARD`. Security headers via Helmet, response compression enabled, 50MB request size cap enforced in `main.ts`.

**Media file URLs**: built by `MediaService.buildFileUrl()` using `configService.get<{apiUrl}>('app').apiUrl`. Locally this resolves to `http://localhost:3001/api/media/files/<path>`. The `API_URL` env var must be set correctly for URLs to work.

### admin-panel

All API calls go through `src/api/axiosClient.js`:
- Attaches JWT from `localStorage`/`sessionStorage` as `Authorization: Bearer <token>`
- Auto-logs out and redirects to `/login` on 401 (except `/admin/login`, `/admin/forgot-password`, `/admin/reset-password`, `/admin/logout` — these can legitimately 401 or trigger the logout itself)
- Omits `Content-Type` for `FormData` so the browser sets the multipart boundary

Each domain has its own file in `src/api/` (e.g. `postsApi.js`, `userApi.js`) — one function per endpoint, all calling through `axiosClient`. This is the single place that knows each URL shape; components never call `axios` directly. Page components live in `src/components/dashboard/`. Media URLs are normalized via `src/utils/mediaUtils.js` using `MEDIA_BASE_URL` from `src/config/app.js`.

Built with React 19, Vite 7, Tailwind CSS 4, TanStack Query, and react-router-dom 7.

## Prisma / PostgreSQL Conventions

**Timestamps**: `DateTime` columns use `@db.Timestamp(6)` in `schema.prisma` (e.g. `deleted_at DateTime? @db.Timestamp(6)`) — match this precision for new timestamp columns.

**Enums are defined in `schema.prisma`** (`UserRole`, `AuthType`, `DeviceType`, `BannerType`, `NotificationType`, `JobType`, `JobStatus`, `MediaType`, `StorageType`, `MediaStatus`, `EmailType`, `EmailStatus`, `CommunityUserRole`, `LikeStatus`, etc.) and imported from `@prisma/client` in service code (e.g. `import { SubscriptionStatus, PaymentStatus } from '@prisma/client'`).

**`strictPropertyInitialization`** is set to `false` in `tsconfig.json`. DTO class properties do not need `!` assertions — class-transformer populates them at runtime.

After changing `schema.prisma`, run `npx prisma generate` before TypeScript will pick up the new/changed types, and `npx prisma migrate dev` to apply the change to the local database.

## Redis Requirement

Redis is required for BullMQ (email queue) and `@nestjs/cache-manager`. The service will not start without it:
```bash
brew services start redis
```
