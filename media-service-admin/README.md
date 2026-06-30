# media-service-admin

NestJS file upload and media processing service for the Jawab platform. Runs on **port 3000**.

Called internally by `backend-admin` via HTTP — not directly by the frontend.

## Features

- File uploads: images, videos, documents, audio
- Image optimization (Sharp — resize, compress, WebP conversion)
- Thumbnail generation
- Local filesystem and AWS S3 storage backends
- Public/private file access control

## Prerequisites

- Node.js 18+
- MySQL with `db_jawab_media` database created

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS db_jawab_media CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env`

```env
# Server
APP_NAME=Jawab Media Service
NODE_ENV=development
PORT=3000

# Database
NOTIFICATION_DB_HOST=localhost
NOTIFICATION_DB_PORT=3306
NOTIFICATION_DB_USERNAME=root
NOTIFICATION_DB_PASSWORD=
DB_NAME=db_jawab_media
DB_SYNCHRONIZE=true

# File Storage
UPLOAD_DIR=./uploads

# Media Processing
GENERATE_THUMBNAILS=true
OPTIMIZE_IMAGES=true
THUMBNAIL_SIZE=300
ALLOWED_MIME_TYPES=image/*,video/*,application/pdf
```

> The database config reads `NOTIFICATION_DB_HOST` (not `DB_HOST`) — this is intentional for consistency with the backend service. `DB_NAME` is the actual database name.

> `DB_SYNCHRONIZE=true` auto-creates the `media` table. Set to `false` in production.

### AWS S3 (optional)

Add to `.env` to enable S3 storage:

```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket
```

## Running

```bash
npm run start:dev     # watch mode
npm run build         # compile
npm run start:prod    # run compiled dist/main
```

Service starts at **http://localhost:3000**, API at **http://localhost:3000/api**

Uploaded files are served at: `http://localhost:3000/uploads/<filename>`

## If Tables Already Exist (from Failed Run)

```bash
mysql -u root -e "
  DROP DATABASE IF EXISTS db_jawab_media;
  CREATE DATABASE db_jawab_media CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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

## Database Schema

### `db_jawab_media`

**`media`**
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `uuid` | varchar(36) | unique identifier |
| `original_filename` | varchar(255) | uploaded filename |
| `filename` | varchar(255) | stored filename, indexed |
| `file_path` | varchar(500) | path or URL |
| `mime_type` | varchar(100) | e.g. `image/jpeg` |
| `file_size` | bigint | bytes |
| `media_type` | enum | `image`, `video`, `document`, `audio`, `other` |
| `storage_type` | enum | `local`, `s3`, `cloudinary` |
| `status` | enum | `pending`, `processing`, `ready`, `failed` |
| `width` | int | pixels, nullable |
| `height` | int | pixels, nullable |
| `duration` | int | seconds (video/audio), nullable |
| `thumbnail_path` | varchar(500) | nullable |
| `optimized_path` | varchar(500) | nullable |
| `file_hash` | varchar(64) | MD5/SHA256, nullable |
| `uploaded_by` | int | user ID, nullable |
| `folder` | varchar(255) | e.g. `profile-pictures`, nullable |
| `metadata` | text | JSON string, nullable |
| `download_count` | int | default 0 |
| `view_count` | int | default 0 |
| `is_active` | tinyint(1) | default 1 |
| `is_public` | tinyint(1) | default 0 |
| `created_at` | timestamp(6) | indexed |
| `updated_at` | timestamp(6) | |

---

## API Reference

Full API documentation: [API_MEDIA_SERVICE.md](./API_MEDIA_SERVICE.md)

### Upload a file

```bash
curl -X POST http://localhost:3000/api/media/upload \
  -F "file=@image.jpg" \
  -F "folder=profile-pictures" \
  -F "is_public=true"
```

### Get file URL

```bash
curl http://localhost:3000/api/media/1/url
```

### List media

```bash
curl "http://localhost:3000/api/media?page=1&limit=20"
```

### Serve a file directly

```
GET http://localhost:3000/uploads/<filename>
```
