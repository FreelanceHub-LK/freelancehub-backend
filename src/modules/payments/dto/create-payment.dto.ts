import { 
  IsNotEmpty, 
  IsNumber, 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsBoolean, 
  IsDateString,
  Min,
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType, PaymentMethod, PaymentMetadata } from '../schemas/payment.schema';

export class CreateEscrowDetailsDto {
  @ApiProperty({ description: 'Whether this payment is held in escrow' })
  @IsBoolean()
  isEscrow: boolean;

  @ApiPropertyOptional({ 
    description: 'Conditions for releasing escrow funds',
    type: [String]
  })
  @IsOptional()
  @IsString({ each: true })
  escrowReleaseConditions?: string[];

  @ApiPropertyOptional({ description: 'Associated milestone ID' })
  @IsOptional()
  @IsString()
  milestoneId?: string;

  @ApiPropertyOptional({ description: 'Date when escrow should be auto-released' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  releaseDate?: Date;

  @ApiPropertyOptional({ description: 'Enable automatic release after specified days' })
  @IsOptional()
  @IsBoolean()
  autoReleaseEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Number of days for auto-release' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  autoReleaseDays?: number;
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'Payment amount in cents', minimum: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @ApiProperty({ 
    description: 'Type of payment',
    enum: PaymentType
  })
  @IsNotEmpty()
  @IsEnum(PaymentType)
  type: PaymentType;

  @ApiProperty({ 
    description: 'Payment method',
    enum: PaymentMethod
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ description: 'ID of the user making the payment' })
  @IsNotEmpty()
  @IsString()
  payerId: string;

  @ApiProperty({ description: 'ID of the user receiving the payment' })
  @IsNotEmpty()
  @IsString()
  recipientId: string;

  @ApiPropertyOptional({ description: 'Associated project ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Payment description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Additional payment metadata'
  })
  @IsOptional()
  @IsObject()
  metadata?: PaymentMetadata;

  @ApiPropertyOptional({ 
    description: 'Escrow configuration',
    type: CreateEscrowDetailsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateEscrowDetailsDto)
  escrowDetails?: CreateEscrowDetailsDto;

  @ApiPropertyOptional({ description: 'Whether payment can be refunded', default: true })
  @IsOptional()
  @IsBoolean()
  isRefundable?: boolean = true;

  @ApiPropertyOptional({ description: 'Refund deadline' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  refundDeadline?: Date;
}