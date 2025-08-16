import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentAction {
  CAPTURE = 'capture',
  CANCEL = 'cancel',
  REFUND = 'refund',
  RELEASE_ESCROW = 'release_escrow',
  EXTEND_ESCROW = 'extend_escrow',
  DISPUTE_PAYMENT = 'dispute_payment',
  APPROVE_PAYMENT = 'approve_payment',
  REJECT_PAYMENT = 'reject_payment',
}

export class PaymentActionDto {
  @ApiProperty({ 
    description: 'Action to perform on the payment',
    enum: PaymentAction
  })
  @IsNotEmpty()
  @IsEnum(PaymentAction)
  action: PaymentAction;

  @ApiPropertyOptional({ description: 'Reason for the action' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Refund amount (for partial refunds)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class EscrowReleaseDto {
  @ApiProperty({ description: 'Payment ID to release from escrow' })
  @IsNotEmpty()
  @IsString()
  paymentId: string;

  @ApiPropertyOptional({ description: 'Reason for releasing escrow' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Release amount (for partial release)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  releaseAmount?: number;
}

export class RefundDto {
  @ApiProperty({ description: 'Payment ID to refund' })
  @IsNotEmpty()
  @IsString()
  paymentId: string;

  @ApiPropertyOptional({ description: 'Refund amount (leave empty for full refund)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;

  @ApiProperty({ description: 'Reason for refund' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class WithdrawDto {
  @ApiProperty({ description: 'Amount to withdraw' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @ApiProperty({ description: 'Withdrawal method (bank account, etc.)' })
  @IsNotEmpty()
  @IsString()
  withdrawalMethod: string;

  @ApiPropertyOptional({ description: 'Additional withdrawal details' })
  @IsOptional()
  @IsString()
  details?: string;
}