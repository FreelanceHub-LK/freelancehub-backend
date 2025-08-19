import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { FileUploadService } from './file-upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('file-upload')
@Controller('file-upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Upload folder',
          example: 'projects'
        }
      },
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        filename: { type: 'string' },
        originalName: { type: 'string' },
        mimeType: { type: 'string' },
        size: { type: 'number' },
        url: { type: 'string' },
        key: { type: 'string' }
      }
    }
  })
  async uploadSingle(
    @UploadedFile() file: any,
    @Query('folder') folder: string = 'general',
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.fileUploadService.uploadFile(file, folder, req.user.id);
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        folder: {
          type: 'string',
          description: 'Upload folder',
          example: 'projects'
        }
      },
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Files uploaded successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          originalName: { type: 'string' },
          mimeType: { type: 'string' },
          size: { type: 'number' },
          url: { type: 'string' },
          key: { type: 'string' }
        }
      }
    }
  })
  async uploadMultiple(
    @UploadedFiles() files: any[],
    @Query('folder') folder: string = 'general',
    @Request() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    return this.fileUploadService.uploadMultipleFiles(files, folder, req.user.id);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({ name: 'key', description: 'File key in S3' })
  @ApiResponse({ 
    status: 200, 
    description: 'File deleted successfully' 
  })
  async deleteFile(@Param('key') key: string) {
    await this.fileUploadService.deleteFile(key);
    return { message: 'File deleted successfully' };
  }

  @Get('presigned-url/:key')
  @ApiOperation({ summary: 'Get presigned URL for file download' })
  @ApiParam({ name: 'key', description: 'File key in S3' })
  @ApiQuery({ name: 'expiresIn', required: false, description: 'URL expiration time in seconds' })
  @ApiResponse({ 
    status: 200, 
    description: 'Presigned URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' }
      }
    }
  })
  async getPresignedUrl(
    @Param('key') key: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    const url = await this.fileUploadService.getPresignedUrl(
      key, 
      expiresIn ? parseInt(expiresIn.toString()) : undefined
    );
    return { url };
  }

  @Post('presigned-upload-url')
  @ApiOperation({ summary: 'Generate presigned URL for file upload' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        folder: { type: 'string', example: 'projects' },
        fileExtension: { type: 'string', example: 'pdf' },
        expiresIn: { type: 'number', example: 3600 }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Presigned URLs generated successfully',
    schema: {
      type: 'object',
      properties: {
        uploadUrl: { type: 'string' },
        downloadUrl: { type: 'string' },
        key: { type: 'string' }
      }
    }
  })
  async generateUploadPresignedUrl(
    @Request() req: any,
    @Query('folder') folder: string = 'general',
    @Query('fileExtension') fileExtension?: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    return this.fileUploadService.generateUploadPresignedUrl(
      folder,
      req.user.id,
      fileExtension,
      expiresIn ? parseInt(expiresIn.toString()) : undefined
    );
  }
}
