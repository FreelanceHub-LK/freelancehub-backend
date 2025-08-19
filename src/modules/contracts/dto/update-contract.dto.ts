import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDate, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateContractDto } from './create-contract.dto';
import { ContractStatus } from '../schemas/contract.schema';

export class UpdateContractDto extends PartialType(CreateContractDto) {
  @ApiPropertyOptional({ 
    description: 'Contract status',
    enum: ContractStatus,
    example: ContractStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @ApiPropertyOptional({ 
    description: 'Cancellation reason',
    example: 'Client decided to cancel the project'
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cancellationReason?: string;

  @ApiPropertyOptional({ 
    description: 'Contract completion date',
    example: '2024-02-15T00:00:00Z'
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  completedAt?: Date;
}
