import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Application Information
  name: process.env.APP_NAME || 'Jawab Media Service',
  url: process.env.APP_URL || 'http://jawab.jantrah.io/jawab-media',
  apiUrl: process.env.API_URL || 'http://jawab.jantrah.io/jawab-media/api',
  
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB default
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    allowedMimeTypes: process.env.ALLOWED_MIME_TYPES || 'image/*,video/*,application/pdf',
  },
  
  // Storage Configuration
  storage: {
    type: process.env.STORAGE_TYPE || 'local', // 'local' or 's3'
    s3Bucket: process.env.S3_BUCKET || '',
    s3Region: process.env.S3_REGION || 'us-east-1',
  },
  
  // Media Processing
  processing: {
    optimizeImages: process.env.OPTIMIZE_IMAGES !== 'false',
    generateThumbnails: process.env.GENERATE_THUMBNAILS !== 'false',
    thumbnailSize: parseInt(process.env.THUMBNAIL_SIZE || '300', 10),
  },
}));

