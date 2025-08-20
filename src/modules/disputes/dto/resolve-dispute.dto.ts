import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveDisputeDto {
  @ApiProperty({
    description: 'Resolution description',
    example: 'The dispute has been resolved in favor of the client. The freelancer must provide a refund.'
  })
  @IsString()
  resolution: string;

  @ApiPropertyOptional({
    description: 'Compensation amount in cents',
    example: 10000
  })
  @IsOptional()
  @IsNumber()
  compensationAmount?: number;

  @ApiPropertyOptional({
    description: 'Who receives the compensation (freelancer or client)',
    example: 'client'
  })
  @IsOptional()
  @IsString()
  @IsIn(['freelancer', 'client'])
  compensationTo?: string;
}
