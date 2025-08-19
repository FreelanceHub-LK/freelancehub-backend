import { 
  Injectable, 
  BadRequestException, 
  Logger,
  Inject 
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand,
  GetObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import fileUploadConfig from '../../config/file-upload.config';

export interface UploadResult {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  key: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  downloadUrl: string;
  key: string;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly s3Client: S3Client;

  constructor(
    @Inject(fileUploadConfig.KEY)
    private readonly uploadConfig: ConfigType<typeof fileUploadConfig>,
  ) {
    const awsConfig = this.uploadConfig.aws;
    
    if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
      this.logger.warn('AWS credentials not provided. File upload functionality will be disabled.');
      // Initialize with dummy credentials for development
      this.s3Client = new S3Client({
        region: awsConfig.region,
        credentials: {
          accessKeyId: 'dummy',
          secretAccessKey: 'dummy',
        },
      });
      return;
    }

    this.s3Client = new S3Client({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
      ...(awsConfig.endpoint && {
        endpoint: awsConfig.endpoint,
      }),
    });
  }

  async uploadFile(
    file: any,
    folder: string = 'general',
    userId?: string,
  ): Promise<UploadResult> {
    try {
      if (!this.uploadConfig.aws.accessKeyId || !this.uploadConfig.aws.secretAccessKey) {
        throw new BadRequestException('File upload is not configured. Please contact administrator.');
      }

      // Validate file size
      if (file.size > this.uploadConfig.maxFileSize) {
        throw new BadRequestException(
          `File size exceeds maximum allowed size of ${this.uploadConfig.maxFileSize} bytes`
        );
      }

      // Validate file type
      const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
      if (!this.uploadConfig.allowedFileTypes.includes(fileExtension)) {
        throw new BadRequestException(
          `File type ${fileExtension} is not allowed. Allowed types: ${this.uploadConfig.allowedFileTypes.join(', ')}`
        );
      }

      // Generate unique filename
      const filename = `${uuidv4()}.${fileExtension}`;
      const key = `${folder}/${userId ? `${userId}/` : ''}${filename}`;

      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: this.uploadConfig.aws.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedBy: userId || 'anonymous',
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(uploadCommand);

      // Generate public URL
      const url = `https://${this.uploadConfig.aws.bucketName}.s3.${this.uploadConfig.aws.region}.amazonaws.com/${key}`;

      const result: UploadResult = {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        key,
      };

      this.logger.log(`File uploaded successfully: ${key}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  }

  async uploadMultipleFiles(
    files: any[],
    folder: string = 'general',
    userId?: string,
  ): Promise<UploadResult[]> {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, folder, userId));
      return await Promise.all(uploadPromises);
    } catch (error) {
      this.logger.error(`Failed to upload multiple files: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.uploadConfig.aws.bucketName,
        Key: key,
      });

      await this.s3Client.send(deleteCommand);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}: ${error.message}`);
      throw error;
    }
  }

  async getPresignedUrl(
    key: string,
    expiresIn: number = 3600, // 1 hour
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.uploadConfig.aws.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for ${key}: ${error.message}`);
      throw error;
    }
  }

  async generateUploadPresignedUrl(
    folder: string = 'general',
    userId?: string,
    fileExtension?: string,
    expiresIn: number = 3600,
  ): Promise<PresignedUrlResult> {
    try {
      const filename = `${uuidv4()}${fileExtension ? `.${fileExtension}` : ''}`;
      const key = `${folder}/${userId ? `${userId}/` : ''}${filename}`;

      // Generate presigned URL for upload
      const uploadCommand = new PutObjectCommand({
        Bucket: this.uploadConfig.aws.bucketName,
        Key: key,
        Metadata: {
          uploadedBy: userId || 'anonymous',
        },
      });

      const uploadUrl = await getSignedUrl(this.s3Client, uploadCommand, { expiresIn });

      // Generate presigned URL for download
      const downloadCommand = new GetObjectCommand({
        Bucket: this.uploadConfig.aws.bucketName,
        Key: key,
      });

      const downloadUrl = await getSignedUrl(this.s3Client, downloadCommand, { expiresIn });

      return {
        uploadUrl,
        downloadUrl,
        key,
      };
    } catch (error) {
      this.logger.error(`Failed to generate upload presigned URL: ${error.message}`);
      throw error;
    }
  }

  validateFileType(filename: string): boolean {
    const fileExtension = path.extname(filename).toLowerCase().slice(1);
    return this.uploadConfig.allowedFileTypes.includes(fileExtension);
  }

  validateFileSize(size: number): boolean {
    return size <= this.uploadConfig.maxFileSize;
  }

  getFileUrl(key: string): string {
    return `https://${this.uploadConfig.aws.bucketName}.s3.${this.uploadConfig.aws.region}.amazonaws.com/${key}`;
  }
}
