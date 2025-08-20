import { PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';
import { IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @ApiPropertyOptional({ description: 'Average rating' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  averageRating?: number;

  @ApiPropertyOptional({ description: 'Number of completed projects' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  completedProjects?: number;
}
