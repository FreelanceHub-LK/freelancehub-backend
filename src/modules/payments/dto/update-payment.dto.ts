import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePaymentDto } from './create-payment.dto';
import { PaymentStatus } from '../schemas/payment.schema';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @ApiPropertyOptional({ 
    description: 'Payment status',
    enum: PaymentStatus
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Transaction ID from payment processor' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Date when payment was processed' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  processedAt?: Date;

  @ApiPropertyOptional({ description: 'Failure reason if payment failed' })
  @IsOptional()
  @IsString()
  failureReason?: string;

  @ApiPropertyOptional({ description: 'Processing fee amount' })
  @IsOptional()
  processingFee?: number;

  @ApiPropertyOptional({ description: 'Platform fee amount' })
  @IsOptional()
  platformFee?: number;

  @ApiPropertyOptional({ description: 'Net amount after fees' })
  @IsOptional()
  netAmount?: number;

  @ApiPropertyOptional({ description: 'Whether payment is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}