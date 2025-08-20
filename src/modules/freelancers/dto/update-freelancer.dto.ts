import { PartialType } from '@nestjs/swagger';
import { CreateFreelancerDto } from './create-freelancer.dto';
import { IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFreelancerDto extends PartialType(CreateFreelancerDto) {
  @ApiPropertyOptional({ description: 'Number of completed projects' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  completedProjects?: number;
}
