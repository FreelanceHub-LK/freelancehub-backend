import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import fileUploadConfig from '../../config/file-upload.config';

@Module({
  imports: [
    ConfigModule.forFeature(fileUploadConfig),
  ],
  controllers: [FileUploadController],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
