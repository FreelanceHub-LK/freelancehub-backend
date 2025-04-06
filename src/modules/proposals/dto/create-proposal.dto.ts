import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsMongoId, 
  IsNumber, 
  IsPositive, 
  Min,
  IsOptional,
  IsArray
} from 'class-validator';

export class CreateProposalDto {
  @ApiProperty({ description: 'Freelancer ID submitting the proposal' })
  @IsMongoId()
  freelancer: string;

  @ApiProperty({ description: 'Project ID for the proposal' })
  @IsMongoId()
  project: string;

  @ApiProperty({ description: 'Cover letter or pitch' })
  @IsString()
  @IsNotEmpty()
  coverLetter: string;

  @ApiProperty({ description: 'Bid amount in LKR' })
  @IsNumber()
  @IsPositive()
  bidAmount: number;

  @ApiProperty({ description: 'Estimated days to complete the project' })
  @IsNumber()
  @Min(1)
  estimatedDays: number;

  @ApiProperty({ 
    description: 'Proposal attachments URLs',
    type: [String],
    required: false
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}