import { registerAs } from '@nestjs/config';

export default registerAs('fileUpload', () => ({
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt'
  ],
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
  ],
  uploadPath: 'uploads/',
  presignedUrlExpiry: parseInt(process.env.PRESIGNED_URL_EXPIRY || '3600'), // 1 hour default
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    bucketName: process.env.AWS_S3_BUCKET_NAME,
    endpoint: process.env.AWS_S3_ENDPOINT,
  },
}));
