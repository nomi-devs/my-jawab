# backend-admin

NestJS REST API for the Jawab admin platform. Runs on **port 3001**.

## Architecture

Two TypeORM database connections:
- **`default`** → `db_jawab` — users, posts, comments, polls, communities, topics, subscriptions, payments, **media**
- **`notification`** → `db_jawab_notify` — notifications, emails, jobs, email templates

Redis is required for BullMQ (email queue) and `@nestjs/cache-manager`. The service will not start without it.

File uploads are handled by the built-in `MediaModule` — no separate media service needed. Files are stored in `./uploads/` by default (configurable via `UPLOAD_DIR`).

## Prerequisites

- Node.js 18+
- MySQL with `db_jawab` and `db_jawab_notify` databases created
- Redis running on `localhost:6379`

```bash
brew services start mysql
brew services start redis
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create databases

```bash
mysql -u root -e "
  CREATE DATABASE IF NOT EXISTS db_jawab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE DATABASE IF NOT EXISTS db_jawab_notify CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"
```

### 3. Create `.env`

```env
# Main Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=db_jawab
DB_SYNCHRONIZE=true

# Notification Database
NOTIFICATION_DB_HOST=localhost
NOTIFICATION_DB_PORT=3306
NOTIFICATION_DB_USERNAME=root
NOTIFICATION_DB_PASSWORD=
NOTIFICATION_DB_NAME=db_jawab_notify
NOTIFICATION_DB_SYNCHRONIZE=true

# SMTP (Hostinger example)
SMTP_ENABLED=true
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your@email.com
SMTP_PASSWORD=yourpassword

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id

# Media / File Uploads
UPLOAD_DIR=./uploads
APP_URL=http://localhost:3001
API_URL=http://localhost:3001/api
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=image/*,video/*,application/pdf
```

> `DB_SYNCHRONIZE=true` auto-creates tables from entities. Set to `false` in production and use migrations.

### 4. Environment switch (local vs production)

Edit `src/config/services.config.ts`:

```typescript
export const hostType: 'local' | 'live' = 'local';
```

- `local` → Redis at `localhost:6379`, media service at `http://localhost:3000`
- `live` → Redis at `redis_container`, media service at production URL

## Running

```bash
npm run start:dev     # watch mode
npm run build         # compile
npm run start:prod    # run compiled dist/main
```

Service starts at **http://localhost:3001**, API at **http://localhost:3001/api**

## Create First Admin User

After the service starts and tables are created:

```bash
# Generate bcrypt hash
node -e "const bcrypt = require('./node_modules/bcrypt'); bcrypt.hash('YourPassword123', 10).then(h => console.log(h))"

# Insert admin user (replace <hash> with output above)
mysql -u root db_jawab -e "
  INSERT INTO users (username, email, password_hash, role, auth_type, is_active, is_verified)
  VALUES ('admin', 'admin@jawab.com', '<hash>', 'admin', 'email', 1, 1);
"
```

## MySQL 9.x Compatibility

If you see `Invalid default value for 'created_at'`, MySQL 9.x is rejecting the timestamp defaults. All entity `@CreateDateColumn` / `@UpdateDateColumn` decorators must use:

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

If you get `Duplicate key name` errors, tables from a previous failed run exist. Drop and recreate:

```bash
mysql -u root -e "
  DROP DATABASE IF EXISTS db_jawab;
  DROP DATABASE IF EXISTS db_jawab_notify;
  CREATE DATABASE db_jawab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE DATABASE db_jawab_notify CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"
```

## Commands

```bash
npm run start:dev     # development with watch
npm run start:prod    # production
npm run build         # TypeScript compile
npm run lint          # ESLint with auto-fix
npm run test          # Jest unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # coverage report
```

## Database Schemas

### `db_jawab` (main database)

**`users`**
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `role` | enum | `admin`, `sub_admin`, `pro_user`, `user` |
| `username` | varchar(255) | unique, indexed |
| `email` | varchar(255) | unique, indexed |
| `password_hash` | varchar(255) | bcrypt, nullable (social auth) |
| `auth_type` | enum | `email`, `phone`, `google`, `apple` |
| `is_active` | tinyint(1) | default 0 |
| `is_verified` | tinyint(1) | default 0 |
| `is_deleted` | tinyint(1) | soft delete flag |
| `deleted_at` | timestamp | nullable |
| `access_token` | varchar(500) | stored JWT, nullable |
| `refresh_token` | varchar(500) | nullable |
| `created_at` | timestamp(6) | |
| `updated_at` | timestamp(6) | |

**`user_profile`**
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `user_id` | int | unique FK → users.id |
| `full_name` | varchar(255) | nullable |
| `profile_picture` | varchar(500) | URL, nullable |
| `profile_background` | varchar(500) | URL, nullable |
| `tagline` | varchar(255) | nullable |
| `profile_bio` | text | nullable |
| `profile_gender` | enum | `male`, `female`, `other`, nullable |
| `profile_birthday` | date | nullable |
| `profile_website` | varchar(500) | nullable |
| `profile_location` | varchar(255) | nullable |

**`user_posts`**
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `user_id` | int | FK → users.id |
| `post_title` | varchar(500) | nullable |
| `post_slug` | varchar(500) | unique |
| `post_content` | text | nullable |
| `post_status` | enum | `draft`, `published`, `archived` |
| `post_type` | enum | `text`, `image`, `video`, `audio`, `link`, `poll` |
| `post_image` | varchar(500) | URL, nullable |
| `post_video` | varchar(500) | URL, nullable |
| `post_audio` | varchar(500) | URL, nullable |
| `post_link` | varchar(500) | nullable |
| `post_topic_id` | int | FK → topics.id, nullable |
| `is_featured` | tinyint(1) | default 0 |
| `like_count` | int | default 0 |
| `comment_count` | int | default 0 |
| `view_count` | int | default 0 |

**`topics`**
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `parent_id` | int | self-ref for nested topics, default 0 |
| `topic_name` | varchar(255) | indexed |
| `topic_slug` | varchar(255) | unique |
| `topic_description` | text | nullable |
| `topic_image` | varchar(500) | nullable |
| `is_active` | tinyint(1) | default 1 |

**`communities`**
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `name` | varchar(255) | |
| `slug` | varchar(255) | |
| `description` | text | nullable |
| `image` | varchar(500) | nullable |
| `is_active` | tinyint(1) | default 1 |
| `member_count` | int | default 0 |

**`subscriptions`**
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `subscription_name` | varchar(255) | unique |
| `subscription_type` | enum | `free`, `pro`, `premium` |
| `subscription_price` | decimal(10,2) | |
| `subscription_duration` | int | number of units |
| `subscription_duration_type` | enum | `days`, `weeks`, `months`, `years` |
| `features` | json | entitlements/feature flags |
| `is_active` | tinyint(1) | default 1 |

**`users_subscriptions`**
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `user_id` | int | FK → users.id |
| `subscription_id` | int | FK → subscriptions.id |
| `subscription_status` | enum | `pending`, `active`, `inactive`, `expired` |
| `subscription_start_date` | timestamp | nullable |
| `subscription_end_date` | timestamp | nullable |
| `subscription_renewal_amount` | decimal(10,2) | |
| `subscription_renewal_currency` | varchar(10) | |
| `subscription_renewal_gateway` | varchar(255) | |

### `db_jawab_notify` (notification database)

**`notifications`**
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `user_id` | int | recipient |
| `notification_type` | enum | `comment`, `reply`, `like`, `follow`, `mention`, `system`, etc. |
| `title` | varchar(255) | |
| `body` | text | |
| `data` | json | extra payload, nullable |
| `is_read` | tinyint(1) | default 0 |
| `push_status` | enum | `pending`, `sent`, `delivered`, `failed`, nullable |
| `priority` | enum | `low`, `normal`, `high`, `urgent` |
| `expires_at` | timestamp | nullable |

**`templates`**
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `name` | varchar(255) | indexed |
| `slug` | varchar(255) | unique |
| `type` | enum | `email`, `pdf`, `html`, `sms` |
| `category` | enum | `verification`, `password_reset`, `welcome`, `notification`, etc. |
| `subject` | varchar(500) | for email templates, nullable |
| `content` | text | HTML content |
| `text_content` | text | plain text version, nullable |
| `variables` | json | template variable schema, nullable |
| `is_active` | tinyint(1) | default 1 |

---

## Key Modules

| Module | Description |
|---|---|
| `admin` | Main fat module — dashboard stats, user/content management, cross-module operations |
| `auth` | User registration, login, JWT, OAuth (Google/Apple), email verification |
| `user` | User profiles, followers, topics |
| `post` | Posts, likes |
| `comment` | Comments, likes |
| `poll` | Polls, options, votes |
| `community` | Communities, members |
| `subscription` | Plans, user subscriptions, payments |
| `notification` | Push/in-app/email notifications (uses `notification` DB connection) |
| `email` | Email queue via BullMQ (uses `notification` DB connection) |
| `templates` | Email/PDF templates (uses `notification` DB connection) |
| `shared` | `MediaClientService` — HTTP client for media-service-admin |
