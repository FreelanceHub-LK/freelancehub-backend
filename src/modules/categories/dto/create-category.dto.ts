import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Web Development' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Services related to website development' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'code', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ example: '64f5a7b2c3d4e5f6a7b8c9d0', required: false })
  @IsMongoId()
  @IsOptional()
  parent?: string;

  @ApiProperty({ example: true, default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;
}
