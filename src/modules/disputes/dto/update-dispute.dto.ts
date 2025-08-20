import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateDisputeDto } from './create-dispute.dto';
import { DisputeStatus, DisputePriority } from '../schemas/dispute.schema';

export class UpdateDisputeDto extends PartialType(CreateDisputeDto) {
  @IsEnum(DisputeStatus)
  @IsOptional()
  status?: DisputeStatus;

  @IsEnum(DisputePriority)
  @IsOptional()
  priority?: DisputePriority;
}
