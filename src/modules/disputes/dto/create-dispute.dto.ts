import { IsString, IsNotEmpty, IsEnum, IsOptional, IsMongoId, IsArray } from 'class-validator';
import { DisputeType, DisputePriority } from '../schemas/dispute.schema';

export class CreateDisputeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(DisputeType)
  type: DisputeType;

  @IsEnum(DisputePriority)
  @IsOptional()
  priority?: DisputePriority;

  @IsMongoId()
  @IsNotEmpty()
  raisedAgainst: string;

  @IsMongoId()
  @IsOptional()
  project?: string;

  @IsMongoId()
  @IsOptional()
  contract?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}
