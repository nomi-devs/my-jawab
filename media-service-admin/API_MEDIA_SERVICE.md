db_jawab_media# Media Service API Documentation

## Overview

The Media Service provides comprehensive file upload, storage, and processing capabilities for the Jawab platform. It supports multiple storage backends (local filesystem and AWS S3), automatic image optimization, thumbnail generation, and full CRUD operations for media management.

**Base URL**: `http://localhost:3001/api`

**Features**:
- File upload with automatic type detection
- Image optimization (resize, compress, format conversion)
- Thumbnail generation
- Multiple storage backends (Local, S3)
- Secure file serving
- Media metadata management
- Public/private access control

---

## Table of Contents

1. [File Upload](#file-upload)
2. [List Media](#list-media)
3. [Get Media](#get-media)
4. [Update Media](#update-media)
5. [Delete Media](#delete-media)
6. [Optimize Image](#optimize-image)
7. [Get File URL](#get-file-url)
8. [Download File](#download-file)
9. [Serve File](#serve-file)
10. [Request/Response Examples](#requestresponse-examples)
11. [Error Handling](#error-handling)
12. [Configuration](#configuration)

---

## File Upload

### 1. Upload File

Upload a file (image, video, document, audio) to the media service.

**Endpoint**: `POST /api/media/upload`

**Content-Type**: `multipart/form-data`

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | The file to upload |
| `folder` | string | No | Folder/category for organization. If not provided, files will be stored in the `other` folder |
| `media_type` | enum | No | `image`, `video`, `document`, `audio`, `other` (auto-detected if not provided) |
| `storage_type` | enum | No | `local` or `s3` (defaults to configured storage) |
| `is_public` | boolean | No | Make file publicly accessible (default: false) |
| `optimize` | boolean | No | Automatically optimize images (default: true) |
| `userId` | number | No | User ID who uploaded the file (for access control) |

**Response** (201 Created):
```json
{
  "id": 1,
  "original_filename": "photo.jpg",
  "filename": "photo_1234567890_abc12345.jpg",
  "file_path": "images/photo_1234567890_abc12345.jpg",
  "mime_type": "image/jpeg",
  "file_size": 245678,
  "file_size_formatted": "240.00 KB",
  "media_type": "image",
  "storage_type": "local",
  "status": "ready",
  "width": 1920,
  "height": 1080,
  "duration": null,
  "thumbnail_path": "thumbnails/photo_thumb_1234567890.jpg",
  "optimized_path": "optimized/photo_optimized_1234567890.webp",
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "folder": "other",
  "uploaded_by": 1,
  "download_count": 0,
  "view_count": 0,
  "is_active": true,
  "is_public": false,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Response Fields**:
- `file_size`: File size in bytes (number)
- `file_size_formatted`: Human-readable file size with unit (string, e.g., "240.00 KB", "2.45 MB", "1.50 GB")

**Supported File Types**:
- **Images**: JPEG, PNG, GIF, WebP, AVIF
- **Videos**: MP4, AVI, MOV, WebM
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
- **Audio**: MP3, WAV, OGG, AAC

**File Size Limits**:
- Default: 50MB (configurable via `MAX_FILE_SIZE`)

**Image Optimization**:
- Automatic resizing (max 2048px by default)
- Format conversion (WebP/AVIF for better compression)
- Thumbnail generation (300px by default)
- Quality optimization (80% by default)

**Error Responses**:
- `400 Bad Request`: Invalid file type or file too large
- `413 Payload Too Large`: File exceeds maximum size

---

## List Media

### 2. List Media

Get paginated list of media files with optional filtering and sorting.

**Endpoint**: `GET /api/media`

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 20 | Items per page (max 100) |
| `search` | string | No | - | Search in filename |
| `media_type` | enum | No | - | Filter by media type |
| `status` | enum | No | - | Filter by status (`pending`, `processing`, `ready`, `failed`) |
| `folder` | string | No | - | Filter by folder |
| `sort_by` | string | No | `created_at` | Field to sort by |
| `sort_order` | string | No | `DESC` | `ASC` or `DESC` |
| `userId` | number | No | - | Filter by user ID |

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "original_filename": "photo.jpg",
      "filename": "photo_1234567890_abc12345.jpg",
      "file_path": "images/photo_1234567890_abc12345.jpg",
      "mime_type": "image/jpeg",
      "file_size": 245678,
      "file_size_formatted": "240.00 KB",
      "media_type": "image",
      "storage_type": "local",
      "status": "ready",
      "width": 1920,
      "height": 1080,
      "thumbnail_path": "thumbnails/photo_thumb_1234567890.jpg",
      "optimized_path": "optimized/photo_optimized_1234567890.webp",
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "folder": "other",
      "uploaded_by": 1,
      "download_count": 5,
      "view_count": 12,
      "is_active": true,
      "is_public": false,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "total_pages": 8
  }
}
```

---

## Get Media

### 3. Get Media by ID

Get detailed information about a specific media file by ID.

**Endpoint**: `GET /api/media/:id`

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Media ID |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | number | No | User ID for access control |

**Response** (200 OK):
```json
{
  "id": 1,
  "original_filename": "photo.jpg",
  "filename": "photo_1234567890_abc12345.jpg",
  "file_path": "images/photo_1234567890_abc12345.jpg",
  "mime_type": "image/jpeg",
  "file_size": 245678,
  "file_size_formatted": "240.00 KB",
  "media_type": "image",
  "storage_type": "local",
  "status": "ready",
  "width": 1920,
  "height": 1080,
  "thumbnail_path": "thumbnails/photo_thumb_1234567890.jpg",
  "optimized_path": "optimized/photo_optimized_1234567890.webp",
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "folder": "other",
  "uploaded_by": 1,
  "download_count": 5,
  "view_count": 13,
  "is_active": true,
  "is_public": false,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Note**: View count is automatically incremented on each request.

**Error Responses**:
- `404 Not Found`: Media not found or access denied

---

### 4. Get Media by UUID

Get detailed information about a specific media file by UUID.

**Endpoint**: `GET /api/media/uuid/:uuid`

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uuid` | string | Yes | Media UUID |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | number | No | User ID for access control |

**Response**: Same as Get Media by ID

---

## Update Media

### 5. Update Media

Update media metadata (folder, public status, active status).

**Endpoint**: `PUT /api/media/:id`

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Media ID |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | number | No | User ID (required for ownership verification) |

**Request Body** (all fields optional):
```json
{
  "folder": "profile-pictures",
  "is_public": true,
  "is_active": true
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "original_filename": "photo.jpg",
  "filename": "photo_1234567890_abc12345.jpg",
  "file_path": "images/photo_1234567890_abc12345.jpg",
  "mime_type": "image/jpeg",
  "file_size": 245678,
  "file_size_formatted": "240.00 KB",
  "media_type": "image",
  "storage_type": "local",
  "status": "ready",
  "width": 1920,
  "height": 1080,
  "thumbnail_path": "thumbnails/photo_thumb_1234567890.jpg",
  "optimized_path": "optimized/photo_optimized_1234567890.webp",
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "folder": "profile-pictures",
  "uploaded_by": 1,
  "download_count": 5,
  "view_count": 13,
  "is_active": true,
  "is_public": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request`: No permission to update this media
- `404 Not Found`: Media not found

---

## Delete Media

### 6. Delete Media

Delete a media file (soft delete - marks as inactive).

**Endpoint**: `DELETE /api/media/:id`

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Media ID |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | number | No | User ID (required for ownership verification) |

**Response** (200 OK):
```json
{
  "message": "Media deleted successfully"
}
```

**Note**: This is a soft delete. Files are marked as inactive but not immediately removed from storage.

**Error Responses**:
- `400 Bad Request`: No permission to delete this media
- `404 Not Found`: Media not found

---

## Optimize Image

### 7. Optimize Image

Re-optimize an existing image with custom settings.

**Endpoint**: `POST /api/media/:id/optimize`

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Media ID |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | number | No | User ID (required for ownership verification) |

**Request Body** (all fields optional):
```json
{
  "width": 1200,
  "height": 800,
  "quality": 85,
  "format": "webp"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `width` | integer | No | Target width (1-5000) |
| `height` | integer | No | Target height (1-5000) |
| `quality` | integer | No | Quality (1-100, default: 80) |
| `format` | enum | No | Output format: `jpeg`, `png`, `webp`, `avif` |

**Response** (200 OK):
```json
{
  "id": 1,
  "original_filename": "photo.jpg",
  "filename": "photo_1234567890_abc12345.jpg",
  "file_path": "images/photo_1234567890_abc12345.jpg",
  "mime_type": "image/jpeg",
  "file_size": 245678,
  "file_size_formatted": "240.00 KB",
  "media_type": "image",
  "storage_type": "local",
  "status": "ready",
  "width": 1200,
  "height": 800,
  "thumbnail_path": "thumbnails/photo_thumb_1234567890.jpg",
  "optimized_path": "optimized/photo_optimized_1234567890.webp",
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "folder": "other",
  "uploaded_by": 1,
  "download_count": 5,
  "view_count": 13,
  "is_active": true,
  "is_public": false,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request`: Only images can be optimized / No permission
- `404 Not Found`: Media not found

---

## Get File URL

### 8. Get File URL

Get a signed URL for accessing a file (useful for S3 storage).

**Endpoint**: `GET /api/media/:id/url`

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Media ID |

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `optimized` | boolean | No | false | Return optimized version URL |
| `expiresIn` | integer | No | 3600 | URL expiration in seconds |

**Response** (200 OK):
```json
{
  "url": "https://s3.amazonaws.com/bucket/images/photo_1234567890_abc12345.jpg?X-Amz-Algorithm=..."
}
```

**Note**: For local storage, returns a direct file URL. For S3, returns a pre-signed URL.

---

## Download File

### 9. Download File

Download a file directly.

**Endpoint**: `GET /api/media/:id/download`

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Media ID |

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `optimized` | boolean | No | false | Download optimized version |

**Response**: File stream with appropriate headers

**Headers**:
- `Content-Type`: File MIME type
- `Content-Disposition`: Attachment with filename
- `Content-Length`: File size

**Note**: Download count is automatically incremented.

---

## Serve File

### 10. Serve File

Serve a file directly (for embedding in HTML, etc.). Supports both public files and private files (with owner authentication).

**Endpoint**: `GET /api/media/files/*`

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `*` | string | Yes | File path relative to upload directory (e.g., `other/filename.jpg`, `optimized/other/filename.webp`, `thumbnails/other/filename.jpg`) |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | number | No | User ID for accessing non-public files (must be the file owner) |

**Response**: File stream with appropriate headers

**Headers**:
- `Content-Type`: File MIME type
- `Cache-Control`: `public, max-age=31536000` (1 year)

**Access Rules**:
- **Public files** (`is_public: true`): Accessible by anyone without authentication
- **Private files** (`is_public: false`): Only accessible by the file owner (must provide `userId` query parameter matching `uploaded_by`)

**Error Responses**:
- `404 Not Found`: File not found
- `403 Forbidden`: File is not public and you are not the owner

**Examples**:
```bash
# Access public file
curl "http://localhost:3001/api/media/files/other/photo.jpg"

# Access private file (as owner)
curl "http://localhost:3001/api/media/files/other/photo.jpg?userId=1"

# Access optimized image
curl "http://localhost:3001/api/media/files/optimized/other/photo_optimized.webp?userId=1"

# Access thumbnail
curl "http://localhost:3001/api/media/files/thumbnails/other/photo_thumb.jpg?userId=1"
```

---

## Making Files Public and Accessing Private Files

### Making a File Public

There are two ways to make a file public:

#### 1. During Upload
Set `is_public: true` in the upload request:

```bash
curl -X POST http://localhost:3001/api/media/upload \
  -F "file=@photo.jpg" \
  -F "is_public=true" \
  -F "folder=profile-pictures"
```

#### 2. After Upload (Update)
Use the Update Media endpoint to change `is_public` to `true`:

```bash
curl -X PUT http://localhost:3001/api/media/4 \
  -H "Content-Type: application/json" \
  -d '{"is_public": true}' \
  --data-urlencode "userId=1"
```

### Accessing Private Files

Private files (`is_public: false`) can only be accessed by the file owner. To access a private file:

1. **Get the file path** from the media record (e.g., `file_path`, `optimized_path`, or `thumbnail_path`)
2. **Include the `userId` query parameter** matching the `uploaded_by` field

**Example**:
```bash
# Access private file as owner
curl "http://localhost:3001/api/media/files/other/photo.jpg?userId=1"

# Access private optimized image as owner
curl "http://localhost:3001/api/media/files/optimized/other/photo_optimized.webp?userId=1"
```

**Note**: If you try to access a private file without the correct `userId`, you'll get a `403 Forbidden` error.

---

## Request/Response Examples

### cURL Examples

#### Upload File
```bash
curl -X POST http://localhost:3001/api/media/upload \
  -F "file=@/path/to/image.jpg" \
  -F "folder=profile-pictures" \
  -F "is_public=true" \
  -F "optimize=true" \
  -F "userId=1"
```

#### List Media
```bash
curl -X GET "http://localhost:3001/api/media?page=1&limit=20&media_type=image&sort_by=created_at&sort_order=DESC" \
  -H "Content-Type: application/json"
```

#### Get Media by ID
```bash
curl -X GET http://localhost:3001/api/media/1 \
  -H "Content-Type: application/json"
```

#### Update Media
```bash
curl -X PUT http://localhost:3001/api/media/1 \
  -H "Content-Type: application/json" \
  -d '{
    "folder": "profile-pictures",
    "is_public": true
  }' \
  --data-urlencode "userId=1"
```

#### Optimize Image
```bash
curl -X POST http://localhost:3001/api/media/1/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "width": 1200,
    "height": 800,
    "quality": 85,
    "format": "webp"
  }' \
  --data-urlencode "userId=1"
```

#### Download File
```bash
curl -X GET "http://localhost:3001/api/media/1/download?optimized=false" \
  -o downloaded_file.jpg
```

### JavaScript/TypeScript Examples

#### Using Fetch API
```javascript
// Upload File
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folder', 'profile-pictures');
formData.append('is_public', 'true');
formData.append('optimize', 'true');
formData.append('userId', '1');

const uploadResponse = await fetch('http://localhost:3001/api/media/upload', {
  method: 'POST',
  body: formData,
});

const media = await uploadResponse.json();

// List Media
const listResponse = await fetch(
  'http://localhost:3001/api/media?page=1&limit=20&media_type=image',
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }
);

const mediaList = await listResponse.json();

// Get File URL
const urlResponse = await fetch(
  'http://localhost:3001/api/media/1/url?optimized=true&expiresIn=3600'
);
const { url } = await urlResponse.json();
```

#### Using Axios
```javascript
import axios from 'axios';

// Upload File
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folder', 'profile-pictures');
formData.append('is_public', 'true');

const uploadResponse = await axios.post(
  'http://localhost:3001/api/media/upload',
  formData,
  {
    params: { userId: 1 },
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }
);

// List Media
const listResponse = await axios.get('http://localhost:3001/api/media', {
  params: {
    page: 1,
    limit: 20,
    media_type: 'image',
    sort_by: 'created_at',
    sort_order: 'DESC',
  },
});

// Optimize Image
const optimizeResponse = await axios.post(
  'http://localhost:3001/api/media/1/optimize',
  {
    width: 1200,
    height: 800,
    quality: 85,
    format: 'webp',
  },
  {
    params: { userId: 1 },
  }
);
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message or array of validation errors",
  "error": "Error type"
}
```

### Common Error Codes

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| `400` | Bad Request | Invalid input, validation errors, file type not allowed |
| `404` | Not Found | Media doesn't exist or access denied |
| `413` | Payload Too Large | File exceeds maximum size |
| `500` | Internal Server Error | Server error, processing failure |

---

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
BASE_URL=http://localhost:3001

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=db_jawab_media
DB_SYNCHRONIZE=false
DB_LOGGING=false

# Storage Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=image/*,video/*,application/pdf

# AWS S3 Configuration (Optional)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name

# Image Processing Configuration
MAX_IMAGE_SIZE=2048
MAX_THUMBNAIL_SIZE=300
THUMBNAIL_QUALITY=80
SUPPORT_WEBP=true
SUPPORT_AVIF=false

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Cache Configuration
CACHE_TTL=300
CACHE_MAX=1000
REDIS_HOST=
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Storage Backends

#### Local Storage (Default)
- Files stored in `UPLOAD_DIR` directory
- Organized in subdirectories: `images/`, `videos/`, `documents/`, `thumbnails/`, `optimized/`
- Direct file serving via `/api/media/files/*` endpoint

#### AWS S3 Storage
- Requires AWS credentials and bucket configuration
- Files uploaded to S3 bucket
- Pre-signed URLs for secure access
- Set `storage_type=s3` in upload request or configure as default

---

## Performance Optimizations

### Image Optimization
- **Automatic Resizing**: Large images resized to max 2048px
- **Format Conversion**: Modern formats (WebP/AVIF) for better compression
- **Quality Optimization**: Configurable quality (default 80%)
- **Thumbnail Generation**: Automatic 300px thumbnails

### Caching
- **File Serving**: 1-year cache headers for public files
- **Metadata Caching**: Redis/in-memory cache for frequently accessed media
- **CDN Ready**: Works with CDN for static file serving

### Database Optimization
- **Indexed Fields**: UUID, file_hash, media_type, status, folder
- **Connection Pooling**: Configurable pool sizes
- **Query Optimization**: Efficient pagination and filtering

---

## Security Considerations

1. **File Validation**: MIME type and file extension validation
2. **Size Limits**: Configurable maximum file sizes
3. **Access Control**: Public/private file access
4. **Ownership Verification**: User-based access control
5. **Secure Storage**: S3 pre-signed URLs for private files
6. **Input Sanitization**: Filename sanitization and path validation
7. **Rate Limiting**: Global rate limiting on all endpoints

---

**Last Updated**: 2024-01-01  
**Service Version**: 1.0.0

