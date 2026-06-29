# Jawab Media Service

A comprehensive, optimized media storage and processing service built with NestJS. Handles file uploads, image optimization, thumbnail generation, and supports both local filesystem and AWS S3 storage.

## Features

- 📤 **File Upload**: Support for images, videos, documents, and audio files
- 🖼️ **Image Optimization**: Automatic resizing, compression, and format conversion (WebP/AVIF)
- 🎬 **Thumbnail Generation**: Automatic thumbnail creation for images
- 💾 **Multiple Storage Backends**: Local filesystem and AWS S3 support
- 🔒 **Access Control**: Public/private file access with user-based permissions
- 📊 **Metadata Management**: Full CRUD operations for media files
- ⚡ **Performance Optimized**: Caching, connection pooling, and efficient queries
- 🔐 **Security**: File validation, size limits, and secure file serving

## Tech Stack

- **Framework**: NestJS 11
- **Database**: MySQL with TypeORM
- **Image Processing**: Sharp
- **Storage**: Local filesystem / AWS S3
- **Validation**: class-validator, class-transformer
- **Security**: Helmet, CORS, Rate Limiting

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
```

## Configuration

Create a `.env` file with the following variables:

```env
# Server
PORT=3001
NODE_ENV=development
BASE_URL=http://localhost:3001

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=db_jawab_media

# Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket
```

## Running the Service

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Documentation

See [API_MEDIA_SERVICE.md](./API_MEDIA_SERVICE.md) for complete API documentation.

## Quick Start

### Upload a File

```bash
curl -X POST http://localhost:3001/api/media/upload \
  -F "file=@image.jpg" \
  -F "folder=profile-pictures" \
  -F "is_public=true"
```

### List Media

```bash
curl http://localhost:3001/api/media?page=1&limit=20
```

### Get File URL

```bash
curl http://localhost:3001/api/media/1/url
```

## Project Structure

```
src/
├── modules/
│   └── media/
│       ├── entities/          # Database entities
│       ├── dto/               # Data transfer objects
│       ├── services/          # Business logic services
│       ├── media.controller.ts
│       ├── media.service.ts
│       └── media.module.ts
├── database/
│   └── config/               # Database configuration
├── app.module.ts
└── main.ts
```

## License

UNLICENSED
