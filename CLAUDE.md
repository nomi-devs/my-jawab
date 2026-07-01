# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Two active services in one repo:

| Service | Tech | Port | Directory |
|---|---|---|---|
| `backend-admin` | NestJS + TypeORM | 3001 | `backend-admin/` |
| `admin-panel` | React + Vite | 5173 | `admin-panel/` |

`media-service-admin/` is retired — its functionality was merged into `backend-admin`. Ignore it.

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
```

### admin-panel (run from inside `admin-panel/`)
```bash
npm run dev           # Vite dev server at localhost:5173
npm run build         # production build
```

### Database setup (MySQL, local)
```bash
mysql -u root -e "
  DROP DATABASE IF EXISTS db_jawab;
  CREATE DATABASE db_jawab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"
```

### Create initial admin user (after DB is created and service has synced tables)
```bash
# From inside backend-admin/
node -e "const bcrypt = require('./node_modules/bcrypt'); bcrypt.hash('YourPassword', 10).then(h => console.log(h))"
mysql -u root db_jawab -e "INSERT INTO users (username, email, password_hash, role, auth_type, is_active, is_verified) VALUES ('admin', 'admin@jawab.com', '<hash>', 'admin', 'email', 1, 1);"
```

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
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=db_jawab
DB_SYNCHRONIZE=true
APP_URL=http://localhost:3001
API_URL=http://localhost:3001/api
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
```

> DB config defaults to `sql_container` (Docker). `.env` overrides to `localhost` for local dev. `admin-panel` has no `.env` — all config lives in `src/config/app.js`.

## Architecture

### backend-admin

Single TypeORM connection (`db_jawab`). All entities — users, posts, comments, polls, communities, topics, subscriptions, payments, media, notifications, emails, jobs, templates — live in one database. `autoLoadEntities: true` means any entity registered via `TypeOrmModule.forFeature([Entity])` in its module is picked up automatically; no global entity list to maintain.

**Module layout** (`src/modules/`):

- `admin` — fat module; `AdminService` contains most cross-cutting business logic (dashboard stats, user/content moderation). Other module services are injected into it.
- `auth` — JWT + Passport, Google/Apple OAuth, email verification, password reset. `JwtAuthGuard` is applied per-controller via `@UseGuards(JwtAuthGuard)`, not globally.
- `media` — file uploads, Sharp image optimization (WebP/AVIF), ffmpeg video thumbnails, local/S3 storage. Exposes files at `GET /api/media/files/*`.
- `shared` — `@Global()` module; exports `MediaClientService` (thin wrapper around `MediaService`) and `RedisService`. Import `SharedModule` to get media upload capability anywhere without re-importing `MediaModule`.
- `email` — BullMQ queue-backed email sending via SMTP. Processor in `processors/email.processor.ts`.
- `templates` — Handlebars template rendering for emails and PDFs (file-based, no DB).
- `notification`, `job` — DB-backed notification and background job records.

**Config namespaces** (`src/config/`):
- `app.config.ts` → `configService.get('app')` — app URL, JWT settings, feature flags, timezone
- `services.config.ts` → Redis connection; also exports `getRedisConfig()` used by BullMQ and CacheModule

**CORS**: configured via `src/config/origins.ts`. Add new allowed origins to `defaultOrigins` or set `CORS_ORIGINS` env var (comma-separated). Rate limiting is global via `ThrottlerGuard` registered as `APP_GUARD`.

**Media file URLs**: built by `MediaService.buildFileUrl()` using `configService.get<{apiUrl}>('app').apiUrl`. Locally this resolves to `http://localhost:3001/api/media/files/<path>`. The `API_URL` env var must be set correctly for URLs to work.

### admin-panel

All API calls go through `src/api/axiosClient.js`:
- Attaches JWT from `localStorage`/`sessionStorage` as `Authorization: Bearer <token>`
- Auto-logs out and redirects to `/login` on 401 (except auth endpoints)
- Omits `Content-Type` for `FormData` so the browser sets the multipart boundary

Each domain has its own file in `src/api/` (e.g. `postsApi.js`, `userApi.js`). Page components live in `src/components/dashboard/`. Media URLs are normalized via `src/utils/mediaUtils.js` using `MEDIA_BASE_URL` from `src/config/app.js`.

## MySQL 9.x Compatibility

MySQL 9.x requires `TIMESTAMP(N) DEFAULT CURRENT_TIMESTAMP(N)` — precision must match exactly. All entity timestamp columns must be:

```typescript
@CreateDateColumn({
  type: 'timestamp',
  default: () => 'CURRENT_TIMESTAMP(6)',
})
created_at: Date;

@UpdateDateColumn({
  type: 'timestamp',
  default: () => 'CURRENT_TIMESTAMP(6)',
  onUpdate: 'CURRENT_TIMESTAMP(6)',
})
updated_at: Date;
```

Never add `precision: 0` — TypeORM emits `timestamp(0) DEFAULT CURRENT_TIMESTAMP(6)` which MySQL 9.x rejects.

## TypeORM Entity Conventions

**Duplicate index pitfall:** `@Index()` on a column that already has `unique: true` or `@Unique([...])` causes a `Duplicate key name` error at sync time. Use only one mechanism per column — prefer `unique: true` in `@Column`; never add `@Index()` on the same column.

**`strictPropertyInitialization`** is set to `false` in `tsconfig.json`. DTO class properties do not need `!` assertions — class-transformer populates them at runtime.

## Redis Requirement

Redis is required for BullMQ (email queue) and `@nestjs/cache-manager`. The service will not start without it:
```bash
brew services start redis
```
